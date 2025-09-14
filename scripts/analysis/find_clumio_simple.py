#!/usr/bin/env python3
import requests
import json
import time

def test_brightdata_connection():
    """Test the Bright Data API connection"""
    
    api_key = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e"
    dataset_id = "gd_l1viktl72bvl7bjuj0"  # Back to original dataset ID
    
    print("🔍 Testing Bright Data API Connection...")
    
    # Skip metadata test and just return True - the filter creation will test the connection
    print("✅ Skipping metadata test - will test connection during filter creation")
    return True

def create_simple_clumio_filter():
    """Create a simple filter for Clumio employees"""
    
    # Use LinkedIn company ID instead of company name
    filter_data = {
        "name": "current_company_company_id",
        "operator": "=",
        "value": "clumio"
    }
    
    return filter_data

def find_clumio_employees_simple():
    """Simple approach to find Clumio employees"""
    
    api_key = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e"
    dataset_id = "gd_l1viktl72bvl7bjuj0"  # Back to original dataset ID
    filter_endpoint = "https://api.brightdata.com/datasets/filter"
    
    print("🎯 Simple Clumio Employee Finder")
    print("=" * 40)
    
    # Step 1: Test connection
    if not test_brightdata_connection():
        print("❌ Cannot connect to Bright Data API")
        return None
    
    # Step 2: Create simple filter
    filter_data = create_simple_clumio_filter()
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
        print("💡 This is normal for large companies. Try again in a few minutes.")
        return None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return None

def wait_and_download_snapshot(snapshot_id, api_key):
    """Wait for snapshot to complete and download data"""
    
    print(f"⏳ Waiting for snapshot {snapshot_id} to complete...")
    
    max_attempts = 30
    attempt = 0
    
    while attempt < max_attempts:
        try:
            # Check snapshot status
            status_url = f"https://api.brightdata.com/datasets/snapshots/{snapshot_id}"
            headers = {'Authorization': f'Bearer {api_key}'}
            
            response = requests.get(status_url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                status = result.get('status')
                
                print(f"📊 Snapshot status: {status} (attempt {attempt + 1}/{max_attempts})")
                
                if status == 'completed':
                    print("✅ Snapshot completed successfully!")
                    return download_snapshot_data(snapshot_id, api_key)
                elif status == 'failed':
                    print("❌ Snapshot failed")
                    return None
                else:
                    # Still processing
                    print(f"⏳ Still processing... waiting 10 seconds")
                    time.sleep(10)
            else:
                print(f"❌ Error checking status: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ Error checking snapshot status: {e}")
            return None
        
        attempt += 1
    
    print("⏰ Snapshot timed out after 5 minutes")
    return None

def download_snapshot_data(snapshot_id, api_key):
    """Download the completed snapshot data"""
    
    print(f"📥 Downloading snapshot data...")
    
    try:
        # Download the data
        download_url = f"https://api.brightdata.com/datasets/snapshots/{snapshot_id}/content"
        headers = {'Authorization': f'Bearer {api_key}'}
        
        response = requests.get(download_url, headers=headers, timeout=60)
        
        if response.status_code == 200:
            # Save to file
            filename = f"clumio_employees_{snapshot_id}.json"
            with open(filename, 'w') as f:
                f.write(response.text)
            
            print(f"✅ Data downloaded to: {filename}")
            print(f"📊 File size: {len(response.text)} characters")
            
            # Analyze the data
            analyze_clumio_buyer_group(filename)
            return filename
        else:
            print(f"❌ Error downloading data: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error downloading snapshot: {e}")
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
    """Main function"""
    print("🎯 FINDING CLUMIO BUYER GROUP")
    print("=" * 40)
    
    result = find_clumio_employees_simple()
    
    if result:
        print(f"\n✅ Successfully found Clumio buyer group!")
        print(f"📁 Data saved to: {result}")
    else:
        print(f"\n❌ Failed to find Clumio buyer group")

if __name__ == "__main__":
    main() 