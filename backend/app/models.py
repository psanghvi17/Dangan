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
    address = Column(String)
    start_date = Column(Date)
    end_date = Column(Date)
    created_on = Column(DateTime(timezone=False), server_default=func.now())
    updated_on = Column(DateTime(timezone=False))
    deleted_on = Column(DateTime(timezone=False), nullable=True)
    deleted_by = Column(UUID(as_uuid=True), nullable=True)


class Candidate(Base):
    __tablename__ = "m_candidate"
    __table_args__ = {"schema": "app"}

    candidate_id = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), primary_key=True)
    created_on = Column(DateTime(timezone=False), server_default=func.now(), nullable=True)
    invoice_contact_name = Column(String, nullable=True)
    invoice_email = Column(ARRAY(String), nullable=True)  # _varchar array type
    invoice_phone = Column(String, nullable=True)
    employee_id = Column(String, nullable=True)
    address1 = Column(String, nullable=True)
    address2 = Column(String, nullable=True)
    town = Column(String, nullable=True)
    county = Column(String, nullable=True)
    eircode = Column(String, nullable=True)
    pps_number = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    bank_account_number = Column(String, nullable=True)
    bank_name = Column(String, nullable=True)
    holiday_count = Column(Float, default=0.0, nullable=True)

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
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    email_id = Column(String(254), nullable=True)
    pass_ = Column("pass", String(256), nullable=True)
    created_on = Column(DateTime(timezone=False), server_default=func.now(), nullable=True)
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
    created_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    deleted_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)


class RateFrequency(Base):
    __tablename__ = "m_rate_frequency"
    __table_args__ = {"schema": "app"}

    rate_frequency_id = Column(Integer, primary_key=True)
    rate_frequency_name = Column(String)
    created_on = Column(DateTime(timezone=False), server_default=func.now())
    updated_on = Column(DateTime(timezone=False), nullable=True)
    deleted_on = Column(DateTime(timezone=False), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    deleted_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)


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


