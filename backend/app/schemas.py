from pydantic import BaseModel, EmailStr
from typing import Optional, List, Union
from datetime import datetime, date
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


class ClientWithActiveContracts(ClientBase):
    client_id: UUID
    created_on: Optional[datetime] = None
    updated_on: Optional[datetime] = None
    deleted_on: Optional[datetime] = None
    deleted_by: Optional[str] = None
    active_contracts_count: int = 0

    class Config:
        from_attributes = True


class ClientRateBase(BaseModel):
    client_id: UUID
    rate_type: Optional[int] = None
    rate_frequency: Optional[int] = None
    pay_rate: Optional[float] = None
    bill_rate: Optional[float] = None


class ClientRateCreate(ClientRateBase):
    pass


class ClientRateUpdate(BaseModel):
    rate_type: Optional[int] = None
    rate_frequency: Optional[int] = None
    pay_rate: Optional[float] = None
    bill_rate: Optional[float] = None


class ClientRate(ClientRateBase):
    id: UUID
    updated_by: Optional[UUID] = None
    updated_on: Optional[datetime] = None
    deleted_by: Optional[UUID] = None
    deleted_on: Optional[datetime] = None
    created_by: Optional[UUID] = None
    created_on: Optional[datetime] = None

    class Config:
        from_attributes = True


class CandidateBase(BaseModel):
    invoice_email: Optional[Union[str, List[str]]] = None
    invoice_phone: Optional[str] = None
    address1: Optional[str] = None
    address2: Optional[str] = None
    town: Optional[str] = None
    county: Optional[str] = None
    eircode: Optional[str] = None
    pps_number: Optional[str] = None
    date_of_birth: Optional[Union[datetime, str]] = None
    bank_account_number: Optional[str] = None
    bank_name: Optional[str] = None


class CandidateCreate(CandidateBase):
    # User fields (stored in app.m_user)
    first_name: str
    last_name: str
    email_id: EmailStr
    # Candidate fields (stored in app.m_candidate)
    invoice_contact_name: str


class Candidate(CandidateBase):
    candidate_id: UUID
    created_on: Optional[datetime] = None
    invoice_contact_name: Optional[str] = None
    # User fields
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email_id: Optional[str] = None

    class Config:
        from_attributes = True


class CandidateWithClient(CandidateBase):
    candidate_id: UUID
    created_on: Optional[datetime] = None
    invoice_contact_name: Optional[str] = None
    client_name: Optional[str] = None
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    # User fields
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email_id: Optional[str] = None

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


class CandidateUpdate(BaseModel):
    # User fields (stored in app.m_user)
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email_id: Optional[EmailStr] = None
    # Candidate fields (stored in app.m_candidate)
    invoice_contact_name: Optional[str] = None
    # Accept either a single string or list of strings from the client
    invoice_email: Optional[Union[str, List[str]]] = None
    date_of_birth: Optional[datetime] = None
    address1: Optional[str] = None
    address2: Optional[str] = None
    town: Optional[str] = None
    county: Optional[str] = None
    eircode: Optional[str] = None
    pps_number: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_name: Optional[str] = None


class ClientOption(BaseModel):
    client_id: UUID
    client_name: Optional[str]
    
    class Config:
        from_attributes = True


class CandidateClientCreate(BaseModel):
    candidate_id: UUID
    client_id: UUID
    placement_date: Optional[date] = None
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    status: int = 0


class CandidateClientOut(BaseModel):
    pcc_id: UUID
    candidate_id: UUID
    client_id: UUID
    placement_date: Optional[date]
    contract_start_date: Optional[date]
    contract_end_date: Optional[date]
    status: Optional[int]
    created_on: Optional[datetime]
    
    class Config:
        from_attributes = True


class RateTypeOut(BaseModel):
    rate_type_id: int
    rate_type_name: Optional[str]

    class Config:
        from_attributes = True


class RateFrequencyOut(BaseModel):
    rate_frequency_id: int
    rate_frequency_name: Optional[str]

    class Config:
        from_attributes = True


class ClientCandidateOut(BaseModel):
    user_id: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email_id: Optional[str] = None
    placement_date: Optional[str] = None
    contract_start_date: Optional[str] = None
    contract_end_date: Optional[str] = None
    pcc_id: str

    class Config:
        from_attributes = True


class ContractRateCreate(BaseModel):
    rate_type: int
    rate_frequency: int
    pay_rate: Optional[float] = None
    bill_rate: Optional[float] = None
    date_applicable: Optional[date] = None
    date_end: Optional[date] = None
    tcccc_id: Optional[UUID] = None


class ContractRateOut(BaseModel):
    id: int
    pcc_id: UUID
    rate_type: int
    rate_frequency: int
    pay_rate: Optional[float]
    bill_rate: Optional[float]
    date_applicable: Optional[date]
    date_end: Optional[date]
    created_on: Optional[datetime]
    tcccc_id: Optional[UUID] = None

    class Config:
        from_attributes = True


class RatesForCandidateClientCreate(BaseModel):
    candidate_id: UUID
    client_id: UUID
    rates: List[ContractRateCreate]


