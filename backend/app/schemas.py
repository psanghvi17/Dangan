from pydantic import BaseModel, EmailStr
from typing import Optional, List
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


class TimesheetSummary(BaseModel): 
    timesheet_id: UUID
    weekLabel: str
    monthLabel: str
    filledCount: int
    notFilledCount: int
    status: str

    class Config:
        from_attributes = True


class TimesheetEntryBase(BaseModel):
    employee_name: str
    employee_code: str
    client_name: str
    filled: bool = False
    standard_hours: float = 0
    rate2_hours: float = 0
    rate3_hours: float = 0
    rate4_hours: float = 0
    rate5_hours: float = 0
    rate6_hours: float = 0
    holiday_hours: float = 0
    bank_holiday_hours: float = 0


class TimesheetEntryCreate(TimesheetEntryBase):
    timesheet_id: UUID


class TimesheetEntryUpdate(BaseModel):
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    client_name: Optional[str] = None
    filled: Optional[bool] = None
    standard_hours: Optional[float] = None
    rate2_hours: Optional[float] = None
    rate3_hours: Optional[float] = None
    rate4_hours: Optional[float] = None
    rate5_hours: Optional[float] = None
    rate6_hours: Optional[float] = None
    holiday_hours: Optional[float] = None
    bank_holiday_hours: Optional[float] = None


class TimesheetEntry(TimesheetEntryBase):
    entry_id: UUID
    timesheet_id: UUID
    created_on: Optional[datetime] = None
    updated_on: Optional[datetime] = None

    class Config:
        from_attributes = True


class TimesheetCreate(BaseModel):
    month: str
    week: str
    client_id: Optional[UUID] = None
    candidate_ids: List[str]


class TimesheetDetail(BaseModel):
    timesheet_id: UUID
    status: Optional[str] = None
    month: Optional[str] = None
    week: Optional[str] = None
    date_range: Optional[str] = None
    entries: List[TimesheetEntry] = []
class MUserCreate(BaseModel):
    first_name: str
    last_name: str
    email_id: EmailStr


class MUserOut(BaseModel):
    user_id: UUID
    first_name: Optional[str]
    last_name: Optional[str]
    email_id: Optional[EmailStr]
    created_on: Optional[datetime]

    class Config:
        from_attributes = True


class CandidateListItem(BaseModel):
    user_id: UUID
    first_name: Optional[str]
    last_name: Optional[str]
    email_id: Optional[EmailStr]
    created_on: Optional[datetime]

    class Config:
        from_attributes = True


class CandidateListResponse(BaseModel):
    candidates: List[CandidateListItem]
    total: int
    page: int
    limit: int
    total_pages: int
