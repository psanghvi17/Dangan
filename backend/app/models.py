from sqlalchemy import Column, Integer, String, DateTime, Boolean, Date, Float, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Client(Base):
    __tablename__ = "m_client"
    __table_args__ = {"schema": "app"}

    client_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    client_name = Column(String)
    email = Column(String)
    description = Column(String)
    contact_email = Column(String)
    contact_name = Column(String)
    contact_phone = Column(String)
    start_date = Column(Date)
    end_date = Column(Date)
    created_on = Column(DateTime(timezone=False), server_default=func.now())
    updated_on = Column(DateTime(timezone=False))
    deleted_on = Column(DateTime(timezone=False), nullable=True)
    deleted_by = Column(String, nullable=True)


class Candidate(Base):
    __tablename__ = "m_candidate"
    __table_args__ = {"schema": "app"}

    candidate_id = Column(UUID(as_uuid=True), primary_key=True)
    created_on = Column(DateTime(timezone=False), server_default=func.now())
    address1 = Column(String)
    address2 = Column(String)
    town = Column(String)
    county = Column(String)
    eircode = Column(String)
    pps_number = Column(String)
    date_of_birth = Column(Date)
    bank_account_number = Column(String)
    bank_name = Column(String)
    invoice_contact_name = Column(String)
    invoice_email = Column(String)
    invoice_phone = Column(String)