class ContractRateUpdate(BaseModel):
    rate_type: Optional[int] = None
    rate_frequency: Optional[int] = None
    pay_rate: Optional[float] = None
    bill_rate: Optional[float] = None
    date_applicable: Optional[date] = None
    date_end: Optional[date] = None
    tcccc_id: Optional[UUID] = None


class ContractWithRatesCreate(BaseModel):
    """Unified schema for creating contract with rates in one API call"""
    candidate_id: UUID
    client_id: UUID
    placement_date: Optional[date] = None
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    status: int = 0
    rates: List[ContractRateCreate] = []
    pcc_id: Optional[UUID] = None  # If provided, update existing relationship
    tcr_ids: Optional[List[int]] = None  # If provided, update existing rates (using 'id' field)


class ContractWithRatesOut(BaseModel):
    """Response schema for unified contract creation"""
    pcc_id: UUID
    candidate_id: UUID
    client_id: UUID
    placement_date: Optional[date]
    contract_start_date: Optional[date]
    contract_end_date: Optional[date]
    status: Optional[int]
    created_on: Optional[datetime]
    rates: List[ContractRateOut] = []
    
    class Config:
        from_attributes = True


class ContractorHoursBase(BaseModel):
    contractor_id: UUID
    work_date: date
    timesheet_id: Optional[UUID] = None
    pcc_id: Optional[UUID] = None
    standard_hours: Optional[float] = None
    on_call_hours: Optional[float] = None
    status: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    week: Optional[int] = None
    day: Optional[str] = None
    weekend_hours: Optional[float] = None
    bank_holiday_hours: Optional[float] = None
    total_hours: Optional[float] = None
    project_no: Optional[UUID] = None
    standard_bill_rate: Optional[float] = None
    standard_pay_rate: Optional[float] = None
    oncall_pay_rate: Optional[float] = None
    oncall_bill_rate: Optional[float] = None
    weekend_pay_rate: Optional[float] = None
    weekend_bill_rate: Optional[float] = None
    bankholiday_pay_rate: Optional[float] = None
    bankholiday_bill_rate: Optional[float] = None
    double_hours: Optional[str] = None
    triple_hours: Optional[str] = None
    dedh_hours: Optional[str] = None
    tcr_id: Optional[int] = None
    double_pay_rate: Optional[float] = None
    double_bill_rate: Optional[float] = None
    triple_bill_rate: Optional[float] = None
    triple_pay_rate: Optional[float] = None
    dedh_pay_rate: Optional[float] = None
    dedh_bill_rate: Optional[float] = None


class ContractorHoursCreate(ContractorHoursBase):
    created_by: Optional[UUID] = None


class ContractorHoursOut(ContractorHoursBase):
    tch_id: UUID
    created_on: Optional[datetime] = None
    updated_on: Optional[datetime] = None

    class Config:
        from_attributes = True


class ContractorHoursUpsert(BaseModel):
    tch_id: Optional[UUID] = None
    contractor_id: Optional[UUID] = None
    work_date: Optional[date] = None
    timesheet_id: Optional[UUID] = None
    pcc_id: Optional[UUID] = None
    standard_hours: Optional[float] = None
    on_call_hours: Optional[float] = None
    status: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    week: Optional[int] = None
    day: Optional[str] = None
    weekend_hours: Optional[float] = None
    bank_holiday_hours: Optional[float] = None
    total_hours: Optional[float] = None
    project_no: Optional[UUID] = None
    standard_bill_rate: Optional[float] = None
    standard_pay_rate: Optional[float] = None
    oncall_pay_rate: Optional[float] = None
    oncall_bill_rate: Optional[float] = None
    weekend_pay_rate: Optional[float] = None
    weekend_bill_rate: Optional[float] = None
    bankholiday_pay_rate: Optional[float] = None
    bankholiday_bill_rate: Optional[float] = None
    double_hours: Optional[str] = None
    triple_hours: Optional[str] = None
    dedh_hours: Optional[str] = None
    tcr_id: Optional[int] = None
    double_pay_rate: Optional[float] = None
    double_bill_rate: Optional[float] = None
    triple_bill_rate: Optional[float] = None
    triple_pay_rate: Optional[float] = None
    dedh_pay_rate: Optional[float] = None
    dedh_bill_rate: Optional[float] = None
    rate_hours: Optional[List['ContractorRateHoursCreate']] = None


class ContractorRateHoursBase(BaseModel):
    tch_id: Optional[UUID] = None  # Made optional for upsert operations
    rate_frequency_id: int
    rate_type_id: int
    tcr_id: int
    quantity: Optional[float] = None
    pay_rate: Optional[float] = None
    bill_rate: Optional[float] = None


class ContractorRateHoursCreate(ContractorRateHoursBase):
    created_by: Optional[UUID] = None


class ContractorRateHoursUpdate(BaseModel):
    rate_frequency_id: Optional[int] = None
    rate_type_id: Optional[int] = None
    tcr_id: Optional[int] = None
    quantity: Optional[float] = None
    pay_rate: Optional[float] = None
    bill_rate: Optional[float] = None
    updated_by: Optional[UUID] = None


