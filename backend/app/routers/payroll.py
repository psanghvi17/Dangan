from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from uuid import UUID
from datetime import datetime
import os

from ..database import get_db
from .. import models, schemas, crud
from ..auth import get_current_user
from ..services.payroll_report_generator import generate_payroll_report, PayrollReportGenerator

router = APIRouter(prefix="/payroll", tags=["payroll"])


# Payroll Report Endpoints

@router.post("/reports", response_model=schemas.PayrollReport)
def create_payroll_report(
    report: schemas.PayrollReportCreate,
    current_user: schemas.MUserAuth = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new payroll report"""
    try:
        return crud.create_payroll_report(db, report, current_user.user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating payroll report: {str(e)}")


@router.get("/reports", response_model=List[schemas.PayrollReport])
def get_payroll_reports(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all payroll reports"""
    try:
        return crud.get_payroll_reports(db, skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching payroll reports: {str(e)}")


@router.get("/reports/{report_id}", response_model=schemas.PayrollReport)
def get_payroll_report(
    report_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific payroll report"""
    try:
        report = crud.get_payroll_report(db, report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Payroll report not found")
        return report
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching payroll report: {str(e)}")


@router.put("/reports/{report_id}", response_model=schemas.PayrollReport)
def update_payroll_report(
    report_id: UUID,
    report_update: schemas.PayrollReportUpdate,
    current_user: schemas.MUserAuth = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a payroll report"""
    try:
        report = crud.update_payroll_report(db, report_id, report_update, current_user.user_id)
        if not report:
            raise HTTPException(status_code=404, detail="Payroll report not found")
        return report
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating payroll report: {str(e)}")


@router.delete("/reports/{report_id}")
def delete_payroll_report(
    report_id: UUID,
    current_user: schemas.MUserAuth = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a payroll report"""
    try:
        report = crud.delete_payroll_report(db, report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Payroll report not found")
        return {"message": "Payroll report deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting payroll report: {str(e)}")


@router.get("/weeks", response_model=List[Dict])
def get_available_weeks(
    db: Session = Depends(get_db)
):
    """Get list of available weeks for payroll reports"""
    try:
        generator = PayrollReportGenerator(db)
        return generator.get_available_weeks()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching available weeks: {str(e)}")


@router.post("/reports/generate", response_model=Dict)
def generate_payroll_report(
    request: schemas.PayrollReportGenerationRequest,
    current_user: schemas.MUserAuth = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a payroll report for selected weeks"""
    try:
        result = generate_payroll_report(db, request, str(current_user.user_id))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating payroll report: {str(e)}")


@router.get("/reports/{report_id}/download")
def download_payroll_report(
    report_id: UUID,
    db: Session = Depends(get_db)
):
    """Download a generated payroll report file"""
    try:
        report = crud.get_payroll_report(db, report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Payroll report not found")
        
        if not report.file_path or not os.path.exists(report.file_path):
            raise HTTPException(status_code=404, detail="Report file not found")
        
        from fastapi.responses import FileResponse
        return FileResponse(
            path=report.file_path,
            filename=f"payroll_report_{report.report_name}.xlsx",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading payroll report: {str(e)}")
