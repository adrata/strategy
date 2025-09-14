#!/usr/bin/env python3
import requests
import json
import time

def test_brightdata_connection():
    """Test the Bright Data API connection"""
    
    api_key = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e"
    dataset_id = "gd_l1viktl72bvl7bjuj0"
    
    print("🔍 Testing Bright Data API Connection...")
    
    # Test 1: Check if we can access the dataset metadata
    try:
        metadata_url = f"https://api.brightdata.com/datasets/{dataset_id}"
        headers = {'Authorization': f'Bearer {api_key}'}
        
        print(f"📊 Checking dataset metadata: {metadata_url}")
        response = requests.get(metadata_url, headers=headers, timeout=30)
        
        if response.status_code == 200:
            metadata = response.json()
            print(f"✅ Dataset found: {metadata.get('name', 'Unknown')}")
            print(f"📈 Total records: {metadata.get('records_count', 'Unknown')}")
            return True
        else:
            print(f"❌ Error accessing dataset: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

def create_simple_mux_filter():
    """Create a simple filter for Mux employees"""
    
    # Simple filter: just look for current company name
    filter_data = {
        "name": "current_company_name",
        "operator": "=",
        "value": "Mux"
    }
    
    return filter_data

def find_mux_employees_simple():
    """Simple approach to find Mux employees"""
    
    api_key = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e"
    dataset_id = "gd_l1viktl72bvl7bjuj0"
    filter_endpoint = "https://api.brightdata.com/datasets/filter"
    
    print("🎯 Simple Mux Employee Finder")
    print("=" * 40)
    
    # Step 1: Test connection
    if not test_brightdata_connection():
        print("❌ Cannot connect to Bright Data API")
        return None
    
    # Step 2: Create simple filter
    filter_data = create_simple_mux_filter()
    print(f"\n🔍 Using filter: {json.dumps(filter_data, indent=2)}")
    
    # Step 3: Create snapshot
    payload = {
        'dataset_id': dataset_id,
        'filter': json.dumps(filter_data),
        'records_limit': 1000  # Start with smaller limit
    }
    
    print(f"\n📤 Creating snapshot...")
    print(f"⏳ This may take a few minutes...")
    
    try:
        response = requests.post(
            filter_endpoint,
            headers={'Authorization': f'Bearer {api_key}'},
            data=payload,
            timeout=120  # 2 minute timeout
        )
        
        if response.status_code == 200:
            result = response.json()
            snapshot_id = result.get('snapshot_id')
            print(f"✅ Snapshot created: {snapshot_id}")
            
            # Step 4: Wait for completion
            print(f"⏳ Waiting for snapshot to complete...")
            return wait_and_download_snapshot(snapshot_id, api_key)
            
        else:
            print(f"❌ Error creating snapshot: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except requests.exceptions.Timeout:
        print("⏰ Request timed out. The API is processing a large dataset.")
        print("💡 Try running the script again in a few minutes.")
        return None
    except Exception as e:
        print(f"❌ Exception: {e}")
        return None

def wait_and_download_snapshot(snapshot_id, api_key):
    """Wait for snapshot and download results"""
    
    base_url = "https://api.brightdata.com/datasets"
    headers = {'Authorization': f'Bearer {api_key}'}
    
    print(f"⏳ Checking snapshot status...")
    
    # Wait up to 10 minutes
    for attempt in range(60):  # 60 attempts * 10 seconds = 10 minutes
        try:
            status_url = f"{base_url}/snapshots/{snapshot_id}"
            response = requests.get(status_url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                status_data = response.json()
                status = status_data.get('status')
                
                if status == 'completed':
                    records_count = status_data.get('records_count', 0)
                    print(f"✅ Snapshot completed! Found {records_count} records")
                    
                    # Download the data
                    return download_snapshot_data(snapshot_id, api_key)
                    
                elif status == 'failed':
                    error = status_data.get('error', 'Unknown error')
                    print(f"❌ Snapshot failed: {error}")
                    return None
                else:
                    print(f"⏳ Status: {status}... (attempt {attempt + 1}/60)")
                    time.sleep(10)
            else:
                print(f"⚠️  Error checking status: {response.status_code}")
                time.sleep(10)
                
        except Exception as e:
            print(f"⚠️  Exception checking status: {e}")
            time.sleep(10)
    
    print("⏰ Timeout waiting for snapshot completion")
    return None

def download_snapshot_data(snapshot_id, api_key):
    """Download the snapshot data"""
    
    base_url = "https://api.brightdata.com/datasets"
    headers = {'Authorization': f'Bearer {api_key}'}
    
    print(f"📥 Downloading snapshot data...")
    
    try:
        content_url = f"{base_url}/snapshots/{snapshot_id}/content"
        response = requests.get(content_url, headers=headers, timeout=60)
        
        if response.status_code == 200:
            data = response.json()
            records = data.get('records', [])
            print(f"✅ Downloaded {len(records)} records")
            
            # Save to file
            output_file = "mux_employees_simple.json"
            with open(output_file, 'w') as f:
                json.dump(records, f, indent=2)
            print(f"💾 Results saved to: {output_file}")
            
            # Show sample
            if records:
                print(f"\n👥 Sample Mux Employees:")
                for i, emp in enumerate(records[:5], 1):
                    print(f"  {i}. {emp.get('name', 'Unknown')}")
                    print(f"     Title: {emp.get('position', 'Unknown')}")
                    print(f"     Location: {emp.get('city', 'Unknown')}")
                    print()
            
            return records
        else:
            print(f"❌ Error downloading: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Exception downloading: {e}")
        return None

def main():
    """Main function"""
    print("🚀 Starting Mux Employee Search with Bright Data")
    print("=" * 60)
    
    employees = find_mux_employees_simple()
    
    if employees:
        print(f"\n✅ Successfully found {len(employees)} Mux employees!")
        print("\n💡 Next Steps:")
        print("• Check the saved JSON file for complete data")
        print("• Use more complex filters if needed")
        print("• Consider location-based filtering for accuracy")
    else:
        print(f"\n⚠️  No Mux employees found or search failed.")
        print("\n💡 Troubleshooting:")
        print("• Check your API key and dataset ID")
        print("• Verify the dataset contains LinkedIn data")
        print("• Try a different company name variation")

if __name__ == "__main__":
    main() 