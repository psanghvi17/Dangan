from fastapi import APIRouter, Depends, Query, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import crud, schemas, models
from sqlalchemy.sql import func
import uuid
import json

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


@router.get("/latest")
def get_latest_timesheet(db: Session = Depends(get_db)):
    """Get the most recently created timesheet"""
    try:
        latest = crud.get_latest_timesheet(db)
        if not latest:
            raise HTTPException(status_code=404, detail="No timesheets found")
        return latest
    except Exception as e:
        print(f"Error getting latest timesheet: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting latest timesheet: {str(e)}")


@router.post("/", response_model=schemas.TimesheetDetail)
def create_timesheet(timesheet: schemas.TimesheetCreate, db: Session = Depends(get_db)):
    """Create a new timesheet with entries for specified candidates"""
    try:
        print(f"🔍 DEBUG: Creating timesheet with data: {timesheet}")
        print(f"🔍 DEBUG: Candidate IDs received: {timesheet.candidate_ids}")
        
        # Create the timesheet
        timesheet_id = str(uuid.uuid4())
        print(f"🔍 DEBUG: Generated timesheet_id: {timesheet_id}")
        
        new_timesheet = models.Timesheet(
            timesheet_id=timesheet_id,
            month=timesheet.month,
            week=timesheet.week,
            status="Open"
        )
        db.add(new_timesheet)
        db.flush()  # Get the ID
        print(f"🔍 DEBUG: Timesheet created successfully")
        
        # Get candidates to create entries for
        # Convert string IDs to UUIDs for the query
        candidate_uuids = []
        for candidate_id in timesheet.candidate_ids:
            try:
                candidate_uuids.append(uuid.UUID(candidate_id))
                print(f"🔍 DEBUG: Converted candidate_id {candidate_id} to UUID")
            except ValueError as ve:
                print(f"🔍 DEBUG: Invalid UUID {candidate_id}: {ve}")
                # Skip invalid UUIDs
                continue
        
        print(f"🔍 DEBUG: Valid candidate UUIDs: {candidate_uuids}")
        
        candidates = db.query(models.Candidate).filter(
            models.Candidate.candidate_id.in_(candidate_uuids)
        ).all()
        
        print(f"🔍 DEBUG: Found {len(candidates)} candidates in database")
        for candidate in candidates:
            print(f"🔍 DEBUG: Candidate: {candidate.invoice_contact_name} (ID: {candidate.candidate_id})")
        
        # Create entries for each candidate
        entries_created = 0
        for candidate in candidates:
            entry = models.TimesheetEntry(
                timesheet_id=timesheet_id,
                employee_name=candidate.invoice_contact_name or "Unknown",
                employee_code=str(candidate.candidate_id)[:8],  # Use first 8 chars of UUID
                client_name="Default Client",  # You might want to get this from client_id
                filled=False,
                standard_hours=0,
                rate2_hours=0,
                rate3_hours=0,
                rate4_hours=0,
                rate5_hours=0,
                rate6_hours=0,
                holiday_hours=0,
                bank_holiday_hours=0
            )
            db.add(entry)
            entries_created += 1
            print(f"🔍 DEBUG: Created entry for {candidate.invoice_contact_name}")
        
        print(f"🔍 DEBUG: Created {entries_created} entries")
        db.commit()
        print(f"🔍 DEBUG: Database committed successfully")
        
        # Return the created timesheet with entries
        result = crud.get_timesheet_detail(db, timesheet_id)
        print(f"🔍 DEBUG: Returning timesheet with {len(result.entries)} entries")
        return result
        
    except Exception as e:
        print(f"🔍 DEBUG: Error creating timesheet: {str(e)}")
        print(f"🔍 DEBUG: Error type: {type(e)}")
        import traceback
        print(f"🔍 DEBUG: Traceback: {traceback.format_exc()}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating timesheet: {str(e)}")


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


