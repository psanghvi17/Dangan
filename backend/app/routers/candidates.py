from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
import math
from ..database import get_db
from .. import crud, schemas

router = APIRouter()


@router.post("/create-user", response_model=schemas.MUserOut)
def create_m_user(user: schemas.MUserCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_m_user(db, user)
    except Exception as e:
        print(f"Error creating user: {e}")
        raise


@router.get("/list", response_model=schemas.CandidateListResponse)
def get_candidates_list(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """Get paginated list of candidates"""
    try:
        print(f"🚀 API called with page={page}, limit={limit}")
        skip = (page - 1) * limit
        print(f"🚀 Skip={skip}")
        
        candidates_data = crud.get_candidates_paginated(db, skip=skip, limit=limit)
        print(f"🚀 Got {len(candidates_data)} candidates from database")
        
        total = crud.count_candidates(db)
        print(f"🚀 Total count: {total}")
        
        # Convert the joined results to candidate list items
        candidates = []
        for m_user, candidate in candidates_data:
            print(f"🚀 Processing user: {m_user.first_name} {m_user.last_name}")
            candidates.append(schemas.CandidateListItem(
                user_id=m_user.user_id,
                first_name=m_user.first_name,
                last_name=m_user.last_name,
                email_id=m_user.email_id,
                created_on=m_user.created_on
            ))
        
        print(f"🚀 Final candidates list: {len(candidates)}")
        
        total_pages = math.ceil(total / limit) if total > 0 else 1
        
        response = schemas.CandidateListResponse(
            candidates=candidates,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
        
        print(f"🚀 Returning response: {response}")
        return response
        
    except Exception as e:
        print(f"❌ Error getting candidates: {e}")
        import traceback
        traceback.print_exc()
        raise

