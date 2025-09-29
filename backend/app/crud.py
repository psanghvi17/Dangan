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


def create_candidate(db: Session, cand: schemas.CandidateCreate):
    c = models.Candidate(
        invoice_contact_name=cand.invoice_contact_name,
        invoice_email=cand.invoice_email,
        invoice_phone=cand.invoice_phone,
        address1=cand.address1,
        address2=cand.address2,
        town=cand.town,
        county=cand.county,
        eircode=cand.eircode,
        pps_number=cand.pps_number,
        date_of_birth=cand.date_of_birth,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


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
    
    entries = db.query(models.TimesheetEntry).filter(
        models.TimesheetEntry.timesheet_id == timesheet_id
    ).all()
    
    return {
        "timesheet_id": timesheet.timesheet_id,
        "status": timesheet.status,
        "month": timesheet.month,
        "week": timesheet.week,
        "date_range": timesheet.date_range,
        "entries": entries
    }


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