@router.post("/{timesheet_id}/contractor-hours", response_model=List[schemas.ContractorHoursOut])
def save_contractor_hours(
    timesheet_id: str,
    items: List[schemas.ContractorHoursCreate],
    db: Session = Depends(get_db)
):
    """Bulk save contractor hours rows for a timesheet."""
    normalized: List[schemas.ContractorHoursCreate] = []
    for item in items:
        data = item.model_dump()
        data["timesheet_id"] = timesheet_id
        normalized.append(schemas.ContractorHoursCreate(**data))
    rows = crud.bulk_create_contractor_hours(db, normalized)
    return rows


@router.get("/{timesheet_id}/contractor-hours", response_model=List[schemas.ContractorHoursOut])
def list_contractor_hours(timesheet_id: str, db: Session = Depends(get_db)):
    return crud.list_contractor_hours_by_timesheet(db, timesheet_id)


@router.post("/{timesheet_id}/contractor-hours/upsert-debug")
async def upsert_contractor_hours_debug(
    timesheet_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Debug endpoint to see raw request data"""
    try:
        body = await request.body()
        print(f"🔍 DEBUG: Raw request body: {body}")
        
        json_data = await request.json()
        print(f"🔍 DEBUG: Parsed JSON: {json.dumps(json_data, indent=2)}")
        
        return {"message": "Debug data logged", "data": json_data}
    except Exception as e:
        print(f"🔍 DEBUG: Error in debug endpoint: {e}")
        return {"error": str(e)}


@router.post("/{timesheet_id}/contractor-hours/upsert", response_model=List[schemas.ContractorHoursOut])
async def upsert_contractor_hours(
    timesheet_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    try:
        # Get raw JSON data
        json_data = await request.json()
        print(f"🔍 DEBUG: Received raw JSON data: {json.dumps(json_data, indent=2)}")
        print(f"🔍 DEBUG: Timesheet ID: {timesheet_id}")
        
        if not isinstance(json_data, list):
            raise HTTPException(status_code=400, detail="Expected array of items")
        
        print(f"🔍 DEBUG: Processing {len(json_data)} items")
        
        normalized: List[schemas.ContractorHoursUpsert] = []
        for i, item_data in enumerate(json_data):
            try:
                # Clean the data
                data = item_data.copy()
                data["timesheet_id"] = timesheet_id
                
                # Handle empty tch_id strings
                if data.get("tch_id") == "":
                    data["tch_id"] = None
                
                # Convert string dates to date objects
                if data.get("work_date"):
                    if isinstance(data["work_date"], str):
                        from datetime import datetime
                        data["work_date"] = datetime.strptime(data["work_date"], "%Y-%m-%d").date()
                
                # Handle empty tch_id in rate_hours
                if data.get("rate_hours"):
                    for rate_hour in data["rate_hours"]:
                        if rate_hour.get("tch_id") == "":
                            rate_hour["tch_id"] = None
                
                print(f"🔍 DEBUG: Processing item {i}: {data}")
                
                # Create the schema object
                schema_item = schemas.ContractorHoursUpsert(**data)
                normalized.append(schema_item)
                
            except Exception as e:
                print(f"🔍 DEBUG: Error processing item {i}: {e}")
                print(f"🔍 DEBUG: Item data: {item_data}")
                import traceback
                print(f"🔍 DEBUG: Traceback: {traceback.format_exc()}")
                raise HTTPException(status_code=422, detail=f"Error processing item {i}: {str(e)}")
        
        print(f"🔍 DEBUG: Successfully normalized {len(normalized)} items")
        result = crud.upsert_contractor_hours(db, normalized)
        print(f"🔍 DEBUG: Upsert completed, returning {len(result)} results")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"🔍 DEBUG: Error in upsert_contractor_hours: {e}")
        print(f"🔍 DEBUG: Error type: {type(e)}")
        import traceback
        print(f"🔍 DEBUG: Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


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


# Contractor Rate Hours endpoints
@router.post("/contractor-rate-hours/", response_model=List[schemas.ContractorRateHoursOut])
def create_contractor_rate_hours(
    multiple_rates: schemas.MultipleRateHoursCreate,
    db: Session = Depends(get_db)
):
    """Create multiple contractor rate hours entries for a single tch_id"""
    try:
        created_rates = crud.create_multiple_contractor_rate_hours(db, multiple_rates)
        return [schemas.ContractorRateHoursOut.model_validate(rate) for rate in created_rates]
    except Exception as e:
        print(f"Error creating contractor rate hours: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating contractor rate hours: {str(e)}")


@router.post("/contractor-rate-hours/upsert", response_model=List[schemas.ContractorRateHoursOut])
def upsert_contractor_rate_hours(
    multiple_rates: schemas.MultipleRateHoursCreate,
    db: Session = Depends(get_db)
):
    """Upsert multiple contractor rate hours entries for a single tch_id"""
    try:
        upserted_rates = crud.upsert_multiple_contractor_rate_hours(db, multiple_rates)
        return [schemas.ContractorRateHoursOut.model_validate(rate) for rate in upserted_rates]
    except Exception as e:
        print(f"Error upserting contractor rate hours: {e}")
        raise HTTPException(status_code=500, detail=f"Error upserting contractor rate hours: {str(e)}")


@router.get("/contractor-rate-hours/{tch_id}", response_model=List[schemas.ContractorRateHoursOut])
def get_contractor_rate_hours(
    tch_id: str,
    db: Session = Depends(get_db)
):
    """Get all rate hours entries for a specific contractor hours record"""
    try:
        tch_uuid = uuid.UUID(tch_id)
        rate_hours = crud.get_contractor_rate_hours_by_tch_id(db, tch_uuid)
        return [schemas.ContractorRateHoursOut.model_validate(rate) for rate in rate_hours]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")
    except Exception as e:
        print(f"Error getting contractor rate hours: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting contractor rate hours: {str(e)}")


@router.put("/contractor-rate-hours/{tcrh_id}", response_model=schemas.ContractorRateHoursOut)
def update_contractor_rate_hours(
    tcrh_id: int,
    rate_hours_update: schemas.ContractorRateHoursUpdate,
    db: Session = Depends(get_db)
):
    """Update a contractor rate hours entry"""
    try:
        updated_rate = crud.update_contractor_rate_hours(db, tcrh_id, rate_hours_update)
        if not updated_rate:
            raise HTTPException(status_code=404, detail="Contractor rate hours not found")
        return schemas.ContractorRateHoursOut.model_validate(updated_rate)
    except Exception as e:
        print(f"Error updating contractor rate hours: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating contractor rate hours: {str(e)}")


@router.delete("/contractor-rate-hours/{tcrh_id}")
def delete_contractor_rate_hours(
    tcrh_id: int,
    deleted_by: str = Query(..., description="UUID of user performing deletion"),
    db: Session = Depends(get_db)
):
    """Soft delete a contractor rate hours entry"""
    try:
        deleted_by_uuid = uuid.UUID(deleted_by)
        deleted_rate = crud.delete_contractor_rate_hours(db, tcrh_id, deleted_by_uuid)
        if not deleted_rate:
            raise HTTPException(status_code=404, detail="Contractor rate hours not found")
        return {"message": "Contractor rate hours deleted successfully"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")
    except Exception as e:
        print(f"Error deleting contractor rate hours: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting contractor rate hours: {str(e)}")


@router.delete("/contractor-rate-hours/tch/{tch_id}/all")
def delete_all_contractor_rate_hours_for_tch(
    tch_id: str,
    deleted_by: str = Query(..., description="UUID of user performing deletion"),
    db: Session = Depends(get_db)
):
    """Soft delete all rate hours entries for a specific contractor hours record"""
    try:
        tch_uuid = uuid.UUID(tch_id)
        deleted_by_uuid = uuid.UUID(deleted_by)
        deleted_count = crud.delete_all_contractor_rate_hours_for_tch(db, tch_uuid, deleted_by_uuid)
        return {"message": f"Deleted {deleted_count} contractor rate hours entries"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")
    except Exception as e:
        print(f"Error deleting contractor rate hours: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting contractor rate hours: {str(e)}")


