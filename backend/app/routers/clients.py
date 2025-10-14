from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, schemas, auth
import logging

router = APIRouter()


# Rate Types and Frequencies endpoints (MUST be before any parameterized routes)
@router.get("/rate-types")
def get_rate_types(db: Session = Depends(get_db)):
    try:
        return crud.get_all_rate_types(db)
    except Exception as e:
        logging.exception("Failed to get rate types")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rate-frequencies")
def get_rate_frequencies(db: Session = Depends(get_db)):
    try:
        return crud.get_all_rate_frequencies(db)
    except Exception as e:
        logging.exception("Failed to get rate frequencies")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=schemas.Client)
def create_client(
    client: schemas.ClientCreate,
    db: Session = Depends(get_db),
):
    try:
        return crud.create_client(db, client)
    except Exception as e:
        logging.exception("Failed to create client")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
def list_clients(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    try:
        # Get clients with active contracts count
        results = crud.get_clients_with_active_contracts_count(db, skip=skip, limit=limit)
        
        # Transform results to include active_contracts_count
        items = []
        for client, active_contracts_count in results:
            client_dict = {
                "client_id": client.client_id,
                "client_name": client.client_name,
                "email": client.email,
                "description": client.description,
                "contact_email": client.contact_email,
                "contact_name": client.contact_name,
                "contact_phone": client.contact_phone,
                "created_on": client.created_on,
                "updated_on": client.updated_on,
                "deleted_on": client.deleted_on,
                "deleted_by": client.deleted_by,
                "active_contracts_count": active_contracts_count
            }
            items.append(client_dict)
        
        total = crud.count_clients(db)
        return {"items": items, "total": total}
    except Exception as e:
        logging.exception("Failed to list clients")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{client_id}", response_model=schemas.Client)
def get_client(
    client_id: str,
    db: Session = Depends(get_db),
):
    try:
        client = crud.get_client(db, client_id)
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        return client
    except HTTPException:
        raise
    except Exception as e:
        logging.exception("Failed to get client")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{client_id}", response_model=schemas.Client)
def update_client(
    client_id: str,
    client: schemas.ClientUpdate,
    db: Session = Depends(get_db),
):
    try:
        updated_client = crud.update_client(db, client_id, client)
        if not updated_client:
            raise HTTPException(status_code=404, detail="Client not found")
        return updated_client
    except HTTPException:
        raise
    except Exception as e:
        logging.exception("Failed to update client")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{client_id}")
def delete_client(
    client_id: str,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(auth.get_current_user)
):
    try:
        deleted_client = crud.soft_delete_client(db, client_id, current_user.username)
        if not deleted_client:
            raise HTTPException(status_code=404, detail="Client not found")
        return {"message": "Client deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logging.exception("Failed to delete client")
        raise HTTPException(status_code=500, detail=str(e))


# Client Rates endpoints
@router.post("/{client_id}/rates", response_model=schemas.ClientRate)
def create_client_rate(
    client_id: str,
    client_rate: schemas.ClientRateCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(auth.get_current_user)
):
    try:
        # Set the client_id from URL parameter
        client_rate.client_id = client_id
        return crud.create_client_rate(db, client_rate, current_user.username)
    except Exception as e:
        logging.exception("Failed to create client rate")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{client_id}/rates", response_model=List[schemas.ClientRate])
def get_client_rates(
    client_id: str,
    db: Session = Depends(get_db)
):
    try:
        return crud.get_client_rates(db, client_id)
    except Exception as e:
        logging.exception("Failed to get client rates")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{client_id}/rates/{rate_id}", response_model=schemas.ClientRate)
def update_client_rate(
    client_id: str,
    rate_id: str,
    client_rate: schemas.ClientRateUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(auth.get_current_user)
):
    try:
        updated_rate = crud.update_client_rate(db, rate_id, client_rate, current_user.username)
        if not updated_rate:
            raise HTTPException(status_code=404, detail="Client rate not found")
        return updated_rate
    except HTTPException:
        raise
    except Exception as e:
        logging.exception("Failed to update client rate")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{client_id}/rates/{rate_id}")
def delete_client_rate(
    client_id: str,
    rate_id: str,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(auth.get_current_user)
):
    try:
        deleted_rate = crud.soft_delete_client_rate(db, rate_id, current_user.username)
        if not deleted_rate:
            raise HTTPException(status_code=404, detail="Client rate not found")
        return {"message": "Client rate deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logging.exception("Failed to delete client rate")
        raise HTTPException(status_code=500, detail=str(e))


