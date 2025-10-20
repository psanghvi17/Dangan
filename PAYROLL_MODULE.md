# Payroll Module Documentation

## Overview

The Payroll Module is a comprehensive system for managing contractor payroll calculations, integrating with the existing timesheet and contractor hours system. It provides automated payroll processing with Irish tax system compliance.

## Features

### Core Functionality
- **Payroll Period Management**: Create and manage payroll periods (monthly, weekly, etc.)
- **Automated Payroll Calculation**: Calculate gross pay, deductions, and net pay
- **Irish Tax Compliance**: PAYE, PRSI, and USC calculations
- **Contractor Integration**: Seamless integration with existing contractor and timesheet data
- **Payroll Reports**: Generate summary and detailed payroll reports
- **Deduction Management**: Configure and manage payroll deductions

### Database Tables

#### 1. `t_payroll_period` - Payroll Periods
- `period_id`: UUID primary key
- `period_name`: Human-readable period name (e.g., "January 2025")
- `start_date`: Period start date
- `end_date`: Period end date
- `status`: Period status (draft, processing, completed, locked)
- Audit fields: created_on, updated_on, created_by, updated_by, processed_on, processed_by

#### 2. `t_payroll_run` - Individual Payroll Runs
- `run_id`: UUID primary key
- `period_id`: Foreign key to payroll period
- `contractor_id`: Foreign key to contractor (m_user)
- **Hours tracking**: total_hours, standard_hours, overtime_hours, holiday_hours, bank_holiday_hours, weekend_hours, oncall_hours
- **Pay calculations**: standard_pay, overtime_pay, holiday_pay, bank_holiday_pay, weekend_pay, oncall_pay, gross_pay
- **Deductions**: tax_deduction, prsi_deduction, usc_deduction, pension_deduction, other_deductions, total_deductions, net_pay
- **Status tracking**: status (pending, approved, paid), approved_on, approved_by, paid_on, paid_by

#### 3. `m_payroll_deduction` - Deduction Types
- `deduction_id`: UUID primary key
- `deduction_name`: Name of the deduction
- `deduction_type`: Type (tax, prsi, usc, pension, other)
- `is_percentage`: Whether it's a percentage or fixed amount
- `percentage_rate`: Percentage rate (if applicable)
- `fixed_amount`: Fixed amount (if applicable)
- `is_active`: Whether the deduction is active

#### 4. `t_payroll_summary` - Period Summaries
- `summary_id`: UUID primary key
- `period_id`: Foreign key to payroll period
- `total_contractors`: Number of contractors in period
- `total_hours`: Total hours worked
- `total_gross_pay`: Total gross pay
- `total_deductions`: Total deductions
- `total_net_pay`: Total net pay
- `total_tax`: Total tax deducted
- `total_prsi`: Total PRSI deducted
- `total_usc`: Total USC deducted

## API Endpoints

### Payroll Periods
- `POST /api/payroll/periods` - Create new payroll period
- `GET /api/payroll/periods` - Get all payroll periods
- `GET /api/payroll/periods/{period_id}` - Get specific payroll period
- `PUT /api/payroll/periods/{period_id}` - Update payroll period

### Payroll Calculation
- `POST /api/payroll/calculate` - Calculate payroll for a period
- `GET /api/payroll/periods/{period_id}/runs` - Get payroll runs for period
- `GET /api/payroll/runs/{run_id}` - Get specific payroll run
- `PUT /api/payroll/runs/{run_id}` - Update payroll run

### Deductions
- `POST /api/payroll/deductions` - Create payroll deduction
- `GET /api/payroll/deductions` - Get all payroll deductions
- `GET /api/payroll/deductions/active` - Get active deductions
- `PUT /api/payroll/deductions/{deduction_id}` - Update deduction

### Reports
- `GET /api/payroll/periods/{period_id}/summary` - Get payroll summary
- `POST /api/payroll/reports` - Generate payroll reports

## Payroll Calculation Logic

