#!/usr/bin/env python3
"""
Find Clumio Buyer Group for Buyer Group Intelligence Platform
"""

import requests
import json
import time
import os

# Bright Data API Configuration
API_KEY = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e"
DATASET_ID = "gd_l1viktl72bvl7bjuj0"  # LinkedIn People Dataset
BASE_URL = "https://api.brightdata.com/datasets/v3"

def test_connection():
    """Test Bright Data API connection"""
    print("🔗 Testing Bright Data API connection...")
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(f"{BASE_URL}/datasets", headers=headers, timeout=10)
        print(f"Connection test status: {response.status_code}")
        if response.status_code == 200:
            print("✅ API connection successful")
            return True
        else:
            print(f"❌ API connection failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

def create_clumio_filter():
    """Create filter for Clumio employees"""
    print("🎯 Creating Clumio employee filter...")
    
    filter_data = {
        "name": "current_company_company_id",
        "operator": "=",
        "value": "clumio"
    }
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "multipart/form-data"
    }
    
    data = {
        "dataset_id": DATASET_ID,
        "filter": json.dumps(filter_data)
    }
    
    try:
        response = requests.post(f"{BASE_URL}/datasets/filter", headers=headers, data=data, timeout=30)
        print(f"Filter creation status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Filter created successfully")
            print(f"Snapshot ID: {result.get('snapshot_id')}")
            return result.get('snapshot_id')
        else:
            print(f"❌ Filter creation failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Filter creation error: {e}")
        return None

