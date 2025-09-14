#!/usr/bin/env python3
"""
Create Clumio snapshot - Simple version
Just create the snapshot and save the ID for later analysis
"""

import requests
import json
import time

def create_clumio_snapshot():
    """Create a snapshot for Clumio employees"""
    
    api_key = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e"
    dataset_id = "gd_l1viktl72bvl7bjuj0"
    filter_endpoint = "https://api.brightdata.com/datasets/filter"
    
    print("🎯 Creating Clumio Snapshot")
    print("=" * 40)
    
    # Create filter for Clumio employees
    filter_data = {
        "name": "current_company_company_id",
        "operator": "=",
        "value": "clumio"
    }
    
    print(f"🔍 Using filter: {json.dumps(filter_data, indent=2)}")
    
    # Create snapshot
    payload = {
        'dataset_id': dataset_id,
        'filter': json.dumps(filter_data),
        'records_limit': 1000
    }
    
    print(f"\n📤 Creating snapshot...")
    print(f"⏳ This may take a few minutes...")
    
    try:
        response = requests.post(
            filter_endpoint,
            headers={'Authorization': f'Bearer {api_key}'},
            data=payload,
            timeout=120
        )
        
        if response.status_code == 200:
            result = response.json()
            snapshot_id = result.get('snapshot_id')
            print(f"✅ Snapshot created: {snapshot_id}")
            
            # Save snapshot ID to file
            with open('clumio_snapshot_id.txt', 'w') as f:
                f.write(snapshot_id)
            
            print(f"📁 Snapshot ID saved to: clumio_snapshot_id.txt")
            print(f"\n💡 To check status later, run:")
            print(f"   curl -H 'Authorization: Bearer {api_key}' https://api.brightdata.com/datasets/snapshots/{snapshot_id}")
            print(f"\n💡 To download when ready, run:")
            print(f"   curl -H 'Authorization: Bearer {api_key}' https://api.brightdata.com/datasets/snapshots/{snapshot_id}/content > clumio_employees.json")
            
            return snapshot_id
            
        else:
            print(f"❌ Error creating snapshot: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except requests.exceptions.Timeout:
        print("⏰ Request timed out. The API is processing a large dataset.")
        print("💡 This is normal for large companies. Check status later.")
        return None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return None

def main():
    """Main function"""
    snapshot_id = create_clumio_snapshot()
    
    if snapshot_id:
        print(f"\n✅ Successfully created Clumio snapshot!")
        print(f"📋 Snapshot ID: {snapshot_id}")
    else:
        print(f"\n❌ Failed to create Clumio snapshot")

if __name__ == "__main__":
    main() 