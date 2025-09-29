from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    email: EmailStr
    username: str


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: Optional[str] = None


class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ItemBase(BaseModel):
    title: str
    description: Optional[str] = None


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class Item(ItemBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class ClientBase(BaseModel):
    client_name: Optional[str] = None
    email: Optional[str] = None
    description: Optional[str] = None
    contact_email: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None


class ClientCreate(ClientBase):
    client_name: str


class ClientUpdate(ClientBase):
    pass


class Client(ClientBase):
    client_id: UUID
    created_on: Optional[datetime] = None
    updated_on: Optional[datetime] = None
    deleted_on: Optional[datetime] = None
    deleted_by: Optional[str] = None

    class Config:
        from_attributes = True


class CandidateBase(BaseModel):
    invoice_contact_name: Optional[str] = None
    invoice_email: Optional[str] = None
    invoice_phone: Optional[str] = None
    address1: Optional[str] = None
    address2: Optional[str] = None
    town: Optional[str] = None
    county: Optional[str] = None
    eircode: Optional[str] = None
    pps_number: Optional[str] = None
    date_of_birth: Optional[datetime] = None


class CandidateCreate(CandidateBase):
    invoice_contact_name: str


class Candidate(CandidateBase):
    candidate_id: str
    created_on: Optional[datetime] = None

    class Config:
        from_attributes = True
