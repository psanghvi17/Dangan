from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from uuid import uuid4, UUID
from typing import Optional, List, Dict
from datetime import datetime, timedelta
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


# Client Rate CRUD operations
def create_client_rate(db: Session, client_rate: schemas.ClientRateCreate, created_by: Optional[str] = None):
    db_client_rate = models.ClientRate(
        client_id=client_rate.client_id,
        rate_type=client_rate.rate_type,
        rate_frequency=client_rate.rate_frequency,
        pay_rate=client_rate.pay_rate,
        bill_rate=client_rate.bill_rate,
        created_by=created_by  # Use the logged-in user's ID
    )
    db.add(db_client_rate)
    db.commit()
    db.refresh(db_client_rate)
    return db_client_rate


def get_client_rates(db: Session, client_id: str):
    return db.query(models.ClientRate).filter(
        models.ClientRate.client_id == client_id,
        models.ClientRate.deleted_on.is_(None)
    ).all()


def update_client_rate(db: Session, rate_id: str, client_rate: schemas.ClientRateUpdate, updated_by: Optional[str] = None):
    db_client_rate = db.query(models.ClientRate).filter(
        models.ClientRate.id == rate_id,
        models.ClientRate.deleted_on.is_(None)
    ).first()
    
    if db_client_rate:
        for field, value in client_rate.dict(exclude_unset=True).items():
            setattr(db_client_rate, field, value)
        db_client_rate.updated_on = func.now()
        db_client_rate.updated_by = updated_by  # Use the logged-in user's ID
        db.commit()
        db.refresh(db_client_rate)
    
    return db_client_rate


def soft_delete_client_rate(db: Session, rate_id: str, deleted_by: Optional[str] = None):
    db_client_rate = db.query(models.ClientRate).filter(
        models.ClientRate.id == rate_id,
        models.ClientRate.deleted_on.is_(None)
    ).first()
    
    if db_client_rate:
        db_client_rate.deleted_on = func.now()
        db_client_rate.deleted_by = deleted_by  # Use the logged-in user's ID
        db.commit()
        db.refresh(db_client_rate)
    
    return db_client_rate


def get_candidates_for_client(db: Session, client_id: str):
    """Get all candidates assigned to a specific client where pcc.status = 0"""
    try:
        from sqlalchemy.orm import aliased
        
        # Create aliases for the tables
        pcc = aliased(models.P_CandidateClient)
        mu = aliased(models.MUser)
        
        # Join p_candidate_client with m_user to get candidate info
        results = (
            db.query(
                mu.user_id,
                mu.first_name,
                mu.last_name,
                mu.email_id,
                pcc.placement_date,
                pcc.contract_start_date,
                pcc.contract_end_date,
                pcc.pcc_id
            )
            .join(mu, pcc.candidate_id == mu.user_id)
            .filter(pcc.client_id == client_id)
            .filter(pcc.status == 0)  # Only active assignments
            .filter(pcc.deleted_on.is_(None))
            .filter(mu.deleted_on.is_(None))
            .order_by(mu.first_name, mu.last_name)
            .all()
        )
        
        # Convert SQLAlchemy Row objects to dictionaries
        candidates = []
        for row in results:
            candidate = {
                'user_id': str(row.user_id),
                'first_name': row.first_name,
                'last_name': row.last_name,
                'email_id': row.email_id,
                'placement_date': row.placement_date.isoformat() if row.placement_date else None,
                'contract_start_date': row.contract_start_date.isoformat() if row.contract_start_date else None,
                'contract_end_date': row.contract_end_date.isoformat() if row.contract_end_date else None,
                'pcc_id': str(row.pcc_id)
            }
            candidates.append(candidate)
        
        return candidates
        
    except Exception as e:
        print(f"❌ Error getting candidates for client: {e}")
        import traceback
        traceback.print_exc()
        return []


# Rate Type and Frequency CRUD operations
def get_all_rate_types(db: Session):
    """Get all active rate types where deleted_on is null"""
    return db.query(models.RateType).filter(
        models.RateType.deleted_on.is_(None)
    ).order_by(models.RateType.rate_type_id).all()


def get_all_rate_frequencies(db: Session):
    """Get all active rate frequencies where deleted_on is null"""
    return db.query(models.RateFrequency).filter(
        models.RateFrequency.deleted_on.is_(None)
    ).order_by(models.RateFrequency.rate_frequency_id).all()


