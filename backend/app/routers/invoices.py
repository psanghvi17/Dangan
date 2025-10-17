from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, text
from typing import List
from datetime import datetime, date, timedelta
import uuid
from ..database import get_db
from .. import schemas, models, crud

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


@router.get("/{invoice_id}/details", response_model=schemas.InvoiceWithLineItems)
def get_invoice_with_line_items(invoice_id: str, db: Session = Depends(get_db)):
    """Get invoice with its line items"""
    try:
        # Get invoice
        invoice = db.query(models.Invoice).filter(
            models.Invoice.invoice_id == invoice_id,
            models.Invoice.deleted_on.is_(None)
        ).first()
        
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Get line items for this invoice with rate type and frequency names
        line_items_query = (
            db.query(
                models.InvoiceLineItem,
                models.RateType.rate_type_name,
                models.RateFrequency.rate_frequency_name
            )
            .outerjoin(
                models.RateType, 
                models.InvoiceLineItem.type == models.RateType.rate_type_id
            )
            .outerjoin(
                models.ContractRate,
                models.InvoiceLineItem.tcr_id == models.ContractRate.id
            )
            .outerjoin(
                models.RateFrequency,
                models.ContractRate.rate_frequency == models.RateFrequency.rate_frequency_id
            )
            .filter(
                models.InvoiceLineItem.invoice_id == invoice_id,
                models.InvoiceLineItem.deleted_on.is_(None)
            )
        )
        
        line_items_with_details = line_items_query.all()
        
        # Transform the results to include rate type and frequency names
        line_items = []
        for line_item, rate_type_name, rate_frequency_name in line_items_with_details:
            # Create a new object with additional fields
            line_item_dict = {
                'pili_id': line_item.pili_id,
                'invoice_id': line_item.invoice_id,
                'type': line_item.type,
                'quantity': line_item.quantity,
                'rate': line_item.rate,
                'timesheet_id': line_item.timesheet_id,
                'm_rate_name': line_item.m_rate_name,
                'total': line_item.total,
                'tcr_id': line_item.tcr_id,
                'created_on': line_item.created_on,
                'updated_on': line_item.updated_on,
                'created_by': line_item.created_by,
                'updated_by': line_item.updated_by,
                'deleted_by': line_item.deleted_by,
                'deleted_on': line_item.deleted_on,
                'rate_type_name': rate_type_name,
                'rate_frequency_name': rate_frequency_name
            }
            line_items.append(line_item_dict)
        
        return schemas.InvoiceWithLineItems(
            invoice=invoice,
            line_items=line_items
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_invoice_with_line_items: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching invoice details: {str(e)}")


@router.post("/generate", response_model=schemas.GenerateInvoiceResponse)
def generate_invoice(
    request: schemas.GenerateInvoiceRequest,
    db: Session = Depends(get_db)
):
    """Generate invoice with line items based on contractor hours and rates"""
    try:
        print(f"🔍 DEBUG: Generate invoice request: {request}")
        print(f"🔍 DEBUG: Client IDs: {request.clientIds}")
        print(f"🔍 DEBUG: Week: {request.week}")
        print(f"🔍 DEBUG: Invoice Date: {request.invoiceDate}")
        print(f"🔍 DEBUG: Week format check - contains 'W': {'W' in request.week}")
        
        # Start transaction
        db.begin()
        
        # 1. Parse invoice date
        invoice_date = datetime.strptime(request.invoiceDate, "%Y-%m-%d").date()
        
        # 2. Calculate the last working day (Friday) of the selected week
        # Handle both date format (YYYY-MM-DD) and week format (YYYY-W##)
        if 'W' in request.week:
            # Week format: YYYY-W## (e.g., "2025-W44")
            year, week_num = request.week.split('-W')
            year = int(year)
            week_num = int(week_num)
            
            # Calculate the Monday of the specified week
            # ISO week starts on Monday
            jan_4 = date(year, 1, 4)  # January 4th is always in week 1
            jan_4_weekday = jan_4.weekday()  # Monday = 0
            week_1_monday = jan_4 - timedelta(days=jan_4_weekday)
            week_start = week_1_monday + timedelta(weeks=week_num - 1)
        else:
            # Date format: YYYY-MM-DD
            week_start = datetime.strptime(request.week, "%Y-%m-%d").date()
        
        # Calculate the last working day (Friday) of the week
        last_working_day = week_start + timedelta(days=4)  # Monday + 4 days = Friday
        week_end = week_start + timedelta(days=6)  # Monday + 6 days = Sunday
        
        print(f"🔍 DEBUG: Input week: {request.week}")
        print(f"🔍 DEBUG: Extracted year: {year}, week_num: {week_num}")
        print(f"🔍 DEBUG: Calculated week_start (Monday): {week_start}")
        print(f"🔍 DEBUG: Calculated week_end (Sunday): {week_end}")
        print(f"🔍 DEBUG: Calculated last_working_day (Friday): {last_working_day}")
        
        # Verify calculation for 2026-W4 should be 2026-01-22
        if request.week == "2026-W04" or request.week == "2026-W4":
            expected_friday = date(2026, 1, 22)
            if last_working_day == expected_friday:
                print(f"✅ DEBUG: Calculation correct! 2026-W4 = {last_working_day}")
            else:
                print(f"❌ DEBUG: Calculation error! Expected {expected_friday}, got {last_working_day}")
        
        # Query contractor hours using work_date (last working day) instead of week column
        # First, let's check what records exist for this date
        all_tch_for_date = db.query(models.ContractorHours).filter(
            models.ContractorHours.work_date == last_working_day
        ).all()
        
        print(f"🔍 DEBUG: Found {len(all_tch_for_date)} total contractor hours for work_date {last_working_day}")
        for tch in all_tch_for_date:
            print(f"🔍 DEBUG: TCH {tch.tch_id}: status='{tch.status}', standard_hours={tch.standard_hours}, pcc_id={tch.pcc_id}")
        
        # Query contractor hours - try without status filter first to see what we have
        tch_query = db.query(models.ContractorHours).filter(
            models.ContractorHours.work_date == last_working_day
        )
        
        # Filter by selected clients (join with p_candidate_client)
        if request.clientIds:
            tch_query = tch_query.join(
                models.P_CandidateClient,
                models.ContractorHours.pcc_id == models.P_CandidateClient.pcc_id
            ).filter(models.P_CandidateClient.client_id.in_(request.clientIds))
        
        contractor_hours = tch_query.all()
        print(f"🔍 DEBUG: Found {len(contractor_hours)} contractor hours for work_date {last_working_day} with status 'Logged'")
        
        # Also check what clients are selected
        print(f"🔍 DEBUG: Selected client IDs: {request.clientIds}")
        
        # Check if any of the found contractor hours belong to the selected clients
        for tch in contractor_hours:
            if tch.pcc_id:
                pcc = db.query(models.P_CandidateClient).filter(models.P_CandidateClient.pcc_id == tch.pcc_id).first()
                if pcc:
                    print(f"🔍 DEBUG: TCH {tch.tch_id} belongs to client {pcc.client_id}")
                    if str(pcc.client_id) in request.clientIds:
                        print(f"🔍 DEBUG: ✅ Client {pcc.client_id} is in selected clients")
                    else:
                        print(f"🔍 DEBUG: ❌ Client {pcc.client_id} is NOT in selected clients")
        
        # Check if we have contractor hours for the specific work_date and clients
        if len(contractor_hours) == 0:
            print(f"🔍 DEBUG: No contractor hours found for work_date {last_working_day} with selected clients")
            raise HTTPException(
                status_code=400, 
                detail=f"No contractor hours found for work_date {last_working_day} with the selected clients. Please ensure contractor hours have been logged for the selected week and clients."
            )
        
        # 3. Group contractor hours by client_id to create separate invoices
        client_groups = {}
        for tch in contractor_hours:
            if tch.pcc_id:
                # Get client_id from p_candidate_client
                pcc = db.query(models.P_CandidateClient).filter(models.P_CandidateClient.pcc_id == tch.pcc_id).first()
                if pcc:
                    client_id = pcc.client_id
                    if client_id not in client_groups:
                        client_groups[client_id] = []
                    client_groups[client_id].append(tch)
        
        print(f"🔍 DEBUG: Found {len(client_groups)} clients for work_date {last_working_day}")
        
        # Create separate invoice for each client
        created_invoices = []
        
        for client_id, tch_list in client_groups.items():
            print(f"🔍 DEBUG: Creating invoice for client {client_id} with {len(tch_list)} contractor hours")
            
            # Get next invoice number for this client
            result = db.execute(text("SELECT constant FROM app.m_constant WHERE use_for = 'Sales' LIMIT 1"))
            current_constant = result.fetchone()
            
            if current_constant:
                next_invoice_num = str(int(current_constant[0]) + 1)
                # Update the constant with new value
                db.execute(text("UPDATE app.m_constant SET constant = :new_value WHERE use_for = 'Sales'"), 
                          {"new_value": next_invoice_num})
            else:
                # If no constant exists, start with 1200000
                next_invoice_num = "1200000"
                db.execute(text("INSERT INTO app.m_constant (id, constant, use_for) VALUES (1, '1200001', 'Sales')"))
            
            # Create invoice for this client
            client_invoice_id = str(uuid.uuid4())
            client_invoice = models.Invoice(
                invoice_id=client_invoice_id,
                invoice_num=next_invoice_num,
                invoice_date=invoice_date,
                status="Draft",
                show_invoices=True,
                inv_client_id=client_id
            )
            db.add(client_invoice)
            db.flush()
            
            # Process line items for this client only
            line_items = []
            total_amount = 0.0
            
            for tch in tch_list:
                print(f"🔍 DEBUG: Processing contractor hour {tch.tch_id} for client {client_id}")
                
                # Get rate hours for this contractor hour only
                rate_hours = db.query(models.ContractorRateHours).filter(
                    models.ContractorRateHours.tch_id == tch.tch_id
                ).all()
                
                if not rate_hours:
                    print(f"🔍 DEBUG: No rate hours found for contractor hour {tch.tch_id}")
                    continue  # Skip this contractor hour if no rate hours
                
                for rate_hour in rate_hours:
                    # Calculate total: quantity * bill_rate
                    total = (rate_hour.quantity or 0) * (rate_hour.bill_rate or 0)
                    total_amount += total
                    
                    # Get candidate name, client name for m_rate_name
                    m_rate_name = ""
                    if tch.pcc_id:
                        # Get candidate and client info through pcc_id
                        pcc_info = db.query(models.P_CandidateClient, models.Candidate, models.Client).join(
                            models.Candidate, models.P_CandidateClient.candidate_id == models.Candidate.candidate_id
                        ).join(
                            models.Client, models.P_CandidateClient.client_id == models.Client.client_id
                        ).filter(models.P_CandidateClient.pcc_id == tch.pcc_id).first()
                        
                        if pcc_info:
                            pcc, candidate, client = pcc_info
                            candidate_name = candidate.invoice_contact_name or "Unknown Candidate"
                            client_name = client.client_name or "Unknown Client"
                            m_rate_name = f"{candidate_name} - {client_name} - {week_start.strftime('%Y-%m-%d')} to {week_end.strftime('%Y-%m-%d')}"
                        else:
                            m_rate_name = f"Unknown - Unknown - {week_start.strftime('%Y-%m-%d')} to {week_end.strftime('%Y-%m-%d')}"
                    else:
                        m_rate_name = f"Unknown - Unknown - {week_start.strftime('%Y-%m-%d')} to {week_end.strftime('%Y-%m-%d')}"
                    
                    # Create line item for this client invoice
                    line_item = models.InvoiceLineItem(
                        invoice_id=client_invoice_id,
                        type=rate_hour.rate_type_id,
                        quantity=rate_hour.quantity,
                        rate=rate_hour.bill_rate,
                        total=total,
                        timesheet_id=tch.timesheet_id,
                        m_rate_name=m_rate_name,
                        tcr_id=rate_hour.tcr_id
                    )
                    db.add(line_item)
                    line_items.append(line_item)
            
            # Update client invoice with total amount
            client_invoice.total_amount = total_amount
            
            created_invoices.append({
                'invoice_id': client_invoice_id,
                'invoice_num': next_invoice_num,
                'total_amount': total_amount,
                'line_items_count': len(line_items),
                'client_id': client_id
            })
            
            print(f"🔍 DEBUG: Created invoice {next_invoice_num} for client {client_id} with {len(line_items)} line items and total: {total_amount}")
        
        # Check if any invoices were created
        if len(created_invoices) == 0:
            print("🔍 DEBUG: No invoices created - no contractor hours with rate information found")
            raise HTTPException(
                status_code=400, 
                detail=f"No contractor hours with rate information found for week {week_number} with the selected clients. Please ensure contractor hours have been logged and rates have been set up for the selected week and clients."
            )
        
        # Commit transaction
        db.commit()
        print(f"🔍 DEBUG: Transaction committed successfully")
        print(f"🔍 DEBUG: Created {len(created_invoices)} invoices successfully")
        
        # Return response with first invoice details (for backward compatibility)
        first_invoice = created_invoices[0]
        
        # Get line items for the first invoice to include in response
        first_invoice_line_items = db.query(models.InvoiceLineItem).filter(
            models.InvoiceLineItem.invoice_id == first_invoice['invoice_id']
        ).all()
        
        return schemas.GenerateInvoiceResponse(
            invoice_id=first_invoice['invoice_id'],
            invoice_num=first_invoice['invoice_num'],
            invoice_date=invoice_date,
            line_items=[schemas.InvoiceLineItem.model_validate(item) for item in first_invoice_line_items],
            total_amount=sum(inv['total_amount'] for inv in created_invoices)
        )
        
    except Exception as e:
        db.rollback()
        print(f"Error generating invoice: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating invoice: {str(e)}")
