from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import schemas, models

router = APIRouter()


@router.get("/", response_model=List[schemas.Invoice])
def list_invoices(db: Session = Depends(get_db)):
    """Get all invoices where show_invoices is not False and deleted_on is null"""
    try:
        invoices = db.query(models.Invoice).filter(
            models.Invoice.show_invoices != False,
            models.Invoice.deleted_on.is_(None)
        ).all()
        return invoices
    except Exception as e:
        print(f"Error in list_invoices: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching invoices: {str(e)}")


@router.get("/{invoice_id}", response_model=schemas.Invoice)
def get_invoice(invoice_id: str, db: Session = Depends(get_db)):
    """Get a specific invoice by ID"""
    try:
        invoice = db.query(models.Invoice).filter(
            models.Invoice.invoice_id == invoice_id,
            models.Invoice.deleted_on.is_(None)
        ).first()
        
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        return invoice
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_invoice: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching invoice: {str(e)}")
