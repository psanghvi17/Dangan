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
        print(f"🔍 DEBUG: Candidate ID: {request.candidateId}")
        print(f"🔍 DEBUG: Client ID: {request.clientId}")
        print(f"🔍 DEBUG: Week: {request.week}")
        print(f"🔍 DEBUG: Invoice Date: {request.invoiceDate}")
        print(f"🔍 DEBUG: Week format check - contains 'W': {'W' in request.week}")
        
        # Start transaction
        db.begin()
        
        # 1. Create invoice with auto-generated invoice number
        invoice_id = str(uuid.uuid4())
        invoice_date = datetime.strptime(request.invoiceDate, "%Y-%m-%d").date()
        
        # Get next invoice number from m_constant table
        # First get current value
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
        
        new_invoice = models.Invoice(
            invoice_id=invoice_id,
            invoice_num=next_invoice_num,  # Use auto-generated invoice number
            invoice_date=invoice_date,
            status="Draft",
            show_invoices=True
        )
        db.add(new_invoice)
        db.flush()  # Get the invoice ID
        
        # 2. Get contractor hours for the specified week using week column
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
        
        week_end = week_start + timedelta(days=6)
        
        print(f"🔍 DEBUG: Calculated week_start: {week_start}")
        print(f"🔍 DEBUG: Calculated week_end: {week_end}")
        
        # Calculate the week number of the year (ISO week)
        week_number = week_start.isocalendar()[1]  # Get ISO week number
        year = week_start.year
        
        print(f"🔍 DEBUG: Calculated week_number: {week_number}")
        print(f"🔍 DEBUG: Calculated year: {year}")
        
        print(f"🔍 DEBUG: Week start: {week_start}, Week end: {week_end}")
        print(f"🔍 DEBUG: Calculated week number: {week_number}, Year: {year}")
        print(f"🔍 DEBUG: ISO calendar info: {week_start.isocalendar()}")
        
        # Also try alternative week calculation methods
        week_number_alt = week_start.isocalendar()[1]
        print(f"🔍 DEBUG: Alternative week calculation: {week_number_alt}")
        
        # Query contractor hours by week number (remove status filter for now to see what we have)
        tch_query = db.query(models.ContractorHours).filter(
            models.ContractorHours.week == week_number
        )
        
        # If no results with week number, try without week filter to see what we have
        if tch_query.count() == 0:
            print(f"🔍 DEBUG: No contractor hours found for week {week_number}, trying without week filter")
            tch_query = db.query(models.ContractorHours)
        
        # Filter by candidate if not 'all'
        if request.candidateId != 'all':
            tch_query = tch_query.filter(models.ContractorHours.contractor_id == request.candidateId)
        
        # Filter by client if not 'all' (this would need a join with p_candidate_client)
        if request.clientId != 'all':
            # Join with p_candidate_client to filter by client
            tch_query = tch_query.join(
                models.P_CandidateClient,
                models.ContractorHours.contractor_id == models.P_CandidateClient.candidate_id
            ).filter(models.P_CandidateClient.client_id == request.clientId)
        
        contractor_hours = tch_query.all()
        print(f"🔍 DEBUG: Found {len(contractor_hours)} contractor hours for week number {week_number} with status 'Logged'")
        
        # Debug: Check if there are any contractor hours in the database at all
        total_tch_count = db.query(models.ContractorHours).count()
        print(f"🔍 DEBUG: Total contractor hours in database: {total_tch_count}")
        
        # Debug: Check contractor hours with 'Logged' status
        logged_tch_count = db.query(models.ContractorHours).filter(models.ContractorHours.status == 'Logged').count()
        print(f"🔍 DEBUG: Total contractor hours with 'Logged' status: {logged_tch_count}")
        
        # Debug: Check contractor hours for this specific week number
        week_tch_count = db.query(models.ContractorHours).filter(models.ContractorHours.week == week_number).count()
        print(f"🔍 DEBUG: Total contractor hours for week {week_number}: {week_tch_count}")
        
        # Debug: Check contractor hours with both week number and 'Logged' status
        week_logged_tch_count = db.query(models.ContractorHours).filter(
            and_(
                models.ContractorHours.week == week_number,
                models.ContractorHours.status == 'Logged'
            )
        ).count()
        print(f"🔍 DEBUG: Total contractor hours for week {week_number} with 'Logged' status: {week_logged_tch_count}")
        
        # Debug: Check if there are any contractor rate hours in the database
        total_tcrh_count = db.query(models.ContractorRateHours).count()
        print(f"🔍 DEBUG: Total contractor rate hours in database: {total_tcrh_count}")
        
        # Debug: Show some sample contractor hours with 'Logged' status and week number
        sample_tch = db.query(models.ContractorHours).filter(
            and_(
                models.ContractorHours.status == 'Logged',
                models.ContractorHours.week == week_number
            )
        ).limit(3).all()
        for tch in sample_tch:
            print(f"🔍 DEBUG: Sample TCH: {tch.tch_id}, contractor: {tch.contractor_id}, work_date: {tch.work_date}, status: {tch.status}, week: {tch.week}, timesheet_id: {tch.timesheet_id}")
        
        # Debug: Show all week numbers in the database
        all_weeks = db.query(models.ContractorHours.week).distinct().all()
        week_numbers = [w[0] for w in all_weeks if w[0] is not None]
        print(f"🔍 DEBUG: All week numbers in database: {sorted(week_numbers)}")
        
        # Debug: Show all contractor hours with their details
        all_tch = db.query(models.ContractorHours).all()
        print(f"🔍 DEBUG: All contractor hours in database:")
        for tch in all_tch:
            print(f"🔍 DEBUG: TCH: {tch.tch_id}, contractor: {tch.contractor_id}, work_date: {tch.work_date}, status: {tch.status}, week: {tch.week}, timesheet_id: {tch.timesheet_id}")
        
        # Debug: Show contractor hours for different week numbers
        for week_num in week_numbers[:5]:  # Show first 5 weeks
            week_count = db.query(models.ContractorHours).filter(
                and_(
                    models.ContractorHours.week == week_num,
                    models.ContractorHours.status == 'Logged'
                )
            ).count()
            print(f"🔍 DEBUG: Week {week_num}: {week_count} contractor hours with 'Logged' status")
        
        # 3. Get contractor rate hours for each contractor hour
        line_items = []
        total_amount = 0.0
        
        for tch in contractor_hours:
            print(f"🔍 DEBUG: Processing contractor hour {tch.tch_id} for contractor {tch.contractor_id}")
            
            # Get rate hours for this contractor hour
            rate_hours = db.query(models.ContractorRateHours).filter(
                models.ContractorRateHours.tch_id == tch.tch_id
            ).all()
            
            print(f"🔍 DEBUG: Found {len(rate_hours)} rate hours for contractor hour {tch.tch_id}")
            
            # Debug: Show all rate hours in database
            all_rate_hours = db.query(models.ContractorRateHours).all()
            print(f"🔍 DEBUG: All rate hours in database:")
            for tcrh in all_rate_hours:
                print(f"🔍 DEBUG: TCRH: tch_id={tcrh.tch_id}, rate_type_id={tcrh.rate_type_id}, quantity={tcrh.quantity}, bill_rate={tcrh.bill_rate}, tcr_id={tcrh.tcr_id}")
            
            for rate_hour in rate_hours:
                print(f"🔍 DEBUG: Processing rate hour: type={rate_hour.rate_type_id}, quantity={rate_hour.quantity}, bill_rate={rate_hour.bill_rate}")
                print(f"🔍 DEBUG: Rate hour details - tcr_id: {rate_hour.tcr_id}, pay_rate: {rate_hour.pay_rate}")
                
                # Calculate total: quantity * bill_rate
                total = (rate_hour.quantity or 0) * (rate_hour.bill_rate or 0)
                total_amount += total
                
                print(f"🔍 DEBUG: Calculated total: {total}")
                
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
                        print(f"🔍 DEBUG: Generated m_rate_name: {m_rate_name}")
                    else:
                        m_rate_name = f"Unknown - Unknown - {week_start.strftime('%Y-%m-%d')} to {week_end.strftime('%Y-%m-%d')}"
                        print(f"🔍 DEBUG: Could not find candidate/client info, using default m_rate_name: {m_rate_name}")
                else:
                    m_rate_name = f"Unknown - Unknown - {week_start.strftime('%Y-%m-%d')} to {week_end.strftime('%Y-%m-%d')}"
                    print(f"🔍 DEBUG: No pcc_id found, using default m_rate_name: {m_rate_name}")
                
                # Create line item with dynamic values from tcrh
                line_item = models.InvoiceLineItem(
                    invoice_id=invoice_id,
                    type=rate_hour.rate_type_id,  # Dynamic type from tcrh
                    quantity=rate_hour.quantity,   # Dynamic quantity from tcrh
                    rate=rate_hour.bill_rate,      # Dynamic rate from tcrh
                    timesheet_id=tch.timesheet_id,  # Store the timesheet_id from contractor hours
                    total=total,
                    tcr_id=rate_hour.tcr_id,
                    m_rate_name=m_rate_name  # Add the formatted rate name
                )
                db.add(line_item)
                line_items.append(line_item)
                print(f"🔍 DEBUG: Created line item - type: {rate_hour.rate_type_id}, quantity: {rate_hour.quantity}, rate: {rate_hour.bill_rate}, timesheet_id: {tch.timesheet_id}, total: {total}, m_rate_name: {m_rate_name}")
        
        print(f"🔍 DEBUG: Total line items created: {len(line_items)}")
        print(f"🔍 DEBUG: Total amount: {total_amount}")
        
        # If no line items found, check if we have any contractor hours data at all
        if len(line_items) == 0:
            print("🔍 DEBUG: No line items found")
            
            # Check if we have any contractor hours in the database
            total_contractor_hours = db.query(models.ContractorHours).count()
            if total_contractor_hours == 0:
                print("🔍 DEBUG: No contractor hours found in database")
                raise HTTPException(
                    status_code=400, 
                    detail="No contractor hours data found. Please ensure timesheets have been created and contractor hours have been logged for the selected week."
                )
            
            # Check if we have contractor hours for this specific week
            week_contractor_hours = db.query(models.ContractorHours).filter(
                models.ContractorHours.week == week_number
            ).count()
            
            if week_contractor_hours == 0:
                print(f"🔍 DEBUG: No contractor hours found for week {week_number}")
                raise HTTPException(
                    status_code=400, 
                    detail=f"No contractor hours found for week {week_number}. Please ensure contractor hours have been logged for the selected week."
                )
            
            # If we have contractor hours but no rate hours, that's a different issue
            print("🔍 DEBUG: Contractor hours exist but no rate hours found")
            raise HTTPException(
                status_code=400, 
                detail="Contractor hours found but no rate information available. Please ensure contractor rates have been set up."
            )
        
        # 4. Update invoice with total amount
        new_invoice.total_amount = total_amount
        
        # 5. Commit transaction
        db.commit()
        print(f"🔍 DEBUG: Transaction committed successfully")
        
        # 6. Return response
        return schemas.GenerateInvoiceResponse(
            invoice_id=invoice_id,
            invoice_num="100",
            invoice_date=invoice_date,
            line_items=[schemas.InvoiceLineItem.model_validate(item) for item in line_items],
            total_amount=total_amount
        )
        
    except Exception as e:
        db.rollback()
        print(f"Error generating invoice: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating invoice: {str(e)}")