def wait_for_snapshot(snapshot_id):
    """Wait for snapshot to complete"""
    print(f"⏳ Waiting for snapshot {snapshot_id} to complete...")
    
    headers = {
        "Authorization": f"Bearer {API_KEY}"
    }
    
    max_attempts = 30
    attempt = 0
    
    while attempt < max_attempts:
        try:
            response = requests.get(f"{BASE_URL}/datasets/snapshots/{snapshot_id}", headers=headers, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                status = result.get('status')
                print(f"Snapshot status: {status}")
                
                if status == 'completed':
                    print("✅ Snapshot completed successfully")
                    return True
                elif status == 'failed':
                    print("❌ Snapshot failed")
                    return False
                else:
                    print(f"⏳ Still processing... ({attempt + 1}/{max_attempts})")
            else:
                print(f"❌ Status check failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Status check error: {e}")
            return False
        
        attempt += 1
        time.sleep(10)  # Wait 10 seconds between checks
    
    print("❌ Snapshot timed out")
    return False

def download_snapshot_data(snapshot_id):
    """Download snapshot data"""
    print(f"📥 Downloading snapshot {snapshot_id} data...")
    
    headers = {
        "Authorization": f"Bearer {API_KEY}"
    }
    
    try:
        response = requests.get(f"{BASE_URL}/datasets/snapshots/{snapshot_id}/content", headers=headers, timeout=30)
        
        if response.status_code == 200:
            filename = f"clumio_employees_{snapshot_id}.json"
            with open(filename, 'w') as f:
                f.write(response.text)
            print(f"✅ Data downloaded to {filename}")
            return filename
        else:
            print(f"❌ Download failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Download error: {e}")
        return None

def analyze_clumio_buyer_group(filename):
    """Analyze Clumio buyer group"""
    print("🔍 Analyzing Clumio buyer group...")
    
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
        
        # Categorize employees
        categories = {
            'Sales': [],
            'Sales Operations': [],
            'Sales Leadership': [],
            'Product': [],
            'Marketing': [],
            'Engineering': [],
            'Executive': [],
            'Customer Success': [],
            'Other': []
        }
        
        for employee in employees:
            title = (employee.get('position', '') or employee.get('title', '')).lower()
            name = employee.get('name', 'Unknown')
            
            # Sales team categorization
            if any(keyword in title for keyword in ['account executive', 'sales executive', 'sales manager', 'sales director', 'sales representative']):
                categories['Sales'].append(employee)
            elif any(keyword in title for keyword in ['sales operations', 'sales ops', 'revops', 'revenue operations', 'sales enablement']):
                categories['Sales Operations'].append(employee)
            elif any(keyword in title for keyword in ['vp sales', 'head of sales', 'chief revenue officer', 'cro', 'sales director']):
                categories['Sales Leadership'].append(employee)
            elif any(keyword in title for keyword in ['product', 'pm', 'product manager']):
                categories['Product'].append(employee)
            elif any(keyword in title for keyword in ['marketing', 'brand', 'creative']):
                categories['Marketing'].append(employee)
            elif any(keyword in title for keyword in ['engineer', 'developer', 'software']):
                categories['Engineering'].append(employee)
            elif any(keyword in title for keyword in ['ceo', 'cto', 'cfo', 'president', 'chief']):
                categories['Executive'].append(employee)
            elif any(keyword in title for keyword in ['customer success', 'customer support', 'cs']):
                categories['Customer Success'].append(employee)
            else:
                categories['Other'].append(employee)
        
        # Display results
        print("\n🎯 CLUMIO BUYER GROUP ANALYSIS")
        print("=" * 50)
        
        total_employees = len(employees)
        print(f"Total Employees: {total_employees}")
        
        # Focus on sales-related teams
        sales_teams = ['Sales', 'Sales Operations', 'Sales Leadership']
        total_sales = sum(len(categories[team]) for team in sales_teams)
        
        print(f"\n🏆 SALES TEAM BREAKDOWN:")
        print(f"Total Sales-Related: {total_sales}")
        
        for team in sales_teams:
            team_members = categories[team]
            if team_members:
                print(f"\n{team} Team ({len(team_members)} members):")
                for i, employee in enumerate(team_members, 1):
                    name = employee.get('name', 'Unknown')
                    title = employee.get('position', '') or employee.get('title', '')
                    location = employee.get('location', 'Unknown')
                    connections = employee.get('connections', 0) or 0
                    followers = employee.get('followers', 0) or 0
                    
                    print(f"  {i:2d}. {name}")
                    print(f"      Title: {title}")
                    print(f"      Location: {location}")
                    print(f"      Network: {connections} connections, {followers} followers")
                    print(f"      LinkedIn: {employee.get('url', 'N/A')}")
        
        # Show other teams for context
        print(f"\n📊 OTHER TEAMS (For Context):")
        for team, members in categories.items():
            if team not in sales_teams and members:
                print(f"  {team}: {len(members)} employees")
                # Show top 3 from each team
                for i, employee in enumerate(members[:3], 1):
                    name = employee.get('name', 'Unknown')
                    title = employee.get('position', '') or employee.get('title', '')
                    print(f"    {i}. {name} - {title}")
        
        # Determine optimal buyer group
        print(f"\n🎯 OPTIMAL BUYER GROUP RECOMMENDATION:")
        if total_sales > 0:
            print(f"✅ Clumio HAS a sales team ({total_sales} members)")
            print(f"Primary Target: Sales Operations + Sales Leadership")
            print(f"Secondary Target: Sales Team members")
        else:
            print(f"❌ Clumio appears to have NO dedicated sales team")
            print(f"Primary Target: Product + Marketing teams")
            print(f"Secondary Target: Executive team")
        
    except Exception as e:
        print(f"❌ Analysis error: {e}")

def main():
    """Main function to find Clumio buyer group"""
    print("🎯 FINDING CLUMIO BUYER GROUP")
    print("=" * 40)
    
    # Test connection
    if not test_connection():
        return
    
    # Create filter
    snapshot_id = create_clumio_filter()
    if not snapshot_id:
        return
    
    # Wait for completion
    if not wait_for_snapshot(snapshot_id):
        return
    
    # Download data
    filename = download_snapshot_data(snapshot_id)
    if not filename:
        return
    
    # Analyze buyer group
    analyze_clumio_buyer_group(filename)

if __name__ == "__main__":
    main() 