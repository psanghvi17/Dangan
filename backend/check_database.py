#!/usr/bin/env python3
"""
Simple script to check database contents and test holiday tracking
"""

import requests
import json

# Replace with your actual API URL
API_BASE_URL = "http://localhost:8000"  # Adjust this to your actual API URL

def check_candidates():
    """Check what candidates exist in the database"""
    try:
        response = requests.get(f"{API_BASE_URL}/api/candidates/")
        if response.status_code == 200:
            candidates = response.json()
            print(f"🔍 Found {len(candidates)} candidates:")
            for candidate in candidates:
                print(f"  - {candidate.get('first_name', 'Unknown')} {candidate.get('last_name', 'Unknown')} (ID: {candidate.get('candidate_id', 'Unknown')})")
            return candidates
        else:
            print(f"❌ Error getting candidates: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def test_holiday_tracking(candidate_id, standard_hours=10.0, holiday_hours=1.0):
    """Test holiday tracking for a specific candidate"""
    try:
        data = {
            "candidate_id": candidate_id,
            "standard_hours": standard_hours,
            "holiday_hours": holiday_hours
        }
        
        response = requests.post(f"{API_BASE_URL}/api/timesheets/test-holiday-tracking", json=data)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Holiday tracking test successful:")
            print(f"  - Candidate ID: {result['candidate_id']}")
            print(f"  - Old holiday count: {result['old_holiday_count']}")
            print(f"  - New holiday count: {result['new_holiday_count']}")
            print(f"  - Standard hours processed: {result['standard_hours_processed']}")
            print(f"  - Holiday hours processed: {result['holiday_hours_processed']}")
            return result
        else:
            print(f"❌ Error testing holiday tracking: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def backfill_holiday_tracking():
    """Run the backfill function"""
    try:
        response = requests.post(f"{API_BASE_URL}/api/timesheets/backfill-holiday-tracking")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Backfill successful: {result['message']}")
            return True
        else:
            print(f"❌ Error running backfill: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Checking database contents...")
    
    # Check candidates
    candidates = check_candidates()
    
    if candidates:
        # Use the first candidate for testing
        first_candidate = candidates[0]
        candidate_id = first_candidate.get('candidate_id')
        
        if candidate_id:
            print(f"\n🧪 Testing holiday tracking with candidate: {candidate_id}")
            test_holiday_tracking(candidate_id, 10.0, 1.0)
            
            print(f"\n🔄 Running backfill...")
            backfill_holiday_tracking()
        else:
            print("❌ No candidate ID found")
    else:
        print("❌ No candidates found")
