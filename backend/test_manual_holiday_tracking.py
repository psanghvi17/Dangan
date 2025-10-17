#!/usr/bin/env python3
"""
Manual test script to verify holiday tracking is working
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app import crud, models, schemas
from uuid import uuid4
from datetime import date, datetime

def test_manual_holiday_tracking():
    """Manually test holiday tracking with real data"""
    db = SessionLocal()
    
    try:
        print("🧪 Manual holiday tracking test...")
        
        # First, let's check if there are any existing candidates
        candidates = db.query(models.Candidate).all()
        print(f"🔍 Found {len(candidates)} existing candidates")
        
        if candidates:
            # Use the first candidate for testing
            test_candidate = candidates[0]
            candidate_id = str(test_candidate.candidate_id)
            print(f"🔍 Using candidate: {test_candidate.invoice_contact_name} (ID: {candidate_id})")
            print(f"🔍 Current holiday_count: {test_candidate.holiday_count}")
            
            # Test the holiday tracking functions directly
            print("\n🧪 Test 1: Adding 8% of 10 standard hours")
            result = crud.update_candidate_holiday_count(db, candidate_id, 10.0)
            if result:
                db.refresh(test_candidate)
                print(f"✅ Holiday count after adding 10 standard hours: {test_candidate.holiday_count} (expected: 0.8)")
            
            print("\n🧪 Test 2: Deducting 1 holiday hour")
            result = crud.deduct_candidate_holiday_count(db, candidate_id, 1.0)
            if result:
                db.refresh(test_candidate)
                print(f"✅ Holiday count after deducting 1 holiday hour: {test_candidate.holiday_count} (expected: 0.0)")
            
            # Test backfill function
            print("\n🧪 Test 3: Testing backfill function")
            result = crud.backfill_holiday_tracking_for_timesheet_entries(db)
            if result:
                print("✅ Backfill function completed successfully")
            
            return True
        else:
            print("❌ No candidates found in database")
            return False
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        db.close()

if __name__ == "__main__":
    success = test_manual_holiday_tracking()
    if success:
        print("\n🎉 Manual holiday tracking test completed!")
        sys.exit(0)
    else:
        print("\n💥 Manual holiday tracking test failed!")
        sys.exit(1)
