from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from ..database import get_db
from .. import crud, schemas
from ..auth import get_current_m_user

router = APIRouter()


@router.get("/clients/{client_id}/cost-centers", response_model=List[schemas.CostCenter])
def get_cost_centers_by_client(
    client_id: UUID,
    db: Session = Depends(get_db),
    current_user: schemas.MUserAuth = Depends(get_current_m_user)
):
    """Get all cost centers for a specific client"""
    try:
        print(f"🔄 Getting cost centers for client {client_id}")
        cost_centers = crud.get_cost_centers_by_client(db, client_id=client_id)
        print(f"✅ Returning {len(cost_centers)} cost centers")
        return cost_centers
    except Exception as e:
        print(f"❌ Error in get_cost_centers_by_client endpoint: {e}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        raise


@router.get("/cost-centers/{cost_center_id}", response_model=schemas.CostCenter)
def get_cost_center(
    cost_center_id: UUID,
    db: Session = Depends(get_db),
    current_user: schemas.MUserAuth = Depends(get_current_m_user)
):
    """Get a specific cost center by ID"""
    cost_center = crud.get_cost_center(db, cost_center_id=cost_center_id)
    if not cost_center:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cost center not found"
        )
    return cost_center


@router.post("/clients/{client_id}/cost-centers", response_model=schemas.CostCenter)
def create_cost_center(
    client_id: UUID,
    cost_center: schemas.CostCenterCreate,
    db: Session = Depends(get_db),
    current_user: schemas.MUserAuth = Depends(get_current_m_user)
):
    """Create a new cost center for a client"""
    try:
        print(f"🔄 Creating cost center for client {client_id}")
        print(f"🔄 Cost center data: {cost_center}")
        print(f"🔄 Current user: {current_user.user_id}")
        
        # Ensure the client_id in the path matches the one in the request body
        if cost_center.client_id != client_id:
            print(f"❌ Client ID mismatch: path={client_id}, body={cost_center.client_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Client ID in path must match client ID in request body"
            )
        
        result = crud.create_cost_center(db=db, cost_center=cost_center, created_by=current_user.user_id)
        print(f"✅ Cost center created successfully: {result.id}")
        return result
    except Exception as e:
        print(f"❌ Error in create_cost_center endpoint: {e}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        raise


@router.put("/cost-centers/{cost_center_id}", response_model=schemas.CostCenter)
def update_cost_center(
    cost_center_id: UUID,
    cost_center_update: schemas.CostCenterUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.MUserAuth = Depends(get_current_m_user)
):
    """Update an existing cost center"""
    cost_center = crud.update_cost_center(
        db=db, 
        cost_center_id=cost_center_id, 
        cost_center_update=cost_center_update,
        updated_by=current_user.user_id
    )
    if not cost_center:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cost center not found"
        )
    return cost_center


@router.delete("/cost-centers/{cost_center_id}")
def delete_cost_center(
    cost_center_id: UUID,
    db: Session = Depends(get_db),
    current_user: schemas.MUserAuth = Depends(get_current_m_user)
):
    """Delete a cost center"""
    success = crud.delete_cost_center(
        db=db, 
        cost_center_id=cost_center_id,
        deleted_by=current_user.user_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cost center not found"
        )
    return {"message": "Cost center deleted successfully"}
