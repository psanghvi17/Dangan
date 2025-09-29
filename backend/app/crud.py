from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from uuid import uuid4
from typing import Optional
from . import models, schemas
from .auth import get_password_hash


def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_item(db: Session, item_id: int):
    return db.query(models.Item).filter(models.Item.id == item_id).first()


def get_items(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Item).offset(skip).limit(limit).all()


def create_item(db: Session, item: schemas.ItemCreate):
    db_item = models.Item(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def update_item(db: Session, item_id: int, item: schemas.ItemUpdate):
    db_item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if db_item:
        update_data = item.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_item, field, value)
        db.commit()
        db.refresh(db_item)
    return db_item


def delete_item(db: Session, item_id: int):
    db_item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if db_item:
        db.delete(db_item)
        db.commit()
    return db_item


# Client CRUD
def create_client(db: Session, client: schemas.ClientCreate):
    db_client = models.Client(
        client_id=uuid4(),
        client_name=client.client_name,
        email=client.email,
        description=client.description,
        contact_email=client.contact_email,
        contact_name=client.contact_name,
        contact_phone=client.contact_phone,
    )
    db.add(db_client)
    db.commit()
    # Refresh to load server-generated fields (e.g., created_on, client_id when server_default is used)
    db.refresh(db_client)
    return db_client


