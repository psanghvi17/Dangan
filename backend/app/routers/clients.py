from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, schemas, auth
import logging

router = APIRouter()


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
