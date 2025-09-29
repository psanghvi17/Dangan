from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import crud, schemas, models
from sqlalchemy.sql import func

router = APIRouter()


@router.get("/", response_model=List[schemas.TimesheetSummary])
def list_timesheets(
    month: Optional[str] = Query(None, description="Month label like 'April 2025'"),
    db: Session = Depends(get_db),
):
    try:
        rows = crud.list_timesheet_summaries(db, month_label=month)
        return rows
    except Exception as e:
        print(f"Error in list_timesheets: {e}")
        return []


@router.get("/{timesheet_id}", response_model=schemas.TimesheetDetail)
def get_timesheet(timesheet_id: str, db: Session = Depends(get_db)):
    """Get a specific timesheet with all its entries"""
    timesheet = crud.get_timesheet_detail(db, timesheet_id)
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    return timesheet


@router.post("/{timesheet_id}/entries", response_model=schemas.TimesheetEntry)
def create_timesheet_entry(
    timesheet_id: str,
    entry: schemas.TimesheetEntryCreate,
    db: Session = Depends(get_db)
):
    """Create a new timesheet entry"""
    entry.timesheet_id = timesheet_id
    return crud.create_timesheet_entry(db, entry)


@router.put("/entries/{entry_id}", response_model=schemas.TimesheetEntry)
def update_timesheet_entry(
    entry_id: str,
    entry_update: schemas.TimesheetEntryUpdate,
    db: Session = Depends(get_db)
):
    """Update a timesheet entry"""
    return crud.update_timesheet_entry(db, entry_id, entry_update)


@router.post("/seed")
def seed_timesheets(db: Session = Depends(get_db)):
    try:
        # Only seed if table is empty
        existing = db.query(models.Timesheet).count()
        if existing == 0:
            # Create timesheets with more detailed data
            timesheets_data = [
                {
                    "month": "April 2025", 
                    "week": "Week 4",
                    "date_range": "7th-14th Apr 2025",
                    "status": "Open"
                },
                {
                    "month": "April 2025", 
                    "week": "Week 3",
                    "date_range": "31st Mar-6th Apr 2025",
                    "status": "Close"
                },
                {
                    "month": "April 2025", 
                    "week": "Week 2",
                    "date_range": "24th-30th Mar 2025",
                    "status": "Open"
                },
                {
                    "month": "April 2025", 
                    "week": "Week 1",
                    "date_range": "17th-23rd Mar 2025",
                    "status": "Close"
                },
            ]
            
            created_timesheets = []
            for ts_data in timesheets_data:
                timesheet = models.Timesheet(**ts_data)
                db.add(timesheet)
                db.flush()  # Get the ID
                created_timesheets.append(timesheet)
            
            db.commit()
            
            # Create sample entries for the first timesheet
            if created_timesheets:
                first_timesheet = created_timesheets[0]
                sample_entries = [
                    {
                        "timesheet_id": first_timesheet.timesheet_id,
                        "employee_name": "Prince Etukudoh",
                        "employee_code": "0101",
                        "client_name": "Greenstar OSR_WEST DUB",
                        "filled": True,
                        "standard_hours": 18,
                        "rate2_hours": 12,
                        "rate3_hours": 15,
                        "rate4_hours": 16,
                        "rate5_hours": 10,
                        "rate6_hours": 10,
                        "holiday_hours": 10,
                        "bank_holiday_hours": 6,
                    },
                    {
                        "timesheet_id": first_timesheet.timesheet_id,
                        "employee_name": "John Smith",
                        "employee_code": "0102",
                        "client_name": "TechCorp Ltd",
                        "filled": False,
                        "standard_hours": 25,
                        "rate2_hours": 32,
                        "rate3_hours": 12,
                        "rate4_hours": 0,
                        "rate5_hours": 22,
                        "rate6_hours": 0,
                        "holiday_hours": 0,
                        "bank_holiday_hours": 6,
                    },
                    {
                        "timesheet_id": first_timesheet.timesheet_id,
                        "employee_name": "Jane Doe",
                        "employee_code": "0103",
                        "client_name": "DataFlow Inc",
                        "filled": True,
                        "standard_hours": 12,
                        "rate2_hours": 0,
                        "rate3_hours": 12,
                        "rate4_hours": 0,
                        "rate5_hours": 12,
                        "rate6_hours": 0,
                        "holiday_hours": 10,
                        "bank_holiday_hours": 24,
                    },
                ]
                
                for entry_data in sample_entries:
                    entry = models.TimesheetEntry(**entry_data)
                    db.add(entry)
                
                db.commit()
                
        return {"seeded": True, "message": "Test data created successfully"}
    except Exception as e:
        print(f"Error in seed_timesheets: {e}")
        return {"error": str(e)}


