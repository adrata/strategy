#!/usr/bin/env python3
"""
Create Yello.co Bright Data Snapshot
Find all employees at Yello.co using Bright Data API
"""

import requests
import json
import time

def create_yello_snapshot():
    """Create a snapshot for Yello.co employees"""
    api_key = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e"
    dataset_id = "gd_l1viktl72bvl7bjuj0"
    
    # Yello.co LinkedIn company ID (from URL: https://www.linkedin.com/company/yello.co/)
    # The company ID is typically "yello-co" based on the URL pattern
    filter_data = {
        "name": "current_company_company_id",
        "operator": "=",
        "value": "yello-co"
    }
    
    url = f"https://api.brightdata.com/datasets/filter?dataset_id={dataset_id}&records_limit=1000"
    
    headers = {
        'Authorization': f'Bearer {api_key}'
    }
    
    data = {
        'filter': json.dumps(filter_data)
    }
    
    print("🔍 Creating Yello.co snapshot...")
    print(f"📊 Dataset ID: {dataset_id}")
    print(f"🎯 Filter: {filter_data}")
    
    try:
        response = requests.post(
            url,
            headers=headers,
            data=data,
            timeout=30
        )
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            snapshot_id = result.get('snapshot_id')
            print(f"✅ Snapshot created successfully!")
            print(f"🆔 Snapshot ID: {snapshot_id}")
            
            # Save snapshot ID to file
            with open('yello_snapshot_id.txt', 'w') as f:
                f.write(snapshot_id)
            print(f"💾 Snapshot ID saved to: yello_snapshot_id.txt")
            
            # Provide curl commands for manual checking
            print(f"\n🔧 Manual Commands:")
            print(f"# Check snapshot status:")
            print(f'curl -H "Authorization: Bearer {api_key}" "https://api.brightdata.com/datasets/snapshots/{snapshot_id}"')
            print(f"\n# Download snapshot data:")
            print(f'curl -H "Authorization: Bearer {api_key}" "https://api.brightdata.com/datasets/snapshots/{snapshot_id}/content" > yello_employees_{snapshot_id}.json')
            
            return snapshot_id
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating snapshot: {e}")
        return None

def main():
    """Main function"""
    print("🚀 Creating Yello.co Employee Snapshot")
    print("=" * 50)
    
    snapshot_id = create_yello_snapshot()
    
    if snapshot_id:
        print(f"\n✅ Snapshot creation initiated!")
        print(f"🆔 Snapshot ID: {snapshot_id}")
        print(f"⏳ Please wait for the snapshot to complete, then use the curl commands above to download the data.")
    else:
        print(f"\n❌ Failed to create snapshot")

if __name__ == "__main__":
    main() 