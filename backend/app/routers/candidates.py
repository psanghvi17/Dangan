from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
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

