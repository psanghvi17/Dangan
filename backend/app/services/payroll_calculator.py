"""
Payroll Calculation Service

This service handles the complex payroll calculations by integrating with:
- ContractorHours (t_contractor_hours)
- TimesheetEntry (t_timesheet_entry) 
- ContractRate (t_contract_rates)
- Candidate information for tax calculations
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List, Dict, Optional, Tuple
from datetime import date, datetime
from decimal import Decimal
import math

from .. import models, schemas, crud
from ..database import get_db


class PayrollCalculator:
    """Handles payroll calculations with Irish tax system compliance"""
    
    # Irish Tax Bands 2024 (simplified)
    TAX_BANDS = {
        'single': [
            (0, 42000, 0.20),      # 20% up to €42,000
            (42000, float('inf'), 0.40)  # 40% above €42,000
        ],
        'married': [
            (0, 84000, 0.20),      # 20% up to €84,000 (married)
            (84000, float('inf'), 0.40)  # 40% above €84,000
        ]
    }
    
    # PRSI Rates 2024
    PRSI_RATES = {
        'class_a': 0.04,  # 4% for Class A
        'class_s': 0.04   # 4% for Class S (self-employed)
    }
    
    # USC Rates 2024
    USC_BANDS = [
        (0, 12012, 0.005),      # 0.5% up to €12,012
        (12012, 22020, 0.02),   # 2% from €12,012 to €22,020
        (22020, 70044, 0.045),  # 4.5% from €22,020 to €70,044
        (70044, float('inf'), 0.08)  # 8% above €70,044
    ]
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_payroll_for_period(self, period_id: str, contractor_ids: Optional[List[str]] = None) -> Dict:
        """
        Calculate payroll for a specific period
        
        Args:
            period_id: UUID of the payroll period
            contractor_ids: Optional list of contractor IDs to process
            
        Returns:
            Dictionary with payroll calculation results
        """
        try:
            # Get the payroll period
            period = crud.get_payroll_period(self.db, period_id)
            if not period:
                raise ValueError("Payroll period not found")
            
            # Get contractor hours for the period
            contractor_hours = self._get_contractor_hours_for_period(period, contractor_ids)
            
            # Group hours by contractor and calculate pay
            payroll_runs = []
            total_gross_pay = 0.0
            total_deductions = 0.0
            total_net_pay = 0.0
            
            for contractor_id, hours_data in contractor_hours.items():
                # Calculate gross pay
                gross_pay = self._calculate_gross_pay(hours_data)
                
                # Get contractor information for tax calculations
                contractor = self._get_contractor_info(contractor_id)
                
                # Calculate deductions
                deductions = self._calculate_deductions(gross_pay, contractor)
                
                # Calculate net pay
                net_pay = gross_pay - deductions['total']
                
                # Create payroll run
                payroll_run_data = {
                    'period_id': period_id,
                    'contractor_id': contractor_id,
                    'total_hours': hours_data['total_hours'],
                    'standard_hours': hours_data['standard_hours'],
                    'overtime_hours': hours_data['overtime_hours'],
                    'holiday_hours': hours_data['holiday_hours'],
                    'bank_holiday_hours': hours_data['bank_holiday_hours'],
                    'weekend_hours': hours_data['weekend_hours'],
                    'oncall_hours': hours_data['oncall_hours'],
                    'standard_pay': hours_data['standard_pay'],
                    'overtime_pay': hours_data['overtime_pay'],
                    'holiday_pay': hours_data['holiday_pay'],
                    'bank_holiday_pay': hours_data['bank_holiday_pay'],
                    'weekend_pay': hours_data['weekend_pay'],
                    'oncall_pay': hours_data['oncall_pay'],
                    'gross_pay': gross_pay,
                    'tax_deduction': deductions['tax'],
                    'prsi_deduction': deductions['prsi'],
                    'usc_deduction': deductions['usc'],
                    'pension_deduction': deductions['pension'],
                    'other_deductions': deductions['other'],
                    'total_deductions': deductions['total'],
                    'net_pay': net_pay,
                    'status': 'pending'
                }
                
                # Create or update payroll run
                existing_run = self._get_existing_payroll_run(period_id, contractor_id)
                if existing_run:
                    payroll_run = self._update_payroll_run(existing_run.run_id, payroll_run_data)
                else:
                    payroll_run = crud.create_payroll_run(self.db, schemas.PayrollRunCreate(**payroll_run_data))
                
                payroll_runs.append(payroll_run)
                
                total_gross_pay += gross_pay
                total_deductions += deductions['total']
                total_net_pay += net_pay
            
            # Create or update payroll summary
            self._update_payroll_summary(period_id, len(contractor_hours), total_gross_pay, total_deductions, total_net_pay, payroll_runs)
            
            return {
                'period_id': period_id,
                'total_contractors': len(contractor_hours),
                'total_gross_pay': total_gross_pay,
                'total_deductions': total_deductions,
                'total_net_pay': total_net_pay,
                'payroll_runs': payroll_runs
            }
            
        except Exception as e:
            print(f"Error calculating payroll: {e}")
            import traceback
            traceback.print_exc()
            raise e
    
    def _get_contractor_hours_for_period(self, period, contractor_ids: Optional[List[str]] = None) -> Dict:
        """Get and aggregate contractor hours for the period"""
        query = self.db.query(models.ContractorHours).filter(
            and_(
                models.ContractorHours.work_date >= period.start_date,
                models.ContractorHours.work_date <= period.end_date
            )
        )
        
        if contractor_ids:
            query = query.filter(models.ContractorHours.contractor_id.in_(contractor_ids))
        
        contractor_hours = query.all()
        
        # Group hours by contractor
        contractor_data = {}
        for hours in contractor_hours:
            contractor_id = str(hours.contractor_id)
            if contractor_id not in contractor_data:
                contractor_data[contractor_id] = {
                    'total_hours': 0.0,
                    'standard_hours': 0.0,
                    'overtime_hours': 0.0,
                    'holiday_hours': 0.0,
                    'bank_holiday_hours': 0.0,
                    'weekend_hours': 0.0,
                    'oncall_hours': 0.0,
                    'standard_pay': 0.0,
                    'overtime_pay': 0.0,
                    'holiday_pay': 0.0,
                    'bank_holiday_pay': 0.0,
                    'weekend_pay': 0.0,
                    'oncall_pay': 0.0,
                    'rates': {
                        'standard_pay_rate': hours.standard_pay_rate or 0.0,
                        'oncall_pay_rate': hours.oncall_pay_rate or 0.0,
                        'weekend_pay_rate': hours.weekend_pay_rate or 0.0,
                        'bankholiday_pay_rate': hours.bankholiday_pay_rate or 0.0
                    }
                }
            
            # Accumulate hours
            standard_hours = hours.standard_hours or 0.0
            holiday_hours = hours.bank_holiday_hours or 0.0
            weekend_hours = hours.weekend_hours or 0.0
            oncall_hours = hours.on_call_hours or 0.0
            
            contractor_data[contractor_id]['standard_hours'] += standard_hours
            contractor_data[contractor_id]['holiday_hours'] += holiday_hours
            contractor_data[contractor_id]['weekend_hours'] += weekend_hours
            contractor_data[contractor_id]['oncall_hours'] += oncall_hours
            contractor_data[contractor_id]['total_hours'] += standard_hours + holiday_hours + weekend_hours + oncall_hours
            
            # Calculate pay based on rates
            standard_pay = standard_hours * (hours.standard_pay_rate or 0.0)
            holiday_pay = holiday_hours * (hours.bankholiday_pay_rate or 0.0)
            weekend_pay = weekend_hours * (hours.weekend_pay_rate or 0.0)
            oncall_pay = oncall_hours * (hours.oncall_pay_rate or 0.0)
            
            contractor_data[contractor_id]['standard_pay'] += standard_pay
            contractor_data[contractor_id]['holiday_pay'] += holiday_pay
            contractor_data[contractor_id]['weekend_pay'] += weekend_pay
            contractor_data[contractor_id]['oncall_pay'] += oncall_pay
        
        return contractor_data
    
    def _calculate_gross_pay(self, hours_data: Dict) -> float:
        """Calculate gross pay from hours data"""
        return (hours_data['standard_pay'] + 
                hours_data['holiday_pay'] + 
                hours_data['weekend_pay'] + 
                hours_data['oncall_pay'])
    
    def _get_contractor_info(self, contractor_id: str) -> Dict:
        """Get contractor information for tax calculations"""
        contractor = self.db.query(models.MUser).filter(models.MUser.user_id == contractor_id).first()
        candidate = self.db.query(models.Candidate).filter(models.Candidate.candidate_id == contractor_id).first()
        
        return {
            'user_id': contractor_id,
            'first_name': contractor.first_name if contractor else None,
            'last_name': contractor.last_name if contractor else None,
            'email': contractor.email_id if contractor else None,
            'pps_number': candidate.pps_number if candidate else None,
            'date_of_birth': candidate.date_of_birth if candidate else None,
            'marital_status': 'single'  # Default to single, could be stored in candidate table
        }
    
    def _calculate_deductions(self, gross_pay: float, contractor: Dict) -> Dict:
        """Calculate all deductions based on Irish tax system"""
        deductions = {
            'tax': 0.0,
            'prsi': 0.0,
            'usc': 0.0,
            'pension': 0.0,
            'other': 0.0,
            'total': 0.0
        }
        
        # Calculate PAYE (Pay As You Earn) Tax
        deductions['tax'] = self._calculate_paye_tax(gross_pay, contractor.get('marital_status', 'single'))
        
        # Calculate PRSI
        deductions['prsi'] = self._calculate_prsi(gross_pay)
        
        # Calculate USC (Universal Social Charge)
        deductions['usc'] = self._calculate_usc(gross_pay)
        
        # Calculate pension (if applicable)
        deductions['pension'] = self._calculate_pension(gross_pay, contractor)
        
        # Calculate other deductions
        deductions['other'] = self._calculate_other_deductions(gross_pay, contractor)
        
        # Calculate total deductions
        deductions['total'] = (deductions['tax'] + deductions['prsi'] + 
                              deductions['usc'] + deductions['pension'] + 
                              deductions['other'])
        
        return deductions
    
    def _calculate_paye_tax(self, gross_pay: float, marital_status: str = 'single') -> float:
        """Calculate PAYE tax based on Irish tax bands"""
        bands = self.TAX_BANDS.get(marital_status, self.TAX_BANDS['single'])
        total_tax = 0.0
        remaining_income = gross_pay
        
        for lower, upper, rate in bands:
            if remaining_income <= 0:
                break
            
            taxable_amount = min(remaining_income, upper - lower)
            total_tax += taxable_amount * rate
            remaining_income -= taxable_amount
        
        return round(total_tax, 2)
    
    def _calculate_prsi(self, gross_pay: float) -> float:
        """Calculate PRSI (Pay Related Social Insurance)"""
        # Simplified PRSI calculation - 4% for most employees
        return round(gross_pay * 0.04, 2)
    
    def _calculate_usc(self, gross_pay: float) -> float:
        """Calculate USC (Universal Social Charge)"""
        total_usc = 0.0
        remaining_income = gross_pay
        
        for lower, upper, rate in self.USC_BANDS:
            if remaining_income <= 0:
                break
            
            taxable_amount = min(remaining_income, upper - lower)
            total_usc += taxable_amount * rate
            remaining_income -= taxable_amount
        
        return round(total_usc, 2)
    
    def _calculate_pension(self, gross_pay: float, contractor: Dict) -> float:
        """Calculate pension contributions (if applicable)"""
        # This would typically be based on pension scheme rules
        # For now, return 0 - could be enhanced with pension scheme data
        return 0.0
    
    def _calculate_other_deductions(self, gross_pay: float, contractor: Dict) -> float:
        """Calculate other deductions (union dues, health insurance, etc.)"""
        # This would be based on contractor-specific deductions
        # For now, return 0 - could be enhanced with deduction rules
        return 0.0
    
    def _get_existing_payroll_run(self, period_id: str, contractor_id: str) -> Optional[models.PayrollRun]:
        """Get existing payroll run for contractor in period"""
        return self.db.query(models.PayrollRun).filter(
            and_(
                models.PayrollRun.period_id == period_id,
                models.PayrollRun.contractor_id == contractor_id
            )
        ).first()
    
    def _update_payroll_run(self, run_id: str, run_data: Dict) -> models.PayrollRun:
        """Update existing payroll run"""
        update_data = schemas.PayrollRunUpdate(**{k: v for k, v in run_data.items() if k not in ['period_id', 'contractor_id']})
        return crud.update_payroll_run(self.db, run_id, update_data)
    
    def _update_payroll_summary(self, period_id: str, total_contractors: int, 
                               total_gross_pay: float, total_deductions: float, 
                               total_net_pay: float, payroll_runs: List) -> None:
        """Create or update payroll summary"""
        summary = crud.get_payroll_summary_by_period(self.db, period_id)
        
        if summary:
            summary.total_contractors = total_contractors
            summary.total_gross_pay = total_gross_pay
            summary.total_deductions = total_deductions
            summary.total_net_pay = total_net_pay
            summary.total_tax = sum(run.tax_deduction for run in payroll_runs)
            summary.total_prsi = sum(run.prsi_deduction for run in payroll_runs)
            summary.total_usc = sum(run.usc_deduction for run in payroll_runs)
            summary.updated_on = datetime.now()
        else:
            summary_data = schemas.PayrollSummaryCreate(
                period_id=period_id,
                total_contractors=total_contractors,
                total_hours=sum(run.total_hours for run in payroll_runs),
                total_gross_pay=total_gross_pay,
                total_deductions=total_deductions,
                total_net_pay=total_net_pay,
                total_tax=sum(run.tax_deduction for run in payroll_runs),
                total_prsi=sum(run.prsi_deduction for run in payroll_runs),
                total_usc=sum(run.usc_deduction for run in payroll_runs)
            )
            crud.create_payroll_summary(self.db, summary_data)
        
        self.db.commit()


def calculate_payroll_for_period(db: Session, period_id: str, contractor_ids: Optional[List[str]] = None) -> Dict:
    """Convenience function to calculate payroll for a period"""
    calculator = PayrollCalculator(db)
    return calculator.calculate_payroll_for_period(period_id, contractor_ids)
