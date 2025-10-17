#!/usr/bin/env python3
"""
Test script for holiday tracking functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app import crud, models, schemas
from uuid import uuid4
from datetime import date, datetime

def test_holiday_tracking():
    """Test the holiday tracking functionality"""
    db = SessionLocal()
    
    try:
        print("🧪 Testing holiday tracking functionality...")
        
        # Create a test candidate
        test_candidate_id = str(uuid4())
        print(f"📝 Creating test candidate: {test_candidate_id}")
        
        # Create user first
        test_user = models.MUser(
            user_id=test_candidate_id,
            first_name="Test",
            last_name="Candidate",
            email_id="test@example.com"
        )
        db.add(test_user)
        db.flush()
        
        # Create candidate
        test_candidate = models.Candidate(
            candidate_id=test_candidate_id,
            invoice_contact_name="Test Candidate",
            holiday_count=0.0
        )
        db.add(test_candidate)
        db.commit()
        db.refresh(test_candidate)
        
        print(f"✅ Created test candidate with initial holiday_count: {test_candidate.holiday_count}")
        
        # Test 1: Add 8% of standard hours (100 hours should give 8 hours holiday)
        print("\n🧪 Test 1: Adding 8% of standard hours")
        result = crud.update_candidate_holiday_count(db, test_candidate_id, 100.0)
        if result:
            db.refresh(test_candidate)
            print(f"✅ Holiday count updated: {test_candidate.holiday_count} (expected: 8.0)")
            assert test_candidate.holiday_count == 8.0, f"Expected 8.0, got {test_candidate.holiday_count}"
        else:
            print("❌ Failed to update holiday count")
            return False
        
        # Test 2: Add more hours (50 hours should give 4 more hours holiday, total 12)
        print("\n🧪 Test 2: Adding more standard hours")
        result = crud.update_candidate_holiday_count(db, test_candidate_id, 50.0)
        if result:
            db.refresh(test_candidate)
            print(f"✅ Holiday count updated: {test_candidate.holiday_count} (expected: 12.0)")
            assert test_candidate.holiday_count == 12.0, f"Expected 12.0, got {test_candidate.holiday_count}"
        else:
            print("❌ Failed to update holiday count")
            return False
        
        # Test 3: Deduct holiday hours (use 5 hours holiday)
        print("\n🧪 Test 3: Deducting holiday hours")
        result = crud.deduct_candidate_holiday_count(db, test_candidate_id, 5.0)
        if result:
            db.refresh(test_candidate)
            print(f"✅ Holiday count after deduction: {test_candidate.holiday_count} (expected: 7.0)")
            assert test_candidate.holiday_count == 7.0, f"Expected 7.0, got {test_candidate.holiday_count}"
        else:
            print("❌ Failed to deduct holiday count")
            return False
        
        # Test 4: Try to deduct more than available (should not go below 0)
        print("\n🧪 Test 4: Deducting more than available")
        result = crud.deduct_candidate_holiday_count(db, test_candidate_id, 10.0)
        if result:
            db.refresh(test_candidate)
            print(f"✅ Holiday count after over-deduction: {test_candidate.holiday_count} (expected: 0.0)")
            assert test_candidate.holiday_count == 0.0, f"Expected 0.0, got {test_candidate.holiday_count}"
        else:
            print("❌ Failed to deduct holiday count")
            return False
        
        print("\n✅ All tests passed! Holiday tracking is working correctly.")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        # Clean up test data
        try:
            db.query(models.Candidate).filter(models.Candidate.candidate_id == test_candidate_id).delete()
            db.query(models.MUser).filter(models.MUser.user_id == test_candidate_id).delete()
            db.commit()
            print("🧹 Cleaned up test data")
        except Exception as e:
            print(f"⚠️ Warning: Failed to clean up test data: {e}")
        finally:
            db.close()

if __name__ == "__main__":
    success = test_holiday_tracking()
    if success:
        print("\n🎉 Holiday tracking implementation is working correctly!")
        sys.exit(0)
    else:
        print("\n💥 Holiday tracking implementation has issues!")
        sys.exit(1)
