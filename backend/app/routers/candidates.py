from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
import math
import uuid
from ..database import get_db
from .. import crud, schemas, models

router = APIRouter()


@router.get("/", response_model=List[schemas.Candidate])
def list_candidates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    try:
        print(f"🔍 DEBUG: Fetching candidates with skip={skip}, limit={limit}")
        candidates = crud.get_candidates(db, skip=skip, limit=limit)
        print(f"🔍 DEBUG: Found {len(candidates)} candidates")
        for candidate in candidates:
            print(f"🔍 DEBUG: Candidate: {candidate.invoice_contact_name} (ID: {candidate.candidate_id})")
        return candidates
    except Exception as e:
        print(f"🔍 DEBUG: Error fetching candidates: {str(e)}")
        print(f"🔍 DEBUG: Error type: {type(e)}")
        import traceback
        print(f"🔍 DEBUG: Traceback: {traceback.format_exc()}")
        raise


@router.post("/", response_model=schemas.Candidate)
def create_candidate(candidate: schemas.CandidateCreate, db: Session = Depends(get_db)):
    return crud.create_candidate(db, candidate)


@router.post("/seed")
def seed_candidates(db: Session = Depends(get_db)):
    """Seed sample candidate data"""
    try:
        # Only seed if no candidates exist
        existing = db.query(models.Candidate).count()
        if existing == 0:
            sample_candidates = [
                {
                    "invoice_contact_name": "Prince Etukudoh",
                    "invoice_email": "prince@example.com",
                    "invoice_phone": "+353-1-234-5678",
                    "address1": "123 Main Street",
                    "town": "Dublin",
                    "county": "Dublin",
                    "eircode": "D01 ABC1",
                    "pps_number": "1234567T",
                },
                {
                    "invoice_contact_name": "John Smith",
                    "invoice_email": "john@example.com",
                    "invoice_phone": "+353-1-234-5679",
                    "address1": "456 Oak Avenue",
                    "town": "Cork",
                    "county": "Cork",
                    "eircode": "T12 XYZ2",
                    "pps_number": "2345678T",
                },
                {
                    "invoice_contact_name": "Jane Doe",
                    "invoice_email": "jane@example.com",
                    "invoice_phone": "+353-1-234-5680",
                    "address1": "789 Pine Road",
                    "town": "Galway",
                    "county": "Galway",
                    "eircode": "H91 DEF3",
                    "pps_number": "3456789T",
                },
                {
                    "invoice_contact_name": "Mike Johnson",
                    "invoice_email": "mike@example.com",
                    "invoice_phone": "+353-1-234-5681",
                    "address1": "321 Elm Street",
                    "town": "Limerick",
                    "county": "Limerick",
                    "eircode": "V94 GHI4",
                    "pps_number": "4567890T",
                },
                {
                    "invoice_contact_name": "Sarah Wilson",
                    "invoice_email": "sarah@example.com",
                    "invoice_phone": "+353-1-234-5682",
                    "address1": "654 Maple Drive",
                    "town": "Waterford",
                    "county": "Waterford",
                    "eircode": "X91 JKL5",
                    "pps_number": "5678901T",
                },
            ]
            
            for candidate_data in sample_candidates:
                candidate = models.Candidate(
                    candidate_id=uuid.uuid4(),
                    **candidate_data
                )
                db.add(candidate)
            
            db.commit()
            
        return {"seeded": True, "message": "Sample candidates created successfully"}
    except Exception as e:
        print(f"Error in seed_candidates: {e}")
        return {"error": str(e)}