class ContractorRateHoursOut(ContractorRateHoursBase):
    tcrh_id: int
    created_on: Optional[datetime] = None
    updated_on: Optional[datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    deleted_by: Optional[UUID] = None
    deleted_on: Optional[datetime] = None

    class Config:
        from_attributes = True


class MultipleRateHoursCreate(BaseModel):
    tch_id: UUID
    rate_entries: List[ContractorRateHoursCreate]
    created_by: Optional[UUID] = None


# Invoice schemas
class InvoiceBase(BaseModel):
    invoice_num: Optional[str] = None
    invoice_date: Optional[date] = None
    amount: Optional[float] = None
    total_amount: Optional[float] = None
    status: Optional[str] = None


class Invoice(InvoiceBase):
    invoice_id: UUID
    pcc_id: Optional[UUID] = None
    timesheet_id: Optional[UUID] = None
    created_on: Optional[datetime] = None
    updated_on: Optional[datetime] = None
    deleted_on: Optional[datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    deleted_by: Optional[UUID] = None

    class Config:
        from_attributes = True


class GenerateInvoiceRequest(BaseModel):
    clientIds: List[str]  # List of Client IDs
    week: str             # Week start date in YYYY-MM-DD format
    invoiceDate: str      # Invoice date in YYYY-MM-DD format


class InvoiceLineItemBase(BaseModel):
    type: Optional[int] = None
    quantity: Optional[float] = None
    rate: Optional[float] = None
    timesheet_id: Optional[UUID] = None
    m_rate_name: Optional[str] = None
    total: Optional[float] = None
    tcr_id: Optional[int] = None


class InvoiceLineItem(InvoiceLineItemBase):
    pili_id: int
    invoice_id: UUID
    created_on: Optional[datetime] = None
    updated_on: Optional[datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    deleted_by: Optional[UUID] = None
    deleted_on: Optional[datetime] = None
    rate_type_name: Optional[str] = None
    rate_frequency_name: Optional[str] = None

    class Config:
        from_attributes = True


class GenerateInvoiceResponse(BaseModel):
    invoice_id: UUID
    invoice_num: str
    invoice_date: date
    line_items: List[InvoiceLineItem]
    total_amount: float


class InvoiceWithLineItems(BaseModel):
    invoice: Invoice
    line_items: List[InvoiceLineItem]


# MUser Authentication Schemas
class MUserSignup(BaseModel):
    first_name: str
    email_id: EmailStr
    password: str


class MUserLogin(BaseModel):
    email_id: EmailStr
    password: str


class MUserAuth(BaseModel):
    user_id: UUID
    first_name: Optional[str]
    last_name: Optional[str]
    email_id: Optional[EmailStr]
    created_on: Optional[datetime]

    class Config:
        from_attributes = True


class ForgotPasswordRequest(BaseModel):
    email_id: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class PasswordResetResponse(BaseModel):
    message: str


# Cost Center schemas
class CostCenterBase(BaseModel):
    client_id: UUID
    cc_name: Optional[str] = None
    cc_number: Optional[str] = None
    cc_address: Optional[str] = None


class CostCenterCreate(CostCenterBase):
    pass


class CostCenterUpdate(BaseModel):
    cc_name: Optional[str] = None
    cc_number: Optional[str] = None
    cc_address: Optional[str] = None


class CostCenter(CostCenterBase):
    id: UUID
    updated_by: Optional[UUID] = None
    updated_on: Optional[datetime] = None
    deleted_by: Optional[UUID] = None
    deleted_on: Optional[datetime] = None
    created_by: Optional[UUID] = None
    created_on: Optional[datetime] = None

    class Config:
        from_attributes = True


# Candidate Client Cost Center schemas
class CandidateClientCostCenterBase(BaseModel):
    pcc_id: Optional[UUID] = None
    cc_id: Optional[UUID] = None
    sort_order: Optional[int] = None


class CandidateClientCostCenterCreate(CandidateClientCostCenterBase):
    pass


class CandidateClientCostCenterUpdate(BaseModel):
    cc_id: Optional[UUID] = None
    sort_order: Optional[int] = None


class CandidateClientCostCenter(CandidateClientCostCenterBase):
    id: UUID
    created_by: Optional[UUID] = None
    created_on: Optional[datetime] = None
    updated_by: Optional[UUID] = None
    updated_on: Optional[datetime] = None
    deleted_by: Optional[UUID] = None
    deleted_on: Optional[datetime] = None

    class Config:
        from_attributes = True


class CostCenterWithDetails(BaseModel):
    id: UUID
    cc_name: Optional[str] = None
    cc_number: Optional[str] = None
    cc_address: Optional[str] = None
    relationship_id: Optional[UUID] = None

    class Config:
        from_attributes = True


class MConstantBase(BaseModel):
    constant: str
    use_for: str


class MConstant(MConstantBase):
    id: int
    created_on: Optional[datetime] = None
    updated_on: Optional[datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None

    class Config:
        from_attributes = True


class MConstantUpdate(BaseModel):
    constant: Optional[str] = None
    use_for: Optional[str] = None