def get_clients_with_active_contracts_count(db: Session, skip: int = 0, limit: int = 100):
    """Get clients with count of active contracts (status=0) from p_candidate_client table"""
    from sqlalchemy import func, case
    
    return (
        db.query(
            models.Client,
            func.count(
                case(
                    (models.P_CandidateClient.status == 0, models.P_CandidateClient.pcc_id),
                    else_=None
                )
            ).label('active_contracts_count')
        )
        .outerjoin(
            models.P_CandidateClient, 
            models.Client.client_id == models.P_CandidateClient.client_id
        )
        .filter(models.Client.deleted_on.is_(None))
        .group_by(models.Client.client_id)
        .order_by(models.Client.created_on.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


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


def get_candidates_with_client_info(db: Session, skip: int = 0, limit: int = 100):
    """Get candidates with their active client information from p_candidate_client and m_client tables"""
    from sqlalchemy import func
    
    # Get candidates with their active client relationships
    results = (
        db.query(
            models.Candidate,
            models.Client.client_name,
            models.P_CandidateClient.contract_start_date,
            models.P_CandidateClient.contract_end_date
        )
        .outerjoin(
            models.P_CandidateClient,
            models.Candidate.candidate_id == models.P_CandidateClient.candidate_id
        )
        .outerjoin(
            models.Client,
            models.P_CandidateClient.client_id == models.Client.client_id
        )
        .filter(models.P_CandidateClient.status == 0)  # Only active contracts
        .order_by(models.Candidate.created_on.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    # Convert to proper schema format
    result = []
    for candidate, client_name, contract_start_date, contract_end_date in results:
        result.append(schemas.CandidateWithClient(
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
            created_on=candidate.created_on,
            client_name=client_name,
            contract_start_date=contract_start_date,
            contract_end_date=contract_end_date
        ))
    
    return result


def get_active_candidates(db: Session, skip: int = 0, limit: int = 100):
    """Get candidates who have entries in p_candidate_client table (active candidates)"""
    from sqlalchemy import func
    
    # Get candidates who have entries in p_candidate_client
    results = (
        db.query(
            models.Candidate,
            models.Client.client_name,
            models.P_CandidateClient.contract_start_date,
            models.P_CandidateClient.contract_end_date
        )
        .join(
            models.P_CandidateClient,
            models.Candidate.candidate_id == models.P_CandidateClient.candidate_id
        )
        .outerjoin(
            models.Client,
            models.P_CandidateClient.client_id == models.Client.client_id
        )
        .order_by(models.Candidate.created_on.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    # Convert to proper schema format
    result = []
    for candidate, client_name, contract_start_date, contract_end_date in results:
        result.append(schemas.CandidateWithClient(
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
            created_on=candidate.created_on,
            client_name=client_name,
            contract_start_date=contract_start_date,
            contract_end_date=contract_end_date
        ))
    
    return result


def get_pending_candidates(db: Session, skip: int = 0, limit: int = 100):
    """Get candidates who don't have any entries in p_candidate_client table (pending candidates)"""
    from sqlalchemy import func
    
    # Get candidates who don't have entries in p_candidate_client
    subquery = db.query(models.P_CandidateClient.candidate_id).subquery()
    
    results = (
        db.query(models.Candidate)
        .filter(~models.Candidate.candidate_id.in_(subquery))
        .order_by(models.Candidate.created_on.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    # Convert to proper schema format
    result = []
    for candidate in results:
        result.append(schemas.CandidateWithClient(
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
            created_on=candidate.created_on,
            client_name=None,  # No client for pending candidates
            contract_start_date=None,
            contract_end_date=None
        ))
    
    return result


def get_candidate_by_user_id(db: Session, user_id: str):
    """Get a specific candidate by user_id"""
    try:
        # Try to get user with candidate join first
        result = (
            db.query(models.MUser, models.Candidate)
            .join(models.Candidate, models.MUser.user_id == models.Candidate.candidate_id)
            .filter(models.MUser.user_id == user_id)
            .first()
        )
        
        if result:
            m_user, candidate = result
            print(f"🔍 Found candidate with join: {m_user.first_name} {m_user.last_name}")
            return m_user, candidate
        
        # If no result with join, try just getting the user
        print("🔍 No result with join, trying just user...")
        m_user = (
            db.query(models.MUser)
            .filter(models.MUser.user_id == user_id)
            .first()
        )
        
        if m_user:
            print(f"🔍 Found user without join: {m_user.first_name} {m_user.last_name}")
            return m_user, None
        
        print(f"❌ No candidate found with user_id: {user_id}")
        return None, None
        
    except Exception as e:
        print(f"❌ Error getting candidate by user_id: {e}")
        return None, None


def update_candidate(db: Session, user_id: str, candidate_data: dict):
    """Update a candidate by user_id"""
    try:
        print(f"🔄 Updating candidate with user_id: {user_id}")
        
        # Get the user first
        m_user = (
            db.query(models.MUser)
            .filter(models.MUser.user_id == user_id)
            .first()
        )
        
        if not m_user:
            print(f"❌ No user found with user_id: {user_id}")
            return None
        
        # Update user fields
        if 'first_name' in candidate_data:
            m_user.first_name = candidate_data['first_name']
        if 'last_name' in candidate_data:
            m_user.last_name = candidate_data['last_name']
        if 'email_id' in candidate_data:
            m_user.email_id = candidate_data['email_id']
        
        # Normalize invoice_email to a list if provided
        if 'invoice_email' in candidate_data:
            value = candidate_data['invoice_email']
            if value is None:
                candidate_data['invoice_email'] = None
            elif isinstance(value, list):
                candidate_data['invoice_email'] = value
            else:
                # assume string
                candidate_data['invoice_email'] = [value]

        # Update candidate fields if they exist
        candidate = (
            db.query(models.Candidate)
            .filter(models.Candidate.candidate_id == user_id)
            .first()
        )
        
        if candidate:
            if 'invoice_contact_name' in candidate_data:
                candidate.invoice_contact_name = candidate_data['invoice_contact_name']
            if 'invoice_email' in candidate_data:
                candidate.invoice_email = candidate_data['invoice_email']
        
        db.commit()
        db.refresh(m_user)
        
        print(f"✅ Successfully updated candidate: {m_user.first_name} {m_user.last_name}")
        return m_user
        
    except Exception as e:
        print(f"❌ Error updating candidate: {e}")
        db.rollback()
        return None


def get_all_clients(db: Session):
    """Get all clients for dropdown"""
    try:
        clients = (
            db.query(models.Client)
            .filter(models.Client.deleted_on.is_(None))
            .all()
        )
        print(f"🔍 Found {len(clients)} clients")
        return clients
    except Exception as e:
        print(f"❌ Error getting clients: {e}")
        return []


def create_candidate_client(db: Session, candidate_client_data: schemas.CandidateClientCreate):
    """Create a candidate-client relationship"""
    try:
        print(f"🔄 Creating candidate-client relationship: {candidate_client_data}")
        
        candidate_client = models.P_CandidateClient(
            candidate_id=candidate_client_data.candidate_id,
            client_id=candidate_client_data.client_id,
            placement_date=candidate_client_data.placement_date,
            contract_start_date=candidate_client_data.contract_start_date,
            contract_end_date=candidate_client_data.contract_end_date,
            status=candidate_client_data.status
        )
        
        db.add(candidate_client)
        db.commit()
        db.refresh(candidate_client)
        
        print(f"✅ Successfully created candidate-client relationship: {candidate_client.pcc_id}")
        return candidate_client
        
    except Exception as e:
        print(f"❌ Error creating candidate-client relationship: {e}")
        db.rollback()
        return None


def get_candidate_client_relationships(db: Session, candidate_id: str):
    """Get all client relationships for a candidate"""
    try:
        print(f"🔍 Getting client relationships for candidate: {candidate_id}")
        
        relationships = (
            db.query(models.P_CandidateClient)
            .filter(models.P_CandidateClient.candidate_id == candidate_id)
            .filter(models.P_CandidateClient.deleted_on.is_(None))
            .all()
        )
        
        print(f"🔍 Found {len(relationships)} client relationships")
        return relationships
        
    except Exception as e:
        print(f"❌ Error getting candidate-client relationships: {e}")
        return []


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


def get_latest_timesheet(db: Session):
    """Get the timesheet with the latest month (not by creation date)"""
    # Get all timesheets and find the one with the latest month
    all_timesheets = db.query(models.Timesheet).all()
    if not all_timesheets:
        return None
    
    # Find the timesheet with the latest month by comparing month strings
    latest_timesheet = None
    latest_date = None
    
    for timesheet in all_timesheets:
        if timesheet.month:
            # Parse month like "September 2025" to get a comparable date
            try:
                from datetime import datetime
                month_date = datetime.strptime(timesheet.month + ' 1', '%B %Y %d')
                if latest_date is None or month_date > latest_date:
                    latest_date = month_date
                    latest_timesheet = timesheet
            except:
                # If parsing fails, skip this timesheet
                continue
    
    if not latest_timesheet:
        return None
    
    return {
        "timesheet_id": str(latest_timesheet.timesheet_id),
        "month": latest_timesheet.month,
        "week": latest_timesheet.week,
        "status": latest_timesheet.status,
        "created_on": latest_timesheet.created_on.isoformat() if latest_timesheet.created_on else None
    }


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


def create_contractor_hours(db: Session, payload: schemas.ContractorHoursCreate):
    """Insert a record into app.t_contractor_hours"""
    row = models.ContractorHours(
        contractor_id=payload.contractor_id,
        work_date=payload.work_date,
        timesheet_id=payload.timesheet_id,
        pcc_id=payload.pcc_id,
        standard_hours=payload.standard_hours,
        on_call_hours=payload.on_call_hours,
        created_by=payload.created_by,
        status=payload.status,
        start_time=payload.start_time,
        end_time=payload.end_time,
        week=payload.week,
        day=payload.day,
        weekend_hours=payload.weekend_hours,
        bank_holiday_hours=payload.bank_holiday_hours,
        total_hours=payload.total_hours,
        project_no=payload.project_no,
        standard_bill_rate=payload.standard_bill_rate,
        standard_pay_rate=payload.standard_pay_rate,
        oncall_pay_rate=payload.oncall_pay_rate,
        oncall_bill_rate=payload.oncall_bill_rate,
        weekend_pay_rate=payload.weekend_pay_rate,
        weekend_bill_rate=payload.weekend_bill_rate,
        bankholiday_pay_rate=payload.bankholiday_pay_rate,
        bankholiday_bill_rate=payload.bankholiday_bill_rate,
        double_hours=payload.double_hours,
        triple_hours=payload.triple_hours,
        dedh_hours=payload.dedh_hours,
        tcr_id=payload.tcr_id,
        double_pay_rate=payload.double_pay_rate,
        double_bill_rate=payload.double_bill_rate,
        triple_bill_rate=payload.triple_bill_rate,
        triple_pay_rate=payload.triple_pay_rate,
        dedh_pay_rate=payload.dedh_pay_rate,
        dedh_bill_rate=payload.dedh_bill_rate,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def bulk_create_contractor_hours(db: Session, items: List[schemas.ContractorHoursCreate]):
    rows = []
    for payload in items:
        row = models.ContractorHours(
            contractor_id=payload.contractor_id,
            work_date=payload.work_date,
            timesheet_id=payload.timesheet_id,
            pcc_id=payload.pcc_id,
            standard_hours=payload.standard_hours,
            on_call_hours=payload.on_call_hours,
            created_by=payload.created_by,
            status=payload.status,
            start_time=payload.start_time,
            end_time=payload.end_time,
            week=payload.week,
            day=payload.day,
            weekend_hours=payload.weekend_hours,
            bank_holiday_hours=payload.bank_holiday_hours,
            total_hours=payload.total_hours,
            project_no=payload.project_no,
            standard_bill_rate=payload.standard_bill_rate,
            standard_pay_rate=payload.standard_pay_rate,
            oncall_pay_rate=payload.oncall_pay_rate,
            oncall_bill_rate=payload.oncall_bill_rate,
            weekend_pay_rate=payload.weekend_pay_rate,
            weekend_bill_rate=payload.weekend_bill_rate,
            bankholiday_pay_rate=payload.bankholiday_pay_rate,
            bankholiday_bill_rate=payload.bankholiday_bill_rate,
            double_hours=payload.double_hours,
            triple_hours=payload.triple_hours,
            dedh_hours=payload.dedh_hours,
            tcr_id=payload.tcr_id,
            double_pay_rate=payload.double_pay_rate,
            double_bill_rate=payload.double_bill_rate,
            triple_bill_rate=payload.triple_bill_rate,
            triple_pay_rate=payload.triple_pay_rate,
            dedh_pay_rate=payload.dedh_pay_rate,
            dedh_bill_rate=payload.dedh_bill_rate,
        )
        db.add(row)
        rows.append(row)
    db.commit()
    for r in rows:
        db.refresh(r)
    return rows


def list_contractor_hours_by_timesheet(db: Session, timesheet_id: str):
    return (
        db.query(models.ContractorHours)
        .filter(models.ContractorHours.timesheet_id == timesheet_id)
        .filter(models.ContractorHours.deleted_on.is_(None))
        .all()
    )


def upsert_contractor_hours(db: Session, items: List[schemas.ContractorHoursUpsert]):
    result = []
    for payload in items:
        print(f"🔍 DEBUG: Processing payload for contractor_id: {payload.contractor_id}")
        print(f"🔍 DEBUG: Has tch_id: {payload.tch_id is not None}")
        print(f"🔍 DEBUG: Has rate_hours: {payload.rate_hours is not None}")
        if payload.rate_hours:
            print(f"🔍 DEBUG: Rate hours count: {len(payload.rate_hours)}")
            for i, rate_hour in enumerate(payload.rate_hours):
                print(f"🔍 DEBUG: Rate hour {i}: quantity={rate_hour.quantity}, rate_type_id={rate_hour.rate_type_id}, rate_frequency_id={rate_hour.rate_frequency_id}")
        
        is_update = False
        if payload.tch_id:
            row = db.query(models.ContractorHours).filter(models.ContractorHours.tch_id == payload.tch_id).first()
            if row:
                print(f"🔍 DEBUG: Updating existing contractor hours with tch_id: {payload.tch_id}")
                data = payload.dict(exclude_unset=True)
                data.pop('tch_id', None)
                data.pop('rate_hours', None)  # Remove rate_hours from contractor hours data
                for k, v in data.items():
                    setattr(row, k, v)
                row.updated_on = func.now()
                result.append(row)
                is_update = True
                
                # Handle rate hours for existing contractor hours
                if payload.rate_hours:
                    print(f"🔍 DEBUG: Processing rate hours for existing tch_id: {payload.tch_id}")
                    
                    # Get existing rate hours for this tch_id
                    existing_rate_hours = db.query(models.ContractorRateHours).filter(
                        models.ContractorRateHours.tch_id == payload.tch_id,
                        models.ContractorRateHours.deleted_on.is_(None)
                    ).all()
                    
                    print(f"🔍 DEBUG: Found {len(existing_rate_hours)} existing rate hours")
                    
                    # Create a map of existing rate hours by rate_type_id and rate_frequency_id
                    existing_rate_map = {}
                    for existing_rate in existing_rate_hours:
                        key = f"{existing_rate.rate_type_id}-{existing_rate.rate_frequency_id}"
                        existing_rate_map[key] = existing_rate
                    
                    # Process new rate hours data
                    processed_rate_keys = set()
                    for rate_hour in payload.rate_hours:
                        if rate_hour.quantity and rate_hour.quantity > 0:  # Only process if quantity > 0
                            key = f"{rate_hour.rate_type_id}-{rate_hour.rate_frequency_id}"
                            processed_rate_keys.add(key)
                            
                            if key in existing_rate_map:
                                # Update existing record
                                existing_rate = existing_rate_map[key]
                                print(f"🔍 DEBUG: Updating existing rate hour {key}: quantity {existing_rate.quantity} -> {rate_hour.quantity}")
                                existing_rate.quantity = rate_hour.quantity
                                existing_rate.pay_rate = rate_hour.pay_rate
                                existing_rate.bill_rate = rate_hour.bill_rate
                                existing_rate.updated_on = func.now()
                                existing_rate.updated_by = getattr(payload, 'created_by', None)
                            else:
                                # Create new record
                                print(f"🔍 DEBUG: Creating new rate hour {key}: quantity={rate_hour.quantity}")
                                new_rate_hour = models.ContractorRateHours(
                                    tch_id=payload.tch_id,
                                    rate_frequency_id=rate_hour.rate_frequency_id,
                                    rate_type_id=rate_hour.rate_type_id,
                                    tcr_id=rate_hour.tcr_id,
                                    quantity=rate_hour.quantity,
                                    pay_rate=rate_hour.pay_rate,
                                    bill_rate=rate_hour.bill_rate,
                                    created_by=getattr(payload, 'created_by', None)
                                )
                                db.add(new_rate_hour)
                    
                    # Soft delete rate hours that are no longer in the payload
                    for key, existing_rate in existing_rate_map.items():
                        if key not in processed_rate_keys:
                            print(f"🔍 DEBUG: Soft deleting rate hour {key} (no longer in payload)")
                            existing_rate.deleted_on = func.now()
                            existing_rate.deleted_by = getattr(payload, 'created_by', None)
                continue
        
        # insert new contractor hours
        if not is_update:
            print(f"🔍 DEBUG: Creating new contractor hours for contractor_id: {payload.contractor_id}")
            row = models.ContractorHours(
                contractor_id=payload.contractor_id,
                work_date=payload.work_date,
                timesheet_id=payload.timesheet_id,
                pcc_id=payload.pcc_id,
                standard_hours=payload.standard_hours,
                on_call_hours=payload.on_call_hours,
                created_by=getattr(payload, 'created_by', None),
                status=payload.status,
                start_time=payload.start_time,
                end_time=payload.end_time,
                week=payload.week,
                day=payload.day,
                weekend_hours=payload.weekend_hours,
                bank_holiday_hours=payload.bank_holiday_hours,
                total_hours=payload.total_hours,
                project_no=payload.project_no,
                standard_bill_rate=payload.standard_bill_rate,
                standard_pay_rate=payload.standard_pay_rate,
                oncall_pay_rate=payload.oncall_pay_rate,
                oncall_bill_rate=payload.oncall_bill_rate,
                weekend_pay_rate=payload.weekend_pay_rate,
                weekend_bill_rate=payload.weekend_bill_rate,
                bankholiday_pay_rate=payload.bankholiday_pay_rate,
                bankholiday_bill_rate=payload.bankholiday_bill_rate,
                double_hours=payload.double_hours,
                triple_hours=payload.triple_hours,
                dedh_hours=payload.dedh_hours,
                tcr_id=payload.tcr_id,
                double_pay_rate=payload.double_pay_rate,
                double_bill_rate=payload.double_bill_rate,
                triple_bill_rate=payload.triple_bill_rate,
                triple_pay_rate=payload.triple_pay_rate,
                dedh_pay_rate=payload.dedh_pay_rate,
                dedh_bill_rate=payload.dedh_bill_rate,
            )
            db.add(row)
            db.flush()  # Flush to get the tch_id
            print(f"🔍 DEBUG: Created new contractor hours with tch_id: {row.tch_id}")
            result.append(row)
            
            # Handle rate hours for new contractor hours
            if payload.rate_hours:
                print(f"🔍 DEBUG: Processing rate hours for new tch_id: {row.tch_id}")
                for rate_hour in payload.rate_hours:
                    if rate_hour.quantity and rate_hour.quantity > 0:  # Only save if quantity > 0
                        key = f"{rate_hour.rate_type_id}-{rate_hour.rate_frequency_id}"
                        print(f"🔍 DEBUG: Creating new rate hour {key}: quantity={rate_hour.quantity}, tch_id={row.tch_id}")
                        new_rate_hour = models.ContractorRateHours(
                            tch_id=row.tch_id,
                            rate_frequency_id=rate_hour.rate_frequency_id,
                            rate_type_id=rate_hour.rate_type_id,
                            tcr_id=rate_hour.tcr_id,
                            quantity=rate_hour.quantity,
                            pay_rate=rate_hour.pay_rate,
                            bill_rate=rate_hour.bill_rate,
                            created_by=getattr(payload, 'created_by', None)
                        )
                        db.add(new_rate_hour)
    
    db.commit()
    for r in result:
        db.refresh(r)
    return result


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


def list_rate_types(db: Session) -> List[models.RateType]:
    try:
        print("🔍 Querying rate types...")
        result = db.query(models.RateType).all()
        print(f"✅ Found {len(result)} rate types")
        return result
    except Exception as e:
        print(f"❌ Error listing rate types: {e}")
        import traceback
        traceback.print_exc()
        return []


def list_rate_frequencies(db: Session) -> List[models.RateFrequency]:
    try:
        print("🔍 Querying rate frequencies...")
        result = db.query(models.RateFrequency).all()
        print(f"✅ Found {len(result)} rate frequencies")
        return result
    except Exception as e:
        print(f"❌ Error listing rate frequencies: {e}")
        import traceback
        traceback.print_exc()
        return []


def create_contract_rates(db: Session, pcc_id: str, rates: List[schemas.ContractRateCreate]) -> List[models.ContractRate]:
    try:
        created: List[models.ContractRate] = []
        for r in rates:
            row = models.ContractRate(
                pcc_id=pcc_id,
                rate_type=r.rate_type,
                rate_frequency=r.rate_frequency,
                pay_rate=r.pay_rate,
                bill_rate=r.bill_rate,
                date_applicable=r.date_applicable,
                date_end=r.date_end,
            )
            db.add(row)
            created.append(row)
        db.commit()
        for row in created:
            db.refresh(row)
        return created
    except Exception as e:
        print(f"❌ Error creating contract rates: {e}")
        db.rollback()
        return []


def get_active_pcc_id(db: Session, candidate_id: str, client_id: str) -> Optional[str]:
    try:
        row = (
            db.query(models.P_CandidateClient)
            .filter(models.P_CandidateClient.candidate_id == candidate_id)
            .filter(models.P_CandidateClient.client_id == client_id)
            .filter(models.P_CandidateClient.status == 0)
            .filter(models.P_CandidateClient.deleted_on.is_(None))
            .first()
        )
        return str(row.pcc_id) if row else None
    except Exception as e:
        print(f"❌ Error resolving active pcc_id: {e}")
        return None


def create_rates_for_candidate_client(db: Session, candidate_id: str, client_id: str, rates: List[schemas.ContractRateCreate]) -> List[models.ContractRate]:
    pcc_id = get_active_pcc_id(db, candidate_id, client_id)
    if not pcc_id:
        raise ValueError("Active candidate-client relationship not found (status=0)")
    return create_contract_rates(db, pcc_id, rates)


def list_contract_rates_by_pcc(db: Session, pcc_id: str) -> List[models.ContractRate]:
    try:
        rows = (
            db.query(models.ContractRate)
            .filter(models.ContractRate.pcc_id == pcc_id)
            .filter(models.ContractRate.deleted_on.is_(None))
            .order_by(models.ContractRate.created_on.desc())
            .all()
        )
        return rows
    except Exception as e:
        print(f"❌ Error listing contract rates by pcc: {e}")
        return []


def list_contract_rates_for_candidate_client(db: Session, candidate_id: str, client_id: str) -> List[models.ContractRate]:
    pcc_id = get_active_pcc_id(db, candidate_id, client_id)
    if not pcc_id:
        return []
    return list_contract_rates_by_pcc(db, pcc_id)


def update_contract_rate(db: Session, tcr_id: int, update: schemas.ContractRateUpdate) -> Optional[models.ContractRate]:
    try:
        row = db.query(models.ContractRate).filter(models.ContractRate.id == tcr_id).filter(models.ContractRate.deleted_on.is_(None)).first()
        if not row:
            return None
        data = {k: v for k, v in update.dict(exclude_unset=True).items()}
        for field, value in data.items():
            setattr(row, field, value)
        row.updated_on = func.now()
        db.commit()
        db.refresh(row)
        return row
    except Exception as e:
        print(f"❌ Error updating contract rate: {e}")
        db.rollback()
        return None


def soft_delete_contract_rate(db: Session, tcr_id: int) -> bool:
    try:
        row = db.query(models.ContractRate).filter(models.ContractRate.id == tcr_id).filter(models.ContractRate.deleted_on.is_(None)).first()
        if not row:
            return False
        row.deleted_on = func.now()
        db.commit()
        return True
    except Exception as e:
        print(f"❌ Error soft-deleting contract rate: {e}")
        db.rollback()
        return False


def get_contract_rates_for_candidate(db: Session, candidate_id: str) -> List[models.ContractRate]:
    """Get all contract rates for a candidate by going through p_candidate_client table"""
    try:
        print(f"🔍 Getting contract rates for candidate: {candidate_id}")
        
        # First get all active pcc_ids for this candidate
        pcc_relationships = (
            db.query(models.P_CandidateClient)
            .filter(models.P_CandidateClient.candidate_id == candidate_id)
            .filter(models.P_CandidateClient.deleted_on.is_(None))
            .all()
        )
        
        print(f"🔍 Found {len(pcc_relationships)} pcc_relationships for candidate: {candidate_id}")
        for rel in pcc_relationships:
            print(f"  - PCC ID: {rel.pcc_id}, Client ID: {rel.client_id}, Status: {rel.status}")
        
        if not pcc_relationships:
            print(f"🔍 No active candidate-client relationships found for candidate: {candidate_id}")
            return []
        
        pcc_ids = [str(rel.pcc_id) for rel in pcc_relationships]
        print(f"🔍 Found {len(pcc_ids)} active pcc_ids for candidate: {candidate_id}")
        
        # Get all contract rates for these pcc_ids
        contract_rates = (
            db.query(models.ContractRate)
            .filter(models.ContractRate.pcc_id.in_(pcc_ids))
            .filter(models.ContractRate.deleted_on.is_(None))
            .order_by(models.ContractRate.created_on.desc())
            .all()
        )
        
        print(f"🔍 Found {len(contract_rates)} contract rates for candidate: {candidate_id}")
        for rate in contract_rates:
            print(f"  - Rate ID: {rate.id}, Rate Type: {rate.rate_type}, Pay Rate: {rate.pay_rate}, Bill Rate: {rate.bill_rate}")
        
        return contract_rates
        
    except Exception as e:
        print(f"❌ Error getting contract rates for candidate: {e}")
        import traceback
        traceback.print_exc()
        return []


def get_all_rate_types(db: Session) -> List[models.RateType]:
    """Get all active rate types"""
    try:
        rate_types = (
            db.query(models.RateType)
            .filter(models.RateType.deleted_on.is_(None))
            .order_by(models.RateType.rate_type_name)
            .all()
        )
        return rate_types
    except Exception as e:
        print(f"❌ Error getting rate types: {e}")
        return []


def get_all_rate_frequencies(db: Session) -> List[models.RateFrequency]:
    """Get all active rate frequencies"""
    try:
        rate_frequencies = (
            db.query(models.RateFrequency)
            .filter(models.RateFrequency.deleted_on.is_(None))
            .order_by(models.RateFrequency.rate_frequency_name)
            .all()
        )
        return rate_frequencies
    except Exception as e:
        print(f"❌ Error getting rate frequencies: {e}")
        return []


def get_candidate_rates_matrix(db: Session, candidate_ids: List[str]) -> Dict[str, List[Dict]]:
    """Get rates matrix for multiple candidates - returns which rate_type/rate_frequency combinations each candidate has"""
    try:
        print(f"🔍 Getting rates matrix for candidates: {candidate_ids}")
        
        # Get all pcc_ids for these candidates
        pcc_relationships = (
            db.query(models.P_CandidateClient)
            .filter(models.P_CandidateClient.candidate_id.in_(candidate_ids))
            .filter(models.P_CandidateClient.deleted_on.is_(None))
            .all()
        )
        
        if not pcc_relationships:
            print(f"🔍 No pcc_relationships found for candidates")
            return {}
        
        pcc_ids = [str(rel.pcc_id) for rel in pcc_relationships]
        print(f"🔍 Found {len(pcc_ids)} pcc_ids")
        
        # Get all contract rates for these pcc_ids
        contract_rates = (
            db.query(models.ContractRate)
            .filter(models.ContractRate.pcc_id.in_(pcc_ids))
            .filter(models.ContractRate.deleted_on.is_(None))
            .all()
        )
        
        print(f"🔍 Found {len(contract_rates)} contract rates")
        
        # Group rates by candidate
        candidate_rates = {}
        for rel in pcc_relationships:
            candidate_id = str(rel.candidate_id)
            if candidate_id not in candidate_rates:
                candidate_rates[candidate_id] = []
        
        # Add rates to each candidate
        for rate in contract_rates:
            # Find which candidate this rate belongs to
            for rel in pcc_relationships:
                if str(rel.pcc_id) == str(rate.pcc_id):
                    candidate_id = str(rel.candidate_id)
                    candidate_rates[candidate_id].append({
                        'rate_type': rate.rate_type,
                        'rate_frequency': rate.rate_frequency,
                        'pay_rate': rate.pay_rate,
                        'bill_rate': rate.bill_rate,
                        'rate_id': rate.id,
                        'deleted_on': rate.deleted_on.isoformat() if rate.deleted_on else None
                    })
                    break
        
        print(f"🔍 Candidate rates matrix: {candidate_rates}")
        return candidate_rates
        
    except Exception as e:
        print(f"❌ Error getting candidate rates matrix: {e}")
        import traceback
        traceback.print_exc()
        return {}

def get_candidate_client_info(db: Session, candidate_ids: List[str]) -> Dict[str, str]:
    """Get client information for multiple candidates using proper joins"""
    try:
        print(f"🔍 Getting client info for candidates: {candidate_ids}")
        
        # Use proper JOIN to get client names directly
        from sqlalchemy.orm import aliased
        
        # Create aliases for the tables
        pcc = aliased(models.P_CandidateClient)
        mc = aliased(models.Client)
        
        # Join p_candidate_client with m_client to get client names
        results = (
            db.query(pcc.candidate_id, mc.client_name)
            .join(mc, pcc.client_id == mc.client_id)
            .filter(pcc.candidate_id.in_(candidate_ids))
            .filter(pcc.deleted_on.is_(None))
            .filter(mc.deleted_on.is_(None))
            .all()
        )
        
        print(f"🔍 Found {len(results)} candidate-client relationships with client names")
        
        # Create mapping of candidate_id to client_name
        candidate_client_info = {}
        for candidate_id, client_name in results:
            candidate_id_str = str(candidate_id)
            client_name_str = client_name or 'Unknown Client'
            candidate_client_info[candidate_id_str] = client_name_str
            print(f"🔍 Mapped candidate {candidate_id_str} to client: {client_name_str}")
        
        # Add 'Unknown Client' for candidates not found in relationships
        for candidate_id in candidate_ids:
            if str(candidate_id) not in candidate_client_info:
                candidate_client_info[str(candidate_id)] = 'Unknown Client'
                print(f"🔍 No relationship found for candidate {candidate_id}")
        
        print(f"🔍 Final candidate client info: {candidate_client_info}")
        return candidate_client_info
        
    except Exception as e:
        print(f"❌ Error getting candidate client info: {e}")
        import traceback
        traceback.print_exc()
        return {}


def get_candidate_pcc_info(db: Session, candidate_ids: List[str]) -> Dict[str, Dict[str, str]]:
    """Get client information and pcc_id for multiple candidates using proper joins"""
    try:
        print(f"🔍 Getting pcc info for candidates: {candidate_ids}")
        
        # Use proper JOIN to get client names and pcc_id
        from sqlalchemy.orm import aliased
        
        # Create aliases for the tables
        pcc = aliased(models.P_CandidateClient)
        mc = aliased(models.Client)
        
        # Join p_candidate_client with m_client to get client names and pcc_id
        results = (
            db.query(pcc.candidate_id, mc.client_name, pcc.pcc_id)
            .join(mc, pcc.client_id == mc.client_id)
            .filter(pcc.candidate_id.in_(candidate_ids))
            .filter(pcc.deleted_on.is_(None))
            .filter(mc.deleted_on.is_(None))
            .all()
        )
        
        print(f"🔍 Found {len(results)} candidate-client relationships with client names and pcc_id")
        
        # Create mapping of candidate_id to {client_name, pcc_id}
        candidate_pcc_info = {}
        for candidate_id, client_name, pcc_id in results:
            candidate_id_str = str(candidate_id)
            client_name_str = client_name or 'Unknown Client'
            pcc_id_str = str(pcc_id) if pcc_id else None
            candidate_pcc_info[candidate_id_str] = {
                'client_name': client_name_str,
                'pcc_id': pcc_id_str
            }
        
        print(f"✅ Candidate pcc info result: {candidate_pcc_info}")
        return candidate_pcc_info
    except Exception as e:
        print(f"❌ Error getting candidate pcc info: {e}")
        import traceback
        traceback.print_exc()
        return {}


def create_contract_with_rates(db: Session, contract_data: schemas.ContractWithRatesCreate) -> schemas.ContractWithRatesOut:
    """Create or update contract with rates in a single transaction"""
    try:
        print(f"🚀 Creating/updating contract with rates: {contract_data}")
        
        # Check if pcc_id is provided
        if contract_data.pcc_id:
            # Update existing relationship
            print(f"🔄 Updating existing relationship: {contract_data.pcc_id}")
            pcc = db.query(models.P_CandidateClient).filter(models.P_CandidateClient.pcc_id == contract_data.pcc_id).first()
            if not pcc:
                raise ValueError(f"Contract relationship {contract_data.pcc_id} not found")
            
            # Update relationship fields
            pcc.placement_date = contract_data.placement_date
            pcc.contract_start_date = contract_data.contract_start_date
            pcc.contract_end_date = contract_data.contract_end_date
            pcc.status = contract_data.status
            pcc.updated_on = func.now()
            
            pcc_id = pcc.pcc_id
            print(f"✅ Updated existing relationship: {pcc_id}")
        else:
            # Create new relationship
            print(f"🆕 Creating new relationship")
            pcc = models.P_CandidateClient(
                candidate_id=contract_data.candidate_id,
                client_id=contract_data.client_id,
                placement_date=contract_data.placement_date,
                contract_start_date=contract_data.contract_start_date,
                contract_end_date=contract_data.contract_end_date,
                status=contract_data.status
            )
            db.add(pcc)
            db.flush()  # Get the pcc_id
            pcc_id = pcc.pcc_id
            print(f"✅ Created new relationship: {pcc_id}")
        
        # Handle rates - only if rates are provided
        created_rates = []
        if contract_data.rates and len(contract_data.rates) > 0:
            print(f"🔄 Processing {len(contract_data.rates)} rates")
            
            # If tcr_ids provided, update existing rates
            if contract_data.tcr_ids and len(contract_data.tcr_ids) > 0:
                print(f"🔄 Updating existing rates: {contract_data.tcr_ids}")
                for i, rate_data in enumerate(contract_data.rates):
                    if i < len(contract_data.tcr_ids) and contract_data.tcr_ids[i]:
                        # Update existing rate using the correct field name 'id'
                        tcr_id = contract_data.tcr_ids[i]
                        existing_rate = db.query(models.ContractRate).filter(models.ContractRate.id == tcr_id).first()
                        if existing_rate:
                            existing_rate.rate_type = rate_data.rate_type
                            existing_rate.rate_frequency = rate_data.rate_frequency
                            existing_rate.pay_rate = rate_data.pay_rate
                            existing_rate.bill_rate = rate_data.bill_rate
                            existing_rate.date_applicable = rate_data.date_applicable
                            existing_rate.date_end = rate_data.date_end
                            existing_rate.updated_on = func.now()
                            created_rates.append(existing_rate)
                            print(f"✅ Updated existing rate: {tcr_id}")
                        else:
                            print(f"⚠️ Rate with id {tcr_id} not found, creating new rate")
                            # Create new rate if existing not found
                            new_rate = models.ContractRate(
                                pcc_id=pcc_id,
                                rate_type=rate_data.rate_type,
                                rate_frequency=rate_data.rate_frequency,
                                pay_rate=rate_data.pay_rate,
                                bill_rate=rate_data.bill_rate,
                                date_applicable=rate_data.date_applicable,
                                date_end=rate_data.date_end
                            )
                            db.add(new_rate)
                            db.flush()
                            created_rates.append(new_rate)
                            print(f"✅ Created new rate for pcc: {pcc_id}")
                    else:
                        # Create new rate for this pcc_id
                        new_rate = models.ContractRate(
                            pcc_id=pcc_id,
                            rate_type=rate_data.rate_type,
                            rate_frequency=rate_data.rate_frequency,
                            pay_rate=rate_data.pay_rate,
                            bill_rate=rate_data.bill_rate,
                            date_applicable=rate_data.date_applicable,
                            date_end=rate_data.date_end
                        )
                        db.add(new_rate)
                        db.flush()
                        created_rates.append(new_rate)
                        print(f"✅ Created new rate for pcc: {pcc_id}")
            else:
                # Create all new rates for this pcc_id
                print(f"🆕 Creating all new rates for pcc: {pcc_id}")
                for rate_data in contract_data.rates:
                    new_rate = models.ContractRate(
                        pcc_id=pcc_id,
                        rate_type=rate_data.rate_type,
                        rate_frequency=rate_data.rate_frequency,
                        pay_rate=rate_data.pay_rate,
                        bill_rate=rate_data.bill_rate,
                        date_applicable=rate_data.date_applicable,
                        date_end=rate_data.date_end
                    )
                    db.add(new_rate)
                    db.flush()
                    created_rates.append(new_rate)
                print(f"✅ Created {len(contract_data.rates)} new rates for pcc: {pcc_id}")
        else:
            print("ℹ️ No rates provided, skipping rate creation/update")
        
        # Commit transaction
        db.commit()
        db.refresh(pcc)
        
        # Refresh rates to get latest data
        for rate in created_rates:
            db.refresh(rate)
        
        print(f"✅ Successfully created/updated contract with {len(created_rates)} rates")
        
        # Return the result
        return schemas.ContractWithRatesOut(
            pcc_id=pcc.pcc_id,
            candidate_id=pcc.candidate_id,
            client_id=pcc.client_id,
            placement_date=pcc.placement_date,
            contract_start_date=pcc.contract_start_date,
            contract_end_date=pcc.contract_end_date,
            status=pcc.status,
            created_on=pcc.created_on,
            rates=[schemas.ContractRateOut.model_validate(rate) for rate in created_rates]
        )
        
    except Exception as e:
        print(f"❌ Error creating contract with rates: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
        raise e


# Contractor Rate Hours CRUD operations
def create_contractor_rate_hours(db: Session, rate_hours: schemas.ContractorRateHoursCreate):
    """Create a single contractor rate hours entry"""
    db_rate_hours = models.ContractorRateHours(
        tch_id=rate_hours.tch_id,
        rate_frequency_id=rate_hours.rate_frequency_id,
        rate_type_id=rate_hours.rate_type_id,
        tcr_id=rate_hours.tcr_id,
        quantity=rate_hours.quantity,
        pay_rate=rate_hours.pay_rate,
        bill_rate=rate_hours.bill_rate,
        created_by=rate_hours.created_by
    )
    db.add(db_rate_hours)
    db.commit()
    db.refresh(db_rate_hours)
    return db_rate_hours


def create_multiple_contractor_rate_hours(db: Session, multiple_rates: schemas.MultipleRateHoursCreate):
    """Create multiple contractor rate hours entries for a single tch_id"""
    created_rates = []
    
    for rate_entry in multiple_rates.rate_entries:
        db_rate_hours = models.ContractorRateHours(
            tch_id=multiple_rates.tch_id,
            rate_frequency_id=rate_entry.rate_frequency_id,
            rate_type_id=rate_entry.rate_type_id,
            tcr_id=rate_entry.tcr_id,
            quantity=rate_entry.quantity,
            pay_rate=rate_entry.pay_rate,
            bill_rate=rate_entry.bill_rate,
            created_by=multiple_rates.created_by
        )
        db.add(db_rate_hours)
        created_rates.append(db_rate_hours)
    
    db.commit()
    
    # Refresh all created records
    for rate in created_rates:
        db.refresh(rate)
    
    return created_rates


def upsert_multiple_contractor_rate_hours(db: Session, multiple_rates: schemas.MultipleRateHoursCreate):
    """Upsert multiple contractor rate hours entries for a single tch_id"""
    result_rates = []
    
    # First, soft delete all existing rate hours for this tch_id
    existing_rates = db.query(models.ContractorRateHours).filter(
        models.ContractorRateHours.tch_id == multiple_rates.tch_id,
        models.ContractorRateHours.deleted_on.is_(None)
    ).all()
    
    for existing_rate in existing_rates:
        existing_rate.deleted_on = func.now()
        existing_rate.deleted_by = multiple_rates.created_by
    
    # Then create new entries
    for rate_entry in multiple_rates.rate_entries:
        db_rate_hours = models.ContractorRateHours(
            tch_id=multiple_rates.tch_id,
            rate_frequency_id=rate_entry.rate_frequency_id,
            rate_type_id=rate_entry.rate_type_id,
            tcr_id=rate_entry.tcr_id,
            quantity=rate_entry.quantity,
            pay_rate=rate_entry.pay_rate,
            bill_rate=rate_entry.bill_rate,
            created_by=multiple_rates.created_by
        )
        db.add(db_rate_hours)
        result_rates.append(db_rate_hours)
    
    db.commit()
    
    # Refresh all created records
    for rate in result_rates:
        db.refresh(rate)
    
    return result_rates


def get_contractor_rate_hours_by_tch_id(db: Session, tch_id: UUID):
    """Get all rate hours entries for a specific contractor hours record"""
    return db.query(models.ContractorRateHours).filter(
        models.ContractorRateHours.tch_id == tch_id,
        models.ContractorRateHours.deleted_on.is_(None)
    ).all()


def update_contractor_rate_hours(db: Session, tcrh_id: int, rate_hours_update: schemas.ContractorRateHoursUpdate):
    """Update a contractor rate hours entry"""
    db_rate_hours = db.query(models.ContractorRateHours).filter(
        models.ContractorRateHours.tcrh_id == tcrh_id,
        models.ContractorRateHours.deleted_on.is_(None)
    ).first()
    
    if not db_rate_hours:
        return None
    
    update_data = rate_hours_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_rate_hours, field, value)
    
    db_rate_hours.updated_on = func.now()
    db.commit()
    db.refresh(db_rate_hours)
    return db_rate_hours


def delete_contractor_rate_hours(db: Session, tcrh_id: int, deleted_by: UUID):
    """Soft delete a contractor rate hours entry"""
    db_rate_hours = db.query(models.ContractorRateHours).filter(
        models.ContractorRateHours.tcrh_id == tcrh_id,
        models.ContractorRateHours.deleted_on.is_(None)
    ).first()
    
    if not db_rate_hours:
        return None
    
    db_rate_hours.deleted_on = func.now()
    db_rate_hours.deleted_by = deleted_by
    db.commit()
    db.refresh(db_rate_hours)
    return db_rate_hours


def delete_all_contractor_rate_hours_for_tch(db: Session, tch_id: UUID, deleted_by: UUID):
    """Soft delete all rate hours entries for a specific contractor hours record"""
    db_rate_hours = db.query(models.ContractorRateHours).filter(
        models.ContractorRateHours.tch_id == tch_id,
        models.ContractorRateHours.deleted_on.is_(None)
    ).all()
    
    for rate_hours in db_rate_hours:
        rate_hours.deleted_on = func.now()
        rate_hours.deleted_by = deleted_by
    
    db.commit()
    return len(db_rate_hours)


# MUser Authentication CRUD
def get_m_user_by_email(db: Session, email: str):
    """Get MUser by email"""
    return db.query(models.MUser).filter(models.MUser.email_id == email).filter(models.MUser.deleted_on.is_(None)).first()


def create_m_user_auth(db: Session, user_data: schemas.MUserSignup):
    """Create a new MUser for authentication"""
    hashed_password = get_password_hash(user_data.password)
    db_user = models.MUser(
        first_name=user_data.first_name,
        email_id=user_data.email_id,
        pass_=hashed_password
        # No role_id required - removed role-based access
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def create_password_reset_token(db: Session, email: str) -> Optional[str]:
    """Create a password reset token for a user"""
    user = get_m_user_by_email(db, email)
    if not user:
        return None
    
    # Generate a new UUID token
    reset_token = uuid4()
    
    # Set token expiry to 1 hour from now
    expiry = datetime.now() + timedelta(hours=1)
    
    user.pass_reset_token = reset_token
    user.pass_reset_token_expiry = expiry
    
    db.commit()
    db.refresh(user)
    
    return str(reset_token)


def verify_password_reset_token(db: Session, token: str) -> Optional[models.MUser]:
    """Verify password reset token and return user if valid"""
    try:
        token_uuid = UUID(token)
    except ValueError:
        return None
    
    user = db.query(models.MUser).filter(
        models.MUser.pass_reset_token == token_uuid,
        models.MUser.deleted_on.is_(None)
    ).first()
    
    if not user:
        return None
    
    # Check if token has expired
    if user.pass_reset_token_expiry and user.pass_reset_token_expiry < datetime.now():
        return None
    
    return user


def reset_user_password(db: Session, token: str, new_password: str) -> bool:
    """Reset user password using reset token"""
    user = verify_password_reset_token(db, token)
    if not user:
        return False
    
    # Update password
    user.pass_ = get_password_hash(new_password)
    
    # Clear reset token
    user.pass_reset_token = None
    user.pass_reset_token_expiry = None
    user.force_reset_pass = False
    
    db.commit()
    return True


# Cost Center CRUD operations
def get_cost_centers_by_client(db: Session, client_id: UUID) -> List[models.CostCenter]:
    """Get all cost centers for a specific client"""
    return db.query(models.CostCenter).filter(
        models.CostCenter.client_id == client_id,
        models.CostCenter.deleted_on.is_(None)
    ).all()


def get_cost_center(db: Session, cost_center_id: UUID) -> Optional[models.CostCenter]:
    """Get a specific cost center by ID"""
    return db.query(models.CostCenter).filter(
        models.CostCenter.id == cost_center_id,
        models.CostCenter.deleted_on.is_(None)
    ).first()


def create_cost_center(db: Session, cost_center: schemas.CostCenterCreate, created_by: UUID = None) -> models.CostCenter:
    """Create a new cost center"""
    db_cost_center = models.CostCenter(
        client_id=cost_center.client_id,
        cc_name=cost_center.cc_name,
        cc_number=cost_center.cc_number,
        cc_address=cost_center.cc_address,
        created_by=created_by,
        created_on=datetime.now()
    )
    db.add(db_cost_center)
    db.commit()
    db.refresh(db_cost_center)
    return db_cost_center


def update_cost_center(db: Session, cost_center_id: UUID, cost_center_update: schemas.CostCenterUpdate, updated_by: UUID = None) -> Optional[models.CostCenter]:
    """Update an existing cost center"""
    db_cost_center = get_cost_center(db, cost_center_id)
    if not db_cost_center:
        return None
    
    update_data = cost_center_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_cost_center, field, value)
    
    db_cost_center.updated_by = updated_by
    db_cost_center.updated_on = datetime.now()
    
    db.commit()
    db.refresh(db_cost_center)
    return db_cost_center


def delete_cost_center(db: Session, cost_center_id: UUID, deleted_by: UUID = None) -> bool:
    """Soft delete a cost center"""
    db_cost_center = get_cost_center(db, cost_center_id)
    if not db_cost_center:
        return False
    
    db_cost_center.deleted_by = deleted_by
    db_cost_center.deleted_on = datetime.now()
    
    db.commit()
    return True
