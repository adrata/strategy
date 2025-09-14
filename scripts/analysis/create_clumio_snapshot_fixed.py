#!/usr/bin/env python3
"""
Create Clumio snapshot - Fixed version using correct API format
Based on Bright Data API documentation
"""

import requests
import json

def create_clumio_snapshot():
    """Create a snapshot for Clumio employees using correct API format"""
    
    api_key = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e"
    dataset_id = "gd_l1viktl72bvl7bjuj0"
    
    print("🎯 Creating Clumio Snapshot (Fixed API Format)")
    print("=" * 50)
    
    # Create filter for Clumio employees
    filter_data = {
        "name": "current_company_company_id",
        "operator": "=",
        "value": "clumio"
    }
    
    print(f"🔍 Using filter: {json.dumps(filter_data, indent=2)}")
    
    # Prepare the request exactly as per API documentation
    url = f"https://api.brightdata.com/datasets/filter?dataset_id={dataset_id}&records_limit=1000"
    
    headers = {
        'Authorization': f'Bearer {api_key}'
        # Remove Content-Type header - let requests set it automatically for multipart
    }
    
    data = {
        'filter': json.dumps(filter_data)
    }
    
    print(f"\n📤 Creating snapshot...")
    print(f"URL: {url}")
    print(f"Headers: {headers}")
    print(f"Data: {data}")
    
    try:
        response = requests.post(
            url,
            headers=headers,
            data=data,
            timeout=30  # 30 second timeout should be enough for initial response
        )
        
        print(f"Response Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Body: {response.text}")
        
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
        print("⏰ Request timed out after 30 seconds")
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