def get_clients(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(models.Client)
        .filter(models.Client.deleted_on.is_(None))  # Only get non-deleted clients
        .order_by(models.Client.created_on.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def count_clients(db: Session):
    return (
        db.query(models.Client)
        .filter(models.Client.deleted_on.is_(None))
        .count()
    )


def get_client(db: Session, client_id: str):
    return (
        db.query(models.Client)
        .filter(models.Client.client_id == client_id)
        .filter(models.Client.deleted_on.is_(None))  # Only get non-deleted client
        .first()
    )


def update_client(db: Session, client_id: str, client: schemas.ClientUpdate):
    db_client = db.query(models.Client).filter(models.Client.client_id == client_id).first()
    if db_client:
        update_data = client.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_client, field, value)
        db_client.updated_on = func.now()
        db.commit()
        db.refresh(db_client)
    return db_client


def soft_delete_client(db: Session, client_id: str, deleted_by: str):
    db_client = db.query(models.Client).filter(models.Client.client_id == client_id).first()
    if db_client:
        db_client.deleted_on = func.now()
        db_client.deleted_by = deleted_by
        db.commit()
        db.refresh(db_client)
    return db_client


def create_m_user(db: Session, payload: schemas.MUserCreate):
    # Create user in app.m_user without forcing role_id (to avoid FK violations)
    m_user = models.MUser(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email_id=payload.email_id,
        role_id=4  # Set role_id to 4 for candidates
    )
    db.add(m_user)
    db.flush()  # Get the user_id without committing yet
    
    # Create candidate in app.m_candidate with candidate_id = user.user_id
    candidate = models.Candidate(
        candidate_id=m_user.user_id,
        invoice_contact_name=f"{payload.first_name} {payload.last_name}",
        invoice_email=[payload.email_id],  # Pass as array
    )
    db.add(candidate)
    db.commit()
    db.refresh(m_user)
    return m_user


def get_candidates_paginated(db: Session, skip: int = 0, limit: int = 10):
    """Get paginated list of candidates with user details"""
    from sqlalchemy import and_, or_
    
    # First try to get all users that have candidates (more flexible approach)
    try:
        query = (
            db.query(models.MUser, models.Candidate)
            .join(models.Candidate, models.MUser.user_id == models.Candidate.candidate_id)
            .filter(
                or_(
                    models.MUser.deleted_on.is_(None),
                    models.MUser.deleted_on.is_(None)  # This will match NULL values
                )
            )
            .order_by(models.MUser.created_on.desc())
            .offset(skip)
            .limit(limit)
        )
        
        results = query.all()
        print(f"🔍 Found {len(results)} candidates with join")
        
        # If no results with join, try just getting all users
        if len(results) == 0:
            print("🔍 No results with join, trying all users...")
            users_query = (
                db.query(models.MUser)
                .filter(models.MUser.deleted_on.is_(None))
                .order_by(models.MUser.created_on.desc())
                .offset(skip)
                .limit(limit)
            )
            users = users_query.all()
            print(f"🔍 Found {len(users)} users without join")
            
            # Convert to the expected format (user, None for candidate)
            results = [(user, None) for user in users]
        
        return results
        
    except Exception as e:
        print(f"❌ Error in get_candidates_paginated: {e}")
        # Fallback: just get all users
        users_query = (
            db.query(models.MUser)
            .filter(models.MUser.deleted_on.is_(None))
            .order_by(models.MUser.created_on.desc())
            .offset(skip)
            .limit(limit)
        )
        users = users_query.all()
        print(f"🔍 Fallback: Found {len(users)} users")
        return [(user, None) for user in users]


def count_candidates(db: Session):
    """Count total number of candidates"""
    from sqlalchemy import or_
    
    try:
        # Try with join first
        count = (
            db.query(models.MUser)
            .join(models.Candidate, models.MUser.user_id == models.Candidate.candidate_id)
            .filter(
                or_(
                    models.MUser.deleted_on.is_(None),
                    models.MUser.deleted_on.is_(None)  # This will match NULL values
                )
            )
            .count()
        )
        print(f"🔍 Total candidates count with join: {count}")
        
        # If no results with join, try just counting all users
        if count == 0:
            count = (
                db.query(models.MUser)
                .filter(models.MUser.deleted_on.is_(None))
                .count()
            )
            print(f"🔍 Total users count without join: {count}")
        
        return count
        
    except Exception as e:
        print(f"❌ Error in count_candidates: {e}")
        # Fallback: just count all users
        count = (
            db.query(models.MUser)
            .filter(models.MUser.deleted_on.is_(None))
            .count()
        )
        print(f"🔍 Fallback count: {count}")
        return count


def get_candidates(db: Session, skip: int = 0, limit: int = 100):
    candidates = (
        db.query(models.Candidate)
        .order_by(models.Candidate.created_on.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    # Convert to proper schema format
    result = []
    for candidate in candidates:
        result.append(schemas.Candidate(
            candidate_id=str(candidate.candidate_id),
            invoice_contact_name=candidate.invoice_contact_name,
            invoice_email=candidate.invoice_email[0] if isinstance(candidate.invoice_email, list) and candidate.invoice_email else candidate.invoice_email,
            invoice_phone=candidate.invoice_phone,
            address1=candidate.address1,
            address2=candidate.address2,
            town=candidate.town,
            county=candidate.county,
            eircode=candidate.eircode,
            pps_number=candidate.pps_number,
            date_of_birth=candidate.date_of_birth,
            created_on=candidate.created_on
        ))
    
    return result


# Timesheets CRUD
def list_timesheet_summaries(db: Session, month_label: Optional[str] = None):
    query = db.query(models.Timesheet)
    if month_label:
        query = query.filter(models.Timesheet.month == month_label)
    rows = query.order_by(models.Timesheet.created_on.desc()).all()
    # Map to DTO-style dict keys used by frontend
    result = [
        {
            "timesheet_id": r.timesheet_id,
            "weekLabel": r.week or f"Week {i+1}",  # Use stored week or generate
            "monthLabel": r.month or "Unknown",
            "filledCount": 0,  # Mock data for now
            "notFilledCount": 0,  # Mock data for now
            "status": r.status or "Open",
        }
        for i, r in enumerate(rows)
    ]
    return result


def get_timesheet_detail(db: Session, timesheet_id: str):
    """Get timesheet with all its entries"""
    timesheet = db.query(models.Timesheet).filter(models.Timesheet.timesheet_id == timesheet_id).first()
    if not timesheet:
        return None
    
    # Get existing entries for this timesheet
    entries = db.query(models.TimesheetEntry).filter(
        models.TimesheetEntry.timesheet_id == timesheet_id
    ).all()
    
    # Convert entries to proper schema objects
    entry_objects = []
    for entry in entries:
        entry_objects.append(schemas.TimesheetEntry(
            entry_id=entry.entry_id,
            timesheet_id=entry.timesheet_id,
            employee_name=entry.employee_name,
            employee_code=entry.employee_code,
            client_name=entry.client_name,
            filled=entry.filled,
            standard_hours=entry.standard_hours,
            rate2_hours=entry.rate2_hours,
            rate3_hours=entry.rate3_hours,
            rate4_hours=entry.rate4_hours,
            rate5_hours=entry.rate5_hours,
            rate6_hours=entry.rate6_hours,
            holiday_hours=entry.holiday_hours,
            bank_holiday_hours=entry.bank_holiday_hours,
            created_on=entry.created_on,
            updated_on=entry.updated_on
        ))
    
    return schemas.TimesheetDetail(
        timesheet_id=timesheet.timesheet_id,
        status=timesheet.status,
        month=timesheet.month,
        week=timesheet.week,
        date_range=timesheet.date_range,
        entries=entry_objects
    )


def create_timesheet_entry(db: Session, entry: schemas.TimesheetEntryCreate):
    """Create a new timesheet entry"""
    db_entry = models.TimesheetEntry(
        timesheet_id=entry.timesheet_id,
        employee_name=entry.employee_name,
        employee_code=entry.employee_code,
        client_name=entry.client_name,
        filled=entry.filled,
        standard_hours=entry.standard_hours,
        rate2_hours=entry.rate2_hours,
        rate3_hours=entry.rate3_hours,
        rate4_hours=entry.rate4_hours,
        rate5_hours=entry.rate5_hours,
        rate6_hours=entry.rate6_hours,
        holiday_hours=entry.holiday_hours,
        bank_holiday_hours=entry.bank_holiday_hours,
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry


def update_timesheet_entry(db: Session, entry_id: str, entry_update: schemas.TimesheetEntryUpdate):
    """Update a timesheet entry"""
    db_entry = db.query(models.TimesheetEntry).filter(models.TimesheetEntry.entry_id == entry_id).first()
    if db_entry:
        update_data = entry_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_entry, field, value)
        db_entry.updated_on = func.now()
        db.commit()
        db.refresh(db_entry)
    return db_entry


def get_or_create_timesheet_entries_for_candidates(db: Session, timesheet_id: str):
    """Get or create timesheet entries for all candidates"""
    # Get all candidates
    candidates = db.query(models.Candidate).all()
    
    # Get existing entries for this timesheet
    existing_entries = db.query(models.TimesheetEntry).filter(
        models.TimesheetEntry.timesheet_id == timesheet_id
    ).all()
    
    existing_candidate_ids = {entry.employee_code for entry in existing_entries}
    
    # Create entries for candidates that don't have entries yet
    new_entries = []
    for candidate in candidates:
        if candidate.candidate_id not in existing_candidate_ids:
            entry = models.TimesheetEntry(
                timesheet_id=timesheet_id,
                employee_name=candidate.invoice_contact_name or "Unknown",
                employee_code=candidate.candidate_id,
                client_name="TBD",  # Will be set when assigned to a client
                filled=False,
                standard_hours=0,
                rate2_hours=0,
                rate3_hours=0,
                rate4_hours=0,
                rate5_hours=0,
                rate6_hours=0,
                holiday_hours=0,
                bank_holiday_hours=0,
            )
            db.add(entry)
            new_entries.append(entry)
    
    if new_entries:
        db.commit()
        for entry in new_entries:
            db.refresh(entry)
    
    # Return all entries for this timesheet
    return db.query(models.TimesheetEntry).filter(
        models.TimesheetEntry.timesheet_id == timesheet_id
    ).all()
