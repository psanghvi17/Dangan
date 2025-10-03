from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict
import math
import uuid
from ..database import get_db
from .. import crud, schemas, models

router = APIRouter()


@router.get("/", response_model=List[schemas.CandidateWithClient])
def list_candidates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    try:
        print(f"🔍 DEBUG: Fetching candidates with client info, skip={skip}, limit={limit}")
        candidates = crud.get_candidates_with_client_info(db, skip=skip, limit=limit)
        print(f"🔍 DEBUG: Found {len(candidates)} candidates with client info")
        for candidate in candidates:
            print(f"🔍 DEBUG: Candidate: {candidate.invoice_contact_name} (ID: {candidate.candidate_id}) - Client: {candidate.client_name}")
        return candidates
    except Exception as e:
        print(f"🔍 DEBUG: Error fetching candidates: {str(e)}")
        print(f"🔍 DEBUG: Error type: {type(e)}")
        import traceback
        print(f"🔍 DEBUG: Traceback: {traceback.format_exc()}")
        raise


@router.get("/active", response_model=List[schemas.CandidateWithClient])
def list_active_candidates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    try:
        print(f"🔍 DEBUG: Fetching active candidates, skip={skip}, limit={limit}")
        candidates = crud.get_active_candidates(db, skip=skip, limit=limit)
        print(f"🔍 DEBUG: Found {len(candidates)} active candidates")
        for candidate in candidates:
            print(f"🔍 DEBUG: Active Candidate: {candidate.invoice_contact_name} (ID: {candidate.candidate_id}) - Client: {candidate.client_name}")
        return candidates
    except Exception as e:
        print(f"🔍 DEBUG: Error fetching active candidates: {str(e)}")
        print(f"🔍 DEBUG: Error type: {type(e)}")
        import traceback
        print(f"🔍 DEBUG: Traceback: {traceback.format_exc()}")
        raise


@router.get("/pending", response_model=List[schemas.CandidateWithClient])
def list_pending_candidates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    try:
        print(f"🔍 DEBUG: Fetching pending candidates, skip={skip}, limit={limit}")
        candidates = crud.get_pending_candidates(db, skip=skip, limit=limit)
        print(f"🔍 DEBUG: Found {len(candidates)} pending candidates")
        for candidate in candidates:
            print(f"🔍 DEBUG: Pending Candidate: {candidate.invoice_contact_name} (ID: {candidate.candidate_id})")
        return candidates
    except Exception as e:
        print(f"🔍 DEBUG: Error fetching pending candidates: {str(e)}")
        print(f"🔍 DEBUG: Error type: {type(e)}")
        import traceback
        print(f"🔍 DEBUG: Traceback: {traceback.format_exc()}")
        raise


@router.get("/rate-types", response_model=List[schemas.RateTypeOut])
def get_rate_types(db: Session = Depends(get_db)):
    try:
        print("🚀 Getting rate types...")
        rows = crud.list_rate_types(db)
        print(f"🔍 Raw rate types from database: {rows}")
        result = [schemas.RateTypeOut.model_validate(r) for r in rows]
        print(f"✅ Returning {len(result)} rate types")
        return result
    except Exception as e:
        print(f"❌ Error getting rate types: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/rate-frequencies", response_model=List[schemas.RateFrequencyOut])
