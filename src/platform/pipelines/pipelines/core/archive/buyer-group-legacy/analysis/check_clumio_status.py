#!/usr/bin/env python3
"""
Check Clumio snapshot status and download when ready
"""

import requests
import json
import time

def check_snapshot_status():
    """Check the status of the Clumio snapshot"""
    
    api_key = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e"
    snapshot_id = "snap_mdz6ili616uzgpjcnp"
    
    print("🔍 Checking Clumio snapshot status...")
    
    try:
        response = requests.get(
            f"https://api.brightdata.com/datasets/snapshots/{snapshot_id}",
            headers={'Authorization': f'Bearer {api_key}'},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            status = result.get('status')
            created = result.get('created')
            cost = result.get('cost', 0)
            
            print(f"📊 Snapshot Status: {status}")
            print(f"📅 Created: {created}")
            print(f"💰 Cost: {cost}")
            
            if status == 'completed' or status == 'ready':
                print("✅ Snapshot completed! Ready to download.")
                return True
            elif status == 'failed':
                print("❌ Snapshot failed!")
                return False
            else:
                print(f"⏳ Still {status}...")
                return False
        else:
            print(f"❌ Error checking status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error checking status: {e}")
        return False

def download_snapshot():
    """Download the completed snapshot"""
    
    api_key = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e"
    snapshot_id = "snap_mdz6ili616uzgpjcnp"
    
    print("📥 Downloading Clumio snapshot...")
    
    try:
        response = requests.get(
            f"https://api.brightdata.com/datasets/snapshots/{snapshot_id}/content",
            headers={'Authorization': f'Bearer {api_key}'},
            timeout=60
        )
        
        if response.status_code == 200:
            filename = f"clumio_employees_{snapshot_id}.json"
            with open(filename, 'w') as f:
                f.write(response.text)
            
            print(f"✅ Data downloaded to: {filename}")
            print(f"📊 File size: {len(response.text)} characters")
            
            # Quick analysis
            analyze_clumio_data(filename)
            return filename
        else:
            print(f"❌ Download failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Download error: {e}")
        return None

def analyze_clumio_data(filename):
    """Quick analysis of Clumio data"""
    
    print("\n🔍 Quick Clumio Data Analysis")
    print("=" * 40)
    
    try:
        with open(filename, 'r') as f:
            data = f.read()
        
        # Parse JSONL format
        employees = []
        for line in data.strip().split('\n'):
            if line:
                try:
                    employee = json.loads(line)
                    employees.append(employee)
                except json.JSONDecodeError:
                    continue
        
        print(f"📊 Found {len(employees)} Clumio employees")
        
        if not employees:
            print("❌ No employees found")
            return
        
        # Quick categorization
        sales_count = 0
        engineering_count = 0
        product_count = 0
        executive_count = 0
        other_count = 0
        
        for employee in employees:
            title = (employee.get('position', '') or employee.get('title', '')).lower()
            
            if any(keyword in title for keyword in ['sales', 'account executive', 'business development']):
                sales_count += 1
            elif any(keyword in title for keyword in ['engineer', 'developer', 'software']):
                engineering_count += 1
            elif any(keyword in title for keyword in ['product', 'pm']):
                product_count += 1
            elif any(keyword in title for keyword in ['ceo', 'cto', 'cfo', 'president', 'chief']):
                executive_count += 1
            else:
                other_count += 1
        
        print(f"\n🏢 CLUMIO TEAM BREAKDOWN:")
        print(f"Sales: {sales_count}")
        print(f"Engineering: {engineering_count}")
        print(f"Product: {product_count}")
        print(f"Executive: {executive_count}")
        print(f"Other: {other_count}")
        
        # Show some sample employees
        print(f"\n👥 SAMPLE EMPLOYEES:")
        for i, employee in enumerate(employees[:5], 1):
            name = employee.get('name', 'Unknown')
            title = employee.get('position', '') or employee.get('title', '')
            location = employee.get('location', 'Unknown')
            print(f"{i}. {name} - {title} ({location})")
        
        # Buyer group recommendation
        print(f"\n🎯 BUYER GROUP RECOMMENDATION:")
        if sales_count > 0:
            print(f"✅ Clumio HAS a sales team ({sales_count} members)")
            print(f"Primary Target: Sales Operations + Sales Leadership")
            print(f"Secondary Target: Sales Team members")
        else:
            print(f"❌ Clumio appears to have NO dedicated sales team")
            print(f"Primary Target: Product + Marketing teams")
            print(f"Secondary Target: Executive team")
        
    except Exception as e:
        print(f"❌ Analysis error: {e}")

def main():
    """Main function"""
    print("🎯 CLUMIO SNAPSHOT STATUS & ANALYSIS")
    print("=" * 50)
    
    # Check if snapshot is ready
    if check_snapshot_status():
        # Download and analyze
        filename = download_snapshot()
        if filename:
            print(f"\n✅ Successfully analyzed Clumio buyer group!")
            print(f"📁 Data saved to: {filename}")
        else:
            print(f"\n❌ Failed to download Clumio data")
    else:
        print(f"\n⏳ Snapshot not ready yet. Check again in a few minutes.")
        print(f"💡 You can check manually with:")
        print(f"   curl -H 'Authorization: Bearer 7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e' https://api.brightdata.com/datasets/snapshots/snap_mdz6ili616uzgpjcnp")

if __name__ == "__main__":
    main() 