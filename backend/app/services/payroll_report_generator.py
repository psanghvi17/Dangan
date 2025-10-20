"""
Payroll Report Generator Service

This service generates payroll reports based on selected weeks and their associated invoices.
It extracts data from invoices, contractor hours, and timesheet entries to create comprehensive reports.
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Dict, Optional, Tuple
from datetime import datetime, date
import pandas as pd
import os
import uuid
from io import BytesIO

from .. import models, schemas, crud
from ..database import get_db


class PayrollReportGenerator:
    """Handles payroll report generation based on invoices and weeks"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_payroll_report(self, report_request: schemas.PayrollReportGenerationRequest, created_by: str = None) -> Dict:
        """
        Generate a payroll report for selected weeks
        
        Args:
            report_request: Payroll report generation request
            created_by: User ID who created the report
            
        Returns:
            Dictionary with report generation results
        """
        try:
            # Create payroll report record
            report_data = {
                'report_name': report_request.report_name,
                'description': report_request.description,
                'selected_weeks': report_request.selected_weeks,
                'status': 'generating',
                'created_by': created_by
            }
            
            db_report = models.PayrollReport(**report_data)
            self.db.add(db_report)
            self.db.commit()
            self.db.refresh(db_report)
            
            # Generate report data
            report_items = self._extract_report_data(report_request.selected_weeks)
            
            # Calculate summary
            summary = self._calculate_summary(report_items, report_request.selected_weeks)
            
            # Generate Excel file
            file_path = self._generate_excel_file(report_items, summary, db_report.report_id)
            
            # Update report with file path and status
            db_report.status = 'completed'
            db_report.file_path = file_path
            db_report.generated_on = datetime.now()
            db_report.generated_by = created_by
            db_report.file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
            
            self.db.commit()
            
            return {
                'report_id': str(db_report.report_id),
                'report_name': db_report.report_name,
                'file_path': file_path,
                'status': 'completed',
                'summary': summary,
                'generated_on': db_report.generated_on
            }
            
        except Exception as e:
            # Update report status to failed
            if 'db_report' in locals():
                db_report.status = 'failed'
                self.db.commit()
            
            print(f"Error generating payroll report: {e}")
            import traceback
            traceback.print_exc()
            raise e
    
    def _extract_report_data(self, selected_weeks: List[str]) -> List[schemas.PayrollReportItem]:
        """Extract payroll data for selected weeks from invoices and timesheets"""
        report_items = []
        
        for week in selected_weeks:
            # Get invoices for this week
            invoices = self._get_invoices_for_week(week)
            
            for invoice in invoices:
                # Get invoice line items
                line_items = self._get_invoice_line_items(invoice.invoice_id)
                
                for line_item in line_items:
                    # Get contractor hours for this line item
                    contractor_hours = self._get_contractor_hours_for_line_item(line_item)
                    
                    if contractor_hours:
                        # Get candidate and client information
                        candidate_info = self._get_candidate_info(contractor_hours.contractor_id)
                        client_info = self._get_client_info(invoice.inv_client_id)
                        cost_center_info = self._get_cost_center_info(contractor_hours.pcc_id)
                        
                        # Create report item
                        report_item = self._create_report_item(
                            week, invoice, line_item, contractor_hours, 
                            candidate_info, client_info, cost_center_info
                        )
                        report_items.append(report_item)
        
        return report_items
    
    def _get_invoices_for_week(self, week: str) -> List[models.Invoice]:
        """Get invoices for a specific week"""
        # Parse week format (e.g., "2025-W01" or "2025-01-01")
        if 'W' in week:
            # Week format: YYYY-W##
            year, week_num = week.split('-W')
            year = int(year)
            week_num = int(week_num)
            
            # Calculate date range for the week
            from datetime import datetime, timedelta
            jan_4 = date(year, 1, 4)
            jan_4_weekday = jan_4.weekday()
            week_1_monday = jan_4 - timedelta(days=jan_4_weekday)
            week_start = week_1_monday + timedelta(weeks=week_num - 1)
            week_end = week_start + timedelta(days=6)
        else:
            # Date format: YYYY-MM-DD
            week_start = datetime.strptime(week, "%Y-%m-%d").date()
            week_end = week_start + timedelta(days=6)
        
        # Query invoices for this week
        return self.db.query(models.Invoice).filter(
            and_(
                models.Invoice.invoice_date >= week_start,
                models.Invoice.invoice_date <= week_end,
                models.Invoice.deleted_on.is_(None)
            )
        ).all()
    
    def _get_invoice_line_items(self, invoice_id: str) -> List[models.InvoiceLineItem]:
        """Get line items for an invoice"""
        return self.db.query(models.InvoiceLineItem).filter(
            and_(
                models.InvoiceLineItem.invoice_id == invoice_id,
                models.InvoiceLineItem.deleted_on.is_(None)
            )
        ).all()
    
    def _get_contractor_hours_for_line_item(self, line_item: models.InvoiceLineItem) -> Optional[models.ContractorHours]:
        """Get contractor hours associated with a line item"""
        if line_item.timesheet_id:
            return self.db.query(models.ContractorHours).filter(
                models.ContractorHours.timesheet_id == line_item.timesheet_id
            ).first()
        return None
    
    def _get_candidate_info(self, contractor_id: str) -> Dict:
        """Get candidate information"""
        candidate = self.db.query(models.Candidate).filter(
            models.Candidate.candidate_id == contractor_id
        ).first()
        
        user = self.db.query(models.MUser).filter(
            models.MUser.user_id == contractor_id
        ).first()
        
        return {
            'name': f"{user.first_name} {user.last_name}" if user else "Unknown",
            'email': user.email_id if user else None,
            'pps_number': candidate.pps_number if candidate else None
        }
    
    def _get_client_info(self, client_id: str) -> Dict:
        """Get client information"""
        client = self.db.query(models.Client).filter(
            models.Client.client_id == client_id
        ).first()
        
        return {
            'name': client.client_name if client else "Unknown",
            'email': client.email if client else None
        }
    
    def _get_cost_center_info(self, pcc_id: str) -> Optional[str]:
        """Get cost center information"""
        if not pcc_id:
            return None
            
        cost_center = self.db.query(models.CandidateClientCostCenter).filter(
            models.CandidateClientCostCenter.pcc_id == pcc_id
        ).first()
        
        if cost_center and cost_center.cc_id:
            cc = self.db.query(models.CostCenter).filter(
                models.CostCenter.id == cost_center.cc_id
            ).first()
            return cc.cc_name if cc else None
        
        return None
    
    def _create_report_item(self, week: str, invoice: models.Invoice, line_item: models.InvoiceLineItem, 
                          contractor_hours: models.ContractorHours, candidate_info: Dict, 
                          client_info: Dict, cost_center: Optional[str]) -> schemas.PayrollReportItem:
        """Create a payroll report item from the data"""
        
        # Calculate hours
        standard_hours = contractor_hours.standard_hours or 0.0
        overtime_hours = contractor_hours.weekend_hours or 0.0  # Using weekend as overtime
        holiday_hours = contractor_hours.bank_holiday_hours or 0.0
        weekend_hours = contractor_hours.weekend_hours or 0.0
        oncall_hours = contractor_hours.on_call_hours or 0.0
        total_hours = standard_hours + overtime_hours + holiday_hours + weekend_hours + oncall_hours
        
        # Get rates
        standard_rate = contractor_hours.standard_pay_rate or 0.0
        overtime_rate = contractor_hours.weekend_pay_rate or 0.0
        holiday_rate = contractor_hours.bankholiday_pay_rate or 0.0
        weekend_rate = contractor_hours.weekend_pay_rate or 0.0
        oncall_rate = contractor_hours.oncall_pay_rate or 0.0
        
        # Calculate pay
        standard_pay = standard_hours * standard_rate
        overtime_pay = overtime_hours * overtime_rate
        holiday_pay = holiday_hours * holiday_rate
        weekend_pay = weekend_hours * weekend_rate
        oncall_pay = oncall_hours * oncall_rate
        total_pay = standard_pay + overtime_pay + holiday_pay + weekend_pay + oncall_pay
        
        # Calculate deductions (simplified)
        gross_pay = total_pay
        tax_deduction = gross_pay * 0.20  # 20% tax
        prsi_deduction = gross_pay * 0.04  # 4% PRSI
        usc_deduction = gross_pay * 0.02  # 2% USC
        total_deductions = tax_deduction + prsi_deduction + usc_deduction
        net_pay = gross_pay - total_deductions
        
        return schemas.PayrollReportItem(
            candidate_name=candidate_info['name'],
            candidate_email=candidate_info['email'],
            client_name=client_info['name'],
            cost_center=cost_center,
            week=week,
            invoice_id=str(invoice.invoice_id),
            invoice_date=invoice.invoice_date,
            standard_hours=standard_hours,
            overtime_hours=overtime_hours,
            holiday_hours=holiday_hours,
            weekend_hours=weekend_hours,
            oncall_hours=oncall_hours,
            total_hours=total_hours,
            standard_rate=standard_rate,
            overtime_rate=overtime_rate,
            holiday_rate=holiday_rate,
            weekend_rate=weekend_rate,
            oncall_rate=oncall_rate,
            standard_pay=standard_pay,
            overtime_pay=overtime_pay,
            holiday_pay=holiday_pay,
            weekend_pay=weekend_pay,
            oncall_pay=oncall_pay,
            total_pay=total_pay,
            gross_pay=gross_pay,
            tax_deduction=tax_deduction,
            prsi_deduction=prsi_deduction,
            usc_deduction=usc_deduction,
            total_deductions=total_deductions,
            net_pay=net_pay
        )
    
    def _calculate_summary(self, report_items: List[schemas.PayrollReportItem], weeks: List[str]) -> schemas.PayrollReportSummary:
        """Calculate summary statistics for the report"""
        total_candidates = len(set(item.candidate_name for item in report_items))
        total_hours = sum(item.total_hours for item in report_items)
        total_gross_pay = sum(item.gross_pay for item in report_items)
        total_deductions = sum(item.total_deductions for item in report_items)
        total_net_pay = sum(item.net_pay for item in report_items)
        
        return schemas.PayrollReportSummary(
            total_candidates=total_candidates,
            total_hours=total_hours,
            total_gross_pay=total_gross_pay,
            total_deductions=total_deductions,
            total_net_pay=total_net_pay,
            weeks_covered=weeks,
            report_items=report_items
        )
    
    def _generate_excel_file(self, report_items: List[schemas.PayrollReportItem], 
                           summary: schemas.PayrollReportSummary, report_id: str) -> str:
        """Generate Excel file for the payroll report"""
        try:
            # Create DataFrame
            df_data = []
            for item in report_items:
                df_data.append({
                    'Candidate Name': item.candidate_name,
                    'Candidate Email': item.candidate_email or '',
                    'Client Name': item.client_name,
                    'Cost Center': item.cost_center or '',
                    'Week': item.week,
                    'Invoice ID': item.invoice_id or '',
                    'Invoice Date': item.invoice_date.strftime('%Y-%m-%d') if item.invoice_date else '',
                    'Standard Hours': item.standard_hours,
                    'Overtime Hours': item.overtime_hours,
                    'Holiday Hours': item.holiday_hours,
                    'Weekend Hours': item.weekend_hours,
                    'On-Call Hours': item.oncall_hours,
                    'Total Hours': item.total_hours,
                    'Standard Rate': item.standard_rate,
                    'Overtime Rate': item.overtime_rate,
                    'Holiday Rate': item.holiday_rate,
                    'Weekend Rate': item.weekend_rate,
                    'On-Call Rate': item.oncall_rate,
                    'Standard Pay': item.standard_pay,
                    'Overtime Pay': item.overtime_pay,
                    'Holiday Pay': item.holiday_pay,
                    'Weekend Pay': item.weekend_pay,
                    'On-Call Pay': item.oncall_pay,
                    'Total Pay': item.total_pay,
                    'Gross Pay': item.gross_pay,
                    'Tax Deduction': item.tax_deduction,
                    'PRSI Deduction': item.prsi_deduction,
                    'USC Deduction': item.usc_deduction,
                    'Total Deductions': item.total_deductions,
                    'Net Pay': item.net_pay
                })
            
            df = pd.DataFrame(df_data)
            
            # Create Excel file
            output_dir = "payroll_reports"
            os.makedirs(output_dir, exist_ok=True)
            file_path = f"{output_dir}/payroll_report_{report_id}.xlsx"
            
            with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
                # Write main data
                df.to_excel(writer, sheet_name='Payroll Data', index=False)
                
                # Write summary
                summary_data = {
                    'Metric': ['Total Candidates', 'Total Hours', 'Total Gross Pay', 'Total Deductions', 'Total Net Pay'],
                    'Value': [summary.total_candidates, summary.total_hours, summary.total_gross_pay, summary.total_deductions, summary.total_net_pay]
                }
                summary_df = pd.DataFrame(summary_data)
                summary_df.to_excel(writer, sheet_name='Summary', index=False)
                
                # Write weeks covered
                weeks_data = {'Weeks Covered': summary.weeks_covered}
                weeks_df = pd.DataFrame(weeks_data)
                weeks_df.to_excel(writer, sheet_name='Weeks Covered', index=False)
            
            return file_path
            
        except Exception as e:
            print(f"Error generating Excel file: {e}")
            raise e
    
    def get_available_weeks(self) -> List[Dict]:
        """Get list of available weeks from invoices"""
        # Get unique weeks from invoices
        invoices = self.db.query(models.Invoice).filter(
            models.Invoice.deleted_on.is_(None)
        ).all()
        
        weeks = set()
        for invoice in invoices:
            if invoice.invoice_date:
                # Convert invoice date to week format
                year = invoice.invoice_date.year
                week_num = invoice.invoice_date.isocalendar()[1]
                week_str = f"{year}-W{week_num:02d}"
                weeks.add(week_str)
        
        # Convert to list of dictionaries
        week_list = []
        for week in sorted(weeks):
            week_list.append({
                'week': week,
                'label': f"Week {week.split('-W')[1]} of {week.split('-W')[0]}"
            })
        
        return week_list


def generate_payroll_report(db: Session, report_request: schemas.PayrollReportGenerationRequest, created_by: str = None) -> Dict:
    """Convenience function to generate payroll report"""
    generator = PayrollReportGenerator(db)
    return generator.generate_payroll_report(report_request, created_by)