class ClientRate(Base):
    __tablename__ = "t_client_rates"
    __table_args__ = {"schema": "app"}

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    client_id = Column(UUID(as_uuid=True), ForeignKey("app.m_client.client_id"), nullable=False)
    rate_type = Column(Integer, nullable=True)
    rate_frequency = Column(Integer, nullable=True)
    pay_rate = Column(Float, nullable=True)
    bill_rate = Column(Float, nullable=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    updated_on = Column(DateTime(timezone=False), nullable=True)
    deleted_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    deleted_on = Column(DateTime(timezone=False), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    created_on = Column(DateTime(timezone=False), server_default=func.now())


class ContractorHours(Base):
    __tablename__ = "t_contractor_hours"
    __table_args__ = {"schema": "app"}

    tch_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    contractor_id = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=False)
    work_date = Column(Date, nullable=False)
    timesheet_id = Column(UUID(as_uuid=True), ForeignKey("app.t_timesheet.timesheet_id"), nullable=False)
    standard_hours = Column(Float, nullable=True)
    on_call_hours = Column(Float, nullable=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    updated_on = Column(DateTime(timezone=False), nullable=True)
    deleted_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    deleted_on = Column(DateTime(timezone=False), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    created_on = Column(DateTime(timezone=False), server_default=func.now(), nullable=True)
    status = Column(String, nullable=True)
    approved_on = Column(DateTime(timezone=False), nullable=True)
    start_time = Column(DateTime(timezone=False), nullable=True)
    end_time = Column(DateTime(timezone=False), nullable=True)
    week = Column(Integer, nullable=True)
    day = Column(String, nullable=True)
    weekend_hours = Column(Float, nullable=True)
    bank_holiday_hours = Column(Float, nullable=True)
    total_hours = Column(Float, nullable=True)
    project_no = Column(UUID(as_uuid=True), nullable=True)
    standard_bill_rate = Column(Float, nullable=True)
    standard_pay_rate = Column(Float, nullable=True)
    oncall_pay_rate = Column(Float, nullable=True)
    oncall_bill_rate = Column(Float, nullable=True)
    weekend_pay_rate = Column(Float, nullable=True)
    weekend_bill_rate = Column(Float, nullable=True)
    bankholiday_pay_rate = Column(Float, nullable=True)
    bankholiday_bill_rate = Column(Float, nullable=True)
    approved_by = Column(UUID(as_uuid=True), nullable=True)
    double_hours = Column(String, nullable=True)
    triple_hours = Column(String, nullable=True)
    dedh_hours = Column(String, nullable=True)
    tcr_id = Column(Integer, nullable=True)
    double_pay_rate = Column(Float, nullable=True)
    double_bill_rate = Column(Float, nullable=True)
    triple_bill_rate = Column(Float, nullable=True)
    triple_pay_rate = Column(Float, nullable=True)
    dedh_pay_rate = Column(Float, nullable=True)
    dedh_bill_rate = Column(Float, nullable=True)
    pcc_id = Column(UUID(as_uuid=True), ForeignKey("app.p_candidate_client.pcc_id"), nullable=True)


class ContractorRateHours(Base):
    __tablename__ = "t_contractor_rate_hours"
    __table_args__ = {"schema": "app"}

    tcrh_id = Column(Integer, primary_key=True)
    tch_id = Column(UUID(as_uuid=True), ForeignKey("app.t_contractor_hours.tch_id"), nullable=False)
    rate_frequency_id = Column(Integer, nullable=False)
    rate_type_id = Column(Integer, nullable=False)
    tcr_id = Column(Integer, nullable=False)
    quantity = Column(Float, nullable=True)
    pay_rate = Column(Float, nullable=True)
    bill_rate = Column(Float, nullable=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    updated_on = Column(DateTime(timezone=False), nullable=True)
    deleted_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    deleted_on = Column(DateTime(timezone=False), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    created_on = Column(DateTime(timezone=False), server_default=func.now(), nullable=True)


class Invoice(Base):
    __tablename__ = "t_invoice"
    __table_args__ = {"schema": "app"}

    invoice_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    pcc_id = Column(UUID(as_uuid=True), ForeignKey("app.p_candidate_client.pcc_id"), nullable=True)
    timesheet_id = Column(UUID(as_uuid=True), ForeignKey("app.t_timesheet.timesheet_id"), nullable=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    updated_on = Column(DateTime(timezone=False), nullable=True)
    deleted_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    deleted_on = Column(DateTime(timezone=False), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    created_on = Column(DateTime(timezone=False), server_default=func.now(), nullable=True)
    status = Column(String, nullable=True)
    amount = Column(Float, nullable=True)
    total_amount = Column(Float, nullable=True)
    remittance_num = Column(Integer, nullable=True)
    last_working_day = Column(Date, nullable=True)
    invoice_type = Column(Integer, nullable=True)
    project_no = Column(UUID(as_uuid=True), nullable=True)
    remittance_date = Column(Date, nullable=True)
    standard_rate = Column(Float, nullable=True)
    oncall_rate = Column(Float, nullable=True)
    weekend_rate = Column(Float, nullable=True)
    bankholiday_rate = Column(Float, nullable=True)
    clarity_min_date = Column(Date, nullable=True)
    clarity_max_date = Column(Date, nullable=True)
    credit_note = Column(String, nullable=True)
    po_number = Column(String, nullable=True)
    approved_on = Column(DateTime(timezone=False), nullable=True)
    invoice_date = Column(Date, nullable=True)
    invoice_num = Column(String, nullable=True)
    sent_to_brc = Column(Boolean, nullable=True)
    brc_status = Column(DateTime(timezone=False), nullable=True)
    mail_status = Column(DateTime(timezone=False), nullable=True)
    external_id = Column(String, nullable=True)
    combined_doc_path = Column(String, nullable=True)
    doc_path = Column(String, nullable=True)
    search_string = Column(String, nullable=True)
    brc_ref = Column(String, nullable=True)
    discount = Column(Float, nullable=True)
    po_id = Column(Integer, nullable=True)
    invoice_attachemnt = Column(ARRAY(String), nullable=True)
    show_invoices = Column(Boolean, nullable=True)
    inv_client_id = Column(UUID(as_uuid=True), nullable=True)
    company_id = Column(Integer, nullable=True)
    inv_payment_terms = Column(String, nullable=True)


class InvoiceLineItem(Base):
    __tablename__ = "p_invoice_line_items"
    __table_args__ = {"schema": "app"}

    pili_id = Column(Integer, primary_key=True, autoincrement=True)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("app.t_invoice.invoice_id"), nullable=False)
    type = Column(Integer, nullable=True)
    quantity = Column(Float, nullable=True)
    rate = Column(Float, nullable=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    updated_on = Column(DateTime(timezone=False), nullable=True)
    deleted_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    deleted_on = Column(DateTime(timezone=False), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    created_on = Column(DateTime(timezone=False), server_default=func.now(), nullable=True)
    timesheet_id = Column(UUID(as_uuid=True), nullable=True)
    m_rate_name = Column(String, nullable=True)
    total = Column(Float, nullable=True)
    tcr_id = Column(Integer, nullable=True)


class CostCenter(Base):
    __tablename__ = "t_cost_center"
    __table_args__ = {"schema": "app"}

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    client_id = Column(UUID(as_uuid=True), ForeignKey("app.m_client.client_id"), nullable=False)
    cc_name = Column(String, nullable=True)
    cc_number = Column(String, nullable=True)
    cc_address = Column(String, nullable=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    updated_on = Column(DateTime(timezone=False), nullable=True)
    deleted_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    deleted_on = Column(DateTime(timezone=False), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    created_on = Column(DateTime(timezone=False), server_default=func.now(), nullable=True)


class CandidateClientCostCenter(Base):
    __tablename__ = "t_candidate_client_cost_center"
    __table_args__ = {"schema": "app"}

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    pcc_id = Column(UUID(as_uuid=True), ForeignKey("app.p_candidate_client.pcc_id"), nullable=True)
    cc_id = Column(UUID(as_uuid=True), ForeignKey("app.t_cost_center.id"), nullable=True)
    sort_order = Column(Integer, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    created_on = Column(DateTime(timezone=False), server_default=func.now(), nullable=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    updated_on = Column(DateTime(timezone=False), nullable=True)
    deleted_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    deleted_on = Column(DateTime(timezone=False), nullable=True)


class MConstant(Base):
    __tablename__ = "m_constant"
    __table_args__ = {"schema": "app"}

    id = Column(Integer, primary_key=True)
    constant = Column(String, nullable=False)
    use_for = Column(String, nullable=False)
    created_on = Column(DateTime(timezone=False), server_default=func.now(), nullable=True)
    updated_on = Column(DateTime(timezone=False), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)


# Payroll Period Model
class PayrollPeriod(Base):
    __tablename__ = "t_payroll_period"
    __table_args__ = {"schema": "app"}

    period_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    period_name = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String, default="draft")  # draft, active, closed
    created_at = Column(DateTime(timezone=False), server_default=func.now())
    updated_at = Column(DateTime(timezone=False), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)


# Payroll Report Models
class PayrollReport(Base):
    __tablename__ = "t_payroll_report"
    __table_args__ = {"schema": "app"}

    report_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    report_name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    selected_weeks = Column(ARRAY(String), nullable=False)  # Array of week identifiers
    status = Column(String, default="draft")  # draft, generating, completed, failed
    file_path = Column(String, nullable=True)  # Path to generated file
    file_size = Column(Integer, nullable=True)  # File size in bytes
    created_on = Column(DateTime(timezone=False), server_default=func.now())
    updated_on = Column(DateTime(timezone=False), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    generated_on = Column(DateTime(timezone=False), nullable=True)
    generated_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)


class PayrollRun(Base):
    __tablename__ = "t_payroll_run"
    __table_args__ = {"schema": "app"}

    run_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    period_id = Column(UUID(as_uuid=True), ForeignKey("app.t_payroll_period.period_id"), nullable=False)
    contractor_id = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=False)
    total_hours = Column(Float, default=0.0)
    standard_hours = Column(Float, default=0.0)
    overtime_hours = Column(Float, default=0.0)
    holiday_hours = Column(Float, default=0.0)
    bank_holiday_hours = Column(Float, default=0.0)
    weekend_hours = Column(Float, default=0.0)
    oncall_hours = Column(Float, default=0.0)
    # Pay calculations
    standard_pay = Column(Float, default=0.0)
    overtime_pay = Column(Float, default=0.0)
    holiday_pay = Column(Float, default=0.0)
    bank_holiday_pay = Column(Float, default=0.0)
    weekend_pay = Column(Float, default=0.0)
    oncall_pay = Column(Float, default=0.0)
    gross_pay = Column(Float, default=0.0)
    # Deductions
    tax_deduction = Column(Float, default=0.0)
    prsi_deduction = Column(Float, default=0.0)
    usc_deduction = Column(Float, default=0.0)
    pension_deduction = Column(Float, default=0.0)
    other_deductions = Column(Float, default=0.0)
    total_deductions = Column(Float, default=0.0)
    net_pay = Column(Float, default=0.0)
    # Status and tracking
    status = Column(String, default="pending")  # pending, approved, paid
    created_on = Column(DateTime(timezone=False), server_default=func.now())
    updated_on = Column(DateTime(timezone=False), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    approved_on = Column(DateTime(timezone=False), nullable=True)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    paid_on = Column(DateTime(timezone=False), nullable=True)
    paid_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)


class PayrollDeduction(Base):
    __tablename__ = "m_payroll_deduction"
    __table_args__ = {"schema": "app"}

    deduction_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    deduction_name = Column(String, nullable=False)
    deduction_type = Column(String, nullable=False)  # tax, prsi, usc, pension, other
    is_percentage = Column(Boolean, default=False)
    percentage_rate = Column(Float, nullable=True)
    fixed_amount = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    created_on = Column(DateTime(timezone=False), server_default=func.now())
    updated_on = Column(DateTime(timezone=False), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("app.m_user.user_id"), nullable=True)


class PayrollSummary(Base):
    __tablename__ = "t_payroll_summary"
    __table_args__ = {"schema": "app"}

    summary_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    period_id = Column(UUID(as_uuid=True), ForeignKey("app.t_payroll_period.period_id"), nullable=False)
    total_contractors = Column(Integer, default=0)
    total_hours = Column(Float, default=0.0)
    total_gross_pay = Column(Float, default=0.0)
    total_deductions = Column(Float, default=0.0)
    total_net_pay = Column(Float, default=0.0)
    total_tax = Column(Float, default=0.0)
    total_prsi = Column(Float, default=0.0)
    total_usc = Column(Float, default=0.0)
    created_on = Column(DateTime(timezone=False), server_default=func.now())
    updated_on = Column(DateTime(timezone=False), nullable=True)
