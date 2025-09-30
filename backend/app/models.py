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
    invoice_email = Column(ARRAY(String))  # Changed to array type
    invoice_phone = Column(String)

class Timesheet(Base):
    __tablename__ = "t_timesheet"
    __table_args__ = {"schema": "app"}

    timesheet_id = Column(UUID(as_uuid=True), primary_key=True)
    status = Column(String, nullable=True)
    month = Column(String, nullable=True)  # e.g., April 2025
    week = Column(String, nullable=True)  # e.g., Week 4
    date_range = Column(String, nullable=True)  # e.g., 7th-14th Apr 2025
    created_on = Column(DateTime(timezone=False), server_default=func.now())
    updated_on = Column(DateTime(timezone=False), nullable=True)


class TimesheetEntry(Base):
    __tablename__ = "t_timesheet_entry"
    __table_args__ = {"schema": "app"}

    entry_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    timesheet_id = Column(UUID(as_uuid=True), ForeignKey("app.t_timesheet.timesheet_id"))
    employee_name = Column(String, nullable=False)
    employee_code = Column(String, nullable=False)
    client_name = Column(String, nullable=False)
    filled = Column(Boolean, default=False)
    # Hours columns
    standard_hours = Column(Float, default=0)
    rate2_hours = Column(Float, default=0)
    rate3_hours = Column(Float, default=0)
    rate4_hours = Column(Float, default=0)
    rate5_hours = Column(Float, default=0)
    rate6_hours = Column(Float, default=0)
    holiday_hours = Column(Float, default=0)
    bank_holiday_hours = Column(Float, default=0)
    created_on = Column(DateTime(timezone=False), server_default=func.now())
    updated_on = Column(DateTime(timezone=False), nullable=True)

class MUser(Base):
    __tablename__ = "m_user"
    __table_args__ = {"schema": "app"}

    user_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    first_name = Column(String(100))
    last_name = Column(String(100))
    email_id = Column(String(254))
    role_id = Column(Integer)
    pass_ = Column("pass", String(256), nullable=True)
    created_on = Column(DateTime(timezone=False), server_default=func.now())
    deleted_on = Column(DateTime(timezone=False), nullable=True)


class P_CandidateClient(Base):
    __tablename__ = "p_candidate_client"
    __table_args__ = {"schema": "app"}

    pcc_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey("app.m_client.client_id"), nullable=False)
    placement_date = Column(Date, nullable=True)
    contract_start_date = Column(Date, nullable=True)
    contract_end_date = Column(Date, nullable=True)
    status = Column(Integer, nullable=True, default=0)
    created_on = Column(DateTime(timezone=False), server_default=func.now())
    updated_on = Column(DateTime(timezone=False), nullable=True)
    deleted_on = Column(DateTime(timezone=False), nullable=True)
    created_by = Column(UUID(as_uuid=True), nullable=True)
    updated_by = Column(UUID(as_uuid=True), nullable=True)
    deleted_by = Column(UUID(as_uuid=True), nullable=True)


class RateType(Base):
    __tablename__ = "m_rate_type"
    __table_args__ = {"schema": "app"}

    rate_type_id = Column(Integer, primary_key=True)
    rate_type_name = Column(String)
    client_id = Column(UUID(as_uuid=True), nullable=True)
    is_primary_rates = Column(Boolean, nullable=True)
    created_on = Column(DateTime(timezone=False), server_default=func.now())
    updated_on = Column(DateTime(timezone=False), nullable=True)
    deleted_on = Column(DateTime(timezone=False), nullable=True)


class RateFrequency(Base):
    __tablename__ = "m_rate_frequency"
    __table_args__ = {"schema": "app"}

    rate_frequency_id = Column(Integer, primary_key=True)
    rate_frequency_name = Column(String)
    created_on = Column(DateTime(timezone=False), server_default=func.now())
    updated_on = Column(DateTime(timezone=False), nullable=True)
    deleted_on = Column(DateTime(timezone=False), nullable=True)


class ContractRate(Base):
    __tablename__ = "t_contract_rates"
    __table_args__ = {"schema": "app"}

    id = Column(Integer, primary_key=True)
    rate_type = Column(Integer, ForeignKey("app.m_rate_type.rate_type_id"))
    rate_frequency = Column(Integer, ForeignKey("app.m_rate_frequency.rate_frequency_id"))
    pay_rate = Column(Float, nullable=True)
    bill_rate = Column(Float, nullable=True)
    perc_margin = Column(Float, nullable=True)
    created_on = Column(DateTime(timezone=False), server_default=func.now())
    updated_on = Column(DateTime(timezone=False), nullable=True)
    deleted_on = Column(DateTime(timezone=False), nullable=True)
    created_by = Column(UUID(as_uuid=True), nullable=True)
    updated_by = Column(UUID(as_uuid=True), nullable=True)
    deleted_by = Column(UUID(as_uuid=True), nullable=True)
    pcc_id = Column(UUID(as_uuid=True), ForeignKey("app.p_candidate_client.pcc_id"))
    date_applicable = Column(Date, nullable=True)
    date_end = Column(Date, nullable=True)
    perc_markup = Column(Float, nullable=True)
    is_history = Column(Boolean, nullable=True)
    tcccc_id = Column(UUID(as_uuid=True), nullable=True)
