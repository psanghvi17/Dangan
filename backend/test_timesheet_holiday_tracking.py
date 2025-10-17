#!/usr/bin/env python3
"""
Test script for timesheet entry holiday tracking functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app import crud, models, schemas
from uuid import uuid4
from datetime import date, datetime

def test_timesheet_holiday_tracking():
    """Test the holiday tracking functionality with timesheet entries"""
    db = SessionLocal()
    
    try:
        print("🧪 Testing timesheet entry holiday tracking functionality...")
        
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
        
        # Create a test timesheet
        timesheet_id = str(uuid4())
        test_timesheet = models.Timesheet(
            timesheet_id=timesheet_id,
            month="January 2024",
            week="Week 1",
            status="Open"
        )
        db.add(test_timesheet)
        db.commit()
        db.refresh(test_timesheet)
        
        print(f"✅ Created test timesheet: {timesheet_id}")
        
        # Test 1: Create timesheet entry with standard hours (should add 8% to holiday count)
        print("\n🧪 Test 1: Creating timesheet entry with 10 standard hours")
        entry_create = schemas.TimesheetEntryCreate(
            timesheet_id=timesheet_id,
            employee_name="Test Candidate",
            employee_code=test_candidate_id,
            client_name="Test Client",
            filled=True,
            standard_hours=10.0,
            holiday_hours=0.0
        )
        
        created_entry = crud.create_timesheet_entry(db, entry_create)
        print(f"✅ Created timesheet entry: {created_entry.entry_id}")
        
        # Check holiday count
        db.refresh(test_candidate)
        print(f"✅ Holiday count after 10 standard hours: {test_candidate.holiday_count} (expected: 0.8)")
        assert test_candidate.holiday_count == 0.8, f"Expected 0.8, got {test_candidate.holiday_count}"
        
        # Test 2: Update timesheet entry to add holiday hours (should deduct from holiday count)
        print("\n🧪 Test 2: Updating timesheet entry to add 1 holiday hour")
        entry_update = schemas.TimesheetEntryUpdate(
            holiday_hours=1.0
        )
        
        updated_entry = crud.update_timesheet_entry(db, str(created_entry.entry_id), entry_update)
        print(f"✅ Updated timesheet entry")
        
        # Check holiday count
        db.refresh(test_candidate)
        print(f"✅ Holiday count after 1 holiday hour: {test_candidate.holiday_count} (expected: -0.2, but should be 0)")
        # The result should be 0 because we don't allow negative holiday counts
        assert test_candidate.holiday_count == 0.0, f"Expected 0.0, got {test_candidate.holiday_count}"
        
        # Test 3: Add more standard hours (should accumulate)
        print("\n🧪 Test 3: Adding more standard hours")
        entry_update2 = schemas.TimesheetEntryUpdate(
            standard_hours=20.0  # Change from 10 to 20 (increase of 10)
        )
        
        updated_entry2 = crud.update_timesheet_entry(db, str(created_entry.entry_id), entry_update2)
        print(f"✅ Updated timesheet entry with more standard hours")
        
        # Check holiday count
        db.refresh(test_candidate)
        print(f"✅ Holiday count after 20 standard hours: {test_candidate.holiday_count} (expected: 0.8)")
        assert test_candidate.holiday_count == 0.8, f"Expected 0.8, got {test_candidate.holiday_count}"
        
        print("\n✅ All timesheet holiday tracking tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        # Clean up test data
        try:
            db.query(models.TimesheetEntry).filter(models.TimesheetEntry.timesheet_id == timesheet_id).delete()
            db.query(models.Timesheet).filter(models.Timesheet.timesheet_id == timesheet_id).delete()
            db.query(models.Candidate).filter(models.Candidate.candidate_id == test_candidate_id).delete()
            db.query(models.MUser).filter(models.MUser.user_id == test_candidate_id).delete()
            db.commit()
            print("🧹 Cleaned up test data")
        except Exception as e:
            print(f"⚠️ Warning: Failed to clean up test data: {e}")
        finally:
            db.close()

if __name__ == "__main__":
    success = test_timesheet_holiday_tracking()
    if success:
        print("\n🎉 Timesheet holiday tracking implementation is working correctly!")
        sys.exit(0)
    else:
        print("\n💥 Timesheet holiday tracking implementation has issues!")
        sys.exit(1)