### Gross Pay Calculation
The system calculates gross pay by aggregating different types of hours and their corresponding rates:

```python
gross_pay = (standard_hours × standard_rate) + 
            (holiday_hours × holiday_rate) + 
            (weekend_hours × weekend_rate) + 
            (oncall_hours × oncall_rate)
```

### Irish Tax System Compliance

#### PAYE (Pay As You Earn) Tax
- **Single**: 20% up to €42,000, 40% above
- **Married**: 20% up to €84,000, 40% above

#### PRSI (Pay Related Social Insurance)
- 4% for Class A employees
- 4% for Class S (self-employed)

#### USC (Universal Social Charge)
- 0.5% up to €12,012
- 2% from €12,012 to €22,020
- 4.5% from €22,020 to €70,044
- 8% above €70,044

### Deduction Calculation
```python
total_deductions = tax_deduction + prsi_deduction + usc_deduction + pension_deduction + other_deductions
net_pay = gross_pay - total_deductions
```

## Integration with Existing System

### Data Sources
1. **ContractorHours** (`t_contractor_hours`): Primary source for hours and rates
2. **TimesheetEntry** (`t_timesheet_entry`): Additional timesheet data
3. **ContractRate** (`t_contract_rates`): Rate information
4. **Candidate** (`m_candidate`): Personal information for tax calculations

### Workflow
1. **Create Payroll Period**: Define the time period for payroll
2. **Calculate Payroll**: System automatically processes contractor hours and calculates pay
3. **Review & Approve**: Review calculated payroll runs
4. **Generate Reports**: Create summary and detailed reports
5. **Mark as Paid**: Update status when payments are processed

## Frontend Components

### Payroll Page (`/payroll`)
- Period selection and management
- Payroll calculation interface
- Summary cards showing totals
- Detailed payroll runs table
- Report generation buttons

### Key Features
- **Period Management**: Create and select payroll periods
- **Real-time Calculation**: Calculate payroll with live updates
- **Summary Dashboard**: Overview of payroll totals
- **Detailed View**: Individual contractor payroll details
- **Report Generation**: Export payroll data

## Usage Examples

### Creating a Payroll Period
```python
period_data = {
    "period_name": "January 2025",
    "start_date": "2025-01-01",
    "end_date": "2025-01-31",
    "status": "draft"
}
```

### Calculating Payroll
```python
calculation_request = {
    "period_id": "uuid-of-period",
    "contractor_ids": ["contractor-1", "contractor-2"]  # Optional
}
```

### Generating Reports
```python
report_request = {
    "period_id": "uuid-of-period",
    "report_type": "summary",  # summary, detailed, contractor
    "contractor_id": "uuid-of-contractor"  # Optional for contractor report
}
```

## Security & Permissions

- All payroll endpoints require authentication
- User context is tracked for audit purposes
- Sensitive financial data is protected
- Role-based access can be implemented

## Future Enhancements

1. **Advanced Tax Calculations**: More sophisticated tax band handling
2. **Pension Integration**: Automatic pension contribution calculations
3. **Bank Integration**: Direct bank transfers
4. **Payslip Generation**: PDF payslip creation
5. **Multi-currency Support**: International contractor support
6. **Audit Trail**: Comprehensive change tracking
7. **Approval Workflows**: Multi-level approval processes

## Error Handling

The system includes comprehensive error handling for:
- Invalid period dates
- Missing contractor data
- Calculation errors
- Database constraints
- Network timeouts

## Performance Considerations

- Payroll calculations are optimized for large datasets
- Database queries are indexed for performance
- Caching is implemented for frequently accessed data
- Batch processing for multiple contractors

## Testing

The payroll module includes:
- Unit tests for calculation logic
- Integration tests with existing systems
- API endpoint testing
- Frontend component testing
- End-to-end workflow testing

## Deployment

The payroll module is deployed as part of the main application:
1. Database migrations are automatically applied
2. API endpoints are registered with the main router
3. Frontend components are integrated into the main app
4. Configuration is managed through environment variables
