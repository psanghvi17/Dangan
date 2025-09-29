from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from uuid import uuid4
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