def get_rate_frequencies(db: Session = Depends(get_db)):
    try:
        print("🚀 Getting rate frequencies...")
        rows = crud.list_rate_frequencies(db)
        print(f"🔍 Raw rate frequencies from database: {rows}")
        result = [schemas.RateFrequencyOut.model_validate(r) for r in rows]
        print(f"✅ Returning {len(result)} rate frequencies")
        return result
    except Exception as e:
        print(f"❌ Error getting rate frequencies: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


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


@router.get("/{user_id}", response_model=schemas.CandidateListItem)
def get_candidate_by_id(user_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get a specific candidate by user_id"""
    try:
        print(f"🚀 Getting candidate with user_id: {user_id}")
        m_user, candidate = crud.get_candidate_by_user_id(db, str(user_id))
        
        if not m_user:
            print(f"❌ No candidate found with user_id: {user_id}")
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        print(f"✅ Found candidate: {m_user.first_name} {m_user.last_name}")
        
        return schemas.CandidateListItem(
            user_id=m_user.user_id,
            first_name=m_user.first_name,
            last_name=m_user.last_name,
            email_id=m_user.email_id,
            created_on=m_user.created_on
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting candidate: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/{user_id}", response_model=schemas.CandidateListItem)
def update_candidate_by_id(user_id: uuid.UUID, candidate_update: schemas.CandidateUpdate, db: Session = Depends(get_db)):
    """Update a specific candidate by user_id"""
    try:
        print(f"🚀 Updating candidate with user_id: {user_id}")
        print(f"🚀 Update data: {candidate_update.dict()}")
        
        # Convert Pydantic model to dict, excluding None values
        update_data = {k: v for k, v in candidate_update.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No data provided for update")
        
        # Add invoice_contact_name if first_name and last_name are provided
        if 'first_name' in update_data and 'last_name' in update_data:
            update_data['invoice_contact_name'] = f"{update_data['first_name']} {update_data['last_name']}"
        
        # Add invoice_email if email_id is provided
        if 'email_id' in update_data:
            update_data['invoice_email'] = [update_data['email_id']]
        
        updated_user = crud.update_candidate(db, str(user_id), update_data)
        
        if not updated_user:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        print(f"✅ Successfully updated candidate: {updated_user.first_name} {updated_user.last_name}")
        
        return schemas.CandidateListItem(
            user_id=updated_user.user_id,
            first_name=updated_user.first_name,
            last_name=updated_user.last_name,
            email_id=updated_user.email_id,
            created_on=updated_user.created_on
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating candidate: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/clients/options", response_model=List[schemas.ClientOption])
def get_client_options(db: Session = Depends(get_db)):
    """Get all clients for dropdown"""
    try:
        print("🚀 Getting client options for dropdown")
        clients = crud.get_all_clients(db)
        print(f"🔍 Raw clients from database: {clients}")
        
        client_options = []
        for client in clients:
            print(f"🔍 Processing client: {client.client_id} - {client.client_name}")
            client_options.append(schemas.ClientOption(
                client_id=client.client_id,
                client_name=client.client_name
            ))
        
        print(f"✅ Returning {len(client_options)} client options")
        print(f"🔍 Client options: {client_options}")
        return client_options
        
    except Exception as e:
        print(f"❌ Error getting client options: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/client-relationship", response_model=schemas.CandidateClientOut)
def create_candidate_client_relationship(
    candidate_client_data: schemas.CandidateClientCreate,
    db: Session = Depends(get_db)
):
    """Create a candidate-client relationship"""
    try:
        print(f"🚀 Creating candidate-client relationship: {candidate_client_data}")
        
        candidate_client = crud.create_candidate_client(db, candidate_client_data)
        
        if not candidate_client:
            raise HTTPException(status_code=400, detail="Failed to create candidate-client relationship")
        
        print(f"✅ Successfully created candidate-client relationship: {candidate_client.pcc_id}")
        
        return schemas.CandidateClientOut(
            pcc_id=candidate_client.pcc_id,
            candidate_id=candidate_client.candidate_id,
            client_id=candidate_client.client_id,
            placement_date=candidate_client.placement_date,
            contract_start_date=candidate_client.contract_start_date,
            contract_end_date=candidate_client.contract_end_date,
            status=candidate_client.status,
            created_on=candidate_client.created_on
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating candidate-client relationship: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{user_id}/client-relationships", response_model=List[schemas.CandidateClientOut])
def get_candidate_client_relationships(user_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get all client relationships for a candidate"""
    try:
        print(f"🚀 Getting client relationships for candidate: {user_id}")
        
        relationships = crud.get_candidate_client_relationships(db, str(user_id))
        
        client_relationships = []
        for relationship in relationships:
            client_relationships.append(schemas.CandidateClientOut(
                pcc_id=relationship.pcc_id,
                candidate_id=relationship.candidate_id,
                client_id=relationship.client_id,
                placement_date=relationship.placement_date,
                contract_start_date=relationship.contract_start_date,
                contract_end_date=relationship.contract_end_date,
                status=relationship.status,
                created_on=relationship.created_on
            ))
        
        print(f"✅ Returning {len(client_relationships)} client relationships")
        return client_relationships
        
    except Exception as e:
        print(f"❌ Error getting candidate-client relationships: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/client-relationship/{pcc_id}/rates", response_model=List[schemas.ContractRateOut])
def create_rates_for_pcc(pcc_id: str, rates: List[schemas.ContractRateCreate], db: Session = Depends(get_db)):
    try:
        created = crud.create_contract_rates(db, pcc_id, rates)
        return [schemas.ContractRateOut.model_validate(r) for r in created]
    except Exception as e:
        print(f"❌ Error creating rates: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/client-relationship/rates", response_model=List[schemas.ContractRateOut])
def create_rates_for_candidate_client(payload: schemas.RatesForCandidateClientCreate, db: Session = Depends(get_db)):
    try:
        created = crud.create_rates_for_candidate_client(
            db,
            str(payload.candidate_id),
            str(payload.client_id),
            payload.rates,
        )
        return [schemas.ContractRateOut.model_validate(r) for r in created]
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        print(f"❌ Error creating rates for candidate-client: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/client-relationship/{pcc_id}/rates", response_model=List[schemas.ContractRateOut])
def list_rates_by_pcc(pcc_id: str, db: Session = Depends(get_db)):
    try:
        rows = crud.list_contract_rates_by_pcc(db, pcc_id)
        return [schemas.ContractRateOut.model_validate(r) for r in rows]
    except Exception as e:
        print(f"❌ Error listing rates by pcc: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/client-relationship/rates", response_model=List[schemas.ContractRateOut])
def list_rates_for_candidate_client(candidate_id: uuid.UUID, client_id: uuid.UUID, db: Session = Depends(get_db)):
    try:
        rows = crud.list_contract_rates_for_candidate_client(db, str(candidate_id), str(client_id))
        return [schemas.ContractRateOut.model_validate(r) for r in rows]
    except Exception as e:
        print(f"❌ Error listing rates for candidate-client: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/rates/{tcr_id}", response_model=schemas.ContractRateOut)
def update_rate(tcr_id: int, payload: schemas.ContractRateUpdate, db: Session = Depends(get_db)):
    try:
        row = crud.update_contract_rate(db, tcr_id, payload)
        if not row:
            raise HTTPException(status_code=404, detail="Rate not found")
        return schemas.ContractRateOut.model_validate(row)
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating rate: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/rates/{tcr_id}")
def delete_rate(tcr_id: int, db: Session = Depends(get_db)):
    try:
        ok = crud.soft_delete_contract_rate(db, tcr_id)
        if not ok:
            raise HTTPException(status_code=404, detail="Rate not found")
        return {"deleted": True}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting rate: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{candidate_id}/rates", response_model=List[schemas.ContractRateOut])
def get_rates_for_candidate(candidate_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get all contract rates for a candidate"""
    try:
        print(f"🚀 Getting contract rates for candidate: {candidate_id}")
        
        rates = crud.get_contract_rates_for_candidate(db, str(candidate_id))
        
        result = [schemas.ContractRateOut.model_validate(rate) for rate in rates]
        print(f"✅ Returning {len(result)} contract rates for candidate: {candidate_id}")
        for rate in result:
            print(f"  - Rate: {rate}")
        return result
        
    except Exception as e:
        print(f"❌ Error getting rates for candidate: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/rate-types", response_model=List[schemas.RateTypeOut])
def get_all_rate_types(db: Session = Depends(get_db)):
    """Get all active rate types"""
    try:
        print(f"🚀 Getting all rate types")
        
        rate_types = crud.get_all_rate_types(db)
        result = [schemas.RateTypeOut.model_validate(rt) for rt in rate_types]
        
        print(f"✅ Returning {len(result)} rate types")
        return result
        
    except Exception as e:
        print(f"❌ Error getting rate types: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/rate-frequencies", response_model=List[schemas.RateFrequencyOut])
def get_all_rate_frequencies(db: Session = Depends(get_db)):
    """Get all active rate frequencies"""
    try:
        print(f"🚀 Getting all rate frequencies")
        
        rate_frequencies = crud.get_all_rate_frequencies(db)
        result = [schemas.RateFrequencyOut.model_validate(rf) for rf in rate_frequencies]
        
        print(f"✅ Returning {len(result)} rate frequencies")
        return result
        
    except Exception as e:
        print(f"❌ Error getting rate frequencies: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/rates-matrix", response_model=Dict[str, List[Dict]])
def get_candidate_rates_matrix(candidate_ids: List[str], db: Session = Depends(get_db)):
    """Get rates matrix for multiple candidates"""
    try:
        print(f"🚀 Getting rates matrix for candidates: {candidate_ids}")
        
        rates_matrix = crud.get_candidate_rates_matrix(db, candidate_ids)
        
        print(f"✅ Returning rates matrix for {len(rates_matrix)} candidates")
        return rates_matrix
        
    except Exception as e:
        print(f"❌ Error getting rates matrix: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/client-info", response_model=Dict[str, str])
def get_candidate_client_info(candidate_ids: List[str], db: Session = Depends(get_db)):
    """Get client information for multiple candidates"""
    try:
        print(f"🔍 Getting client info for candidates: {candidate_ids}")
        client_info = crud.get_candidate_client_info(db, candidate_ids)
        print(f"✅ Client info result: {client_info}")
        return client_info
    except Exception as e:
        print(f"❌ Error getting client info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/contract-with-rates", response_model=schemas.ContractWithRatesOut)
def create_contract_with_rates(
    contract_data: schemas.ContractWithRatesCreate,
    db: Session = Depends(get_db)
):
    """Create or update contract with rates in a single API call"""
    try:
        print(f"🚀 Creating/updating contract with rates: {contract_data}")
        
        result = crud.create_contract_with_rates(db, contract_data)
        
        print(f"✅ Successfully created/updated contract: {result.pcc_id}")
        return result
        
    except ValueError as ve:
        print(f"❌ Validation error: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"❌ Error creating contract with rates: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")

