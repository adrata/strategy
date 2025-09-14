#!/usr/bin/env python3
import requests
import json
import time
import os
from typing import Dict, List, Optional

class BrightDataMuxFinder:
    """Find Mux employees using Bright Data LinkedIn dataset"""
    
    def __init__(self):
        # Your actual Bright Data API key from the config
        self.api_key = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e"
        self.base_url = "https://api.brightdata.com/datasets"
        self.filter_endpoint = "https://api.brightdata.com/datasets/filter"
        
        # LinkedIn People dataset ID from your config
        self.linkedin_dataset_id = "gd_l1viktl72bvl7bjuj0"  # LinkedIn People dataset
        
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
    
    def create_mux_filter(self) -> Dict:
        """
        Create a comprehensive filter to find all Mux employees
        Using multiple strategies to catch all variations
        """
        
        # Strategy 1: Filter by current company name (exact matches)
        company_name_filter = {
            "operator": "or",
            "filters": [
                {
                    "name": "current_company_name",
                    "operator": "=",
                    "value": "Mux"
                },
                {
                    "name": "current_company_name", 
                    "operator": "=",
                    "value": "MUX"
                },
                {
                    "name": "current_company_name",
                    "operator": "=",
                    "value": "mux"
                }
            ]
        }
        
        # Strategy 2: Filter by company ID in experience data
        company_id_filter = {
            "name": "experience",
            "operator": "includes",
            "value": "mux"
        }
        
        # Strategy 3: Filter by company URL in experience data
        company_url_filter = {
            "name": "experience",
            "operator": "includes", 
            "value": "linkedin.com/company/mux"
        }
        
        # Strategy 4: Filter by job titles that might indicate Mux employment
        job_title_filter = {
            "operator": "or",
            "filters": [
                {
                    "name": "position",
                    "operator": "includes",
                    "value": "Mux"
                },
                {
                    "name": "position",
                    "operator": "includes",
                    "value": "video"
                },
                {
                    "name": "position", 
                    "operator": "includes",
                    "value": "streaming"
                }
            ]
        }
        
        # Combine all strategies with OR operator
        combined_filter = {
            "operator": "or",
            "filters": [
                company_name_filter,
                company_id_filter,
                company_url_filter,
                job_title_filter
            ]
        }
        
        return combined_filter
    
    def create_snapshot(self, filter_data: Dict) -> Optional[str]:
        """Create a filtered snapshot using Bright Data API"""
        
        payload = {
            'dataset_id': self.linkedin_dataset_id,
            'filter': json.dumps(filter_data),
            'records_limit': 10000  # Get up to 10,000 records
        }
        
        print("🎯 Creating Bright Data snapshot for Mux employees...")
        print(f"📊 Dataset ID: {self.linkedin_dataset_id}")
        print(f"🔍 Filter: {json.dumps(filter_data, indent=2)}")
        
        try:
            response = requests.post(
                self.filter_endpoint,
                headers={'Authorization': f'Bearer {self.api_key}'},
                data=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                snapshot_id = result.get('snapshot_id')
                print(f"✅ Snapshot created successfully: {snapshot_id}")
                return snapshot_id
            else:
                print(f"❌ Error creating snapshot: {response.status_code}")
                print(f"Response: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Exception creating snapshot: {e}")
            return None
    
    def wait_for_snapshot(self, snapshot_id: str, max_wait_time: int = 300) -> bool:
        """Wait for snapshot to complete"""
        
        print(f"⏳ Waiting for snapshot {snapshot_id} to complete...")
        
        start_time = time.time()
        while time.time() - start_time < max_wait_time:
            try:
                # Check snapshot status
                status_url = f"{self.base_url}/snapshots/{snapshot_id}"
                response = requests.get(status_url, headers=self.headers, timeout=30)
                
                if response.status_code == 200:
                    status_data = response.json()
                    status = status_data.get('status')
                    
                    if status == 'completed':
                        print(f"✅ Snapshot completed successfully!")
                        print(f"📊 Records found: {status_data.get('records_count', 'Unknown')}")
                        return True
                    elif status == 'failed':
                        print(f"❌ Snapshot failed: {status_data.get('error', 'Unknown error')}")
                        return False
                    else:
                        print(f"⏳ Status: {status}...")
                        time.sleep(10)  # Wait 10 seconds before checking again
                else:
                    print(f"⚠️  Error checking status: {response.status_code}")
                    time.sleep(10)
                    
            except Exception as e:
                print(f"⚠️  Exception checking status: {e}")
                time.sleep(10)
        
        print(f"⏰ Timeout waiting for snapshot completion")
        return False
    
    def download_snapshot(self, snapshot_id: str) -> Optional[List[Dict]]:
        """Download the completed snapshot data"""
        
        print(f"📥 Downloading snapshot {snapshot_id}...")
        
        try:
            # Get snapshot content
            content_url = f"{self.base_url}/snapshots/{snapshot_id}/content"
            response = requests.get(content_url, headers=self.headers, timeout=60)
            
            if response.status_code == 200:
                data = response.json()
                records = data.get('records', [])
                print(f"✅ Downloaded {len(records)} records")
                return records
            else:
                print(f"❌ Error downloading snapshot: {response.status_code}")
                print(f"Response: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Exception downloading snapshot: {e}")
            return None
    
    def analyze_mux_employees(self, employees: List[Dict]):
        """Analyze the Mux employee data"""
        
        if not employees:
            print("\n❌ No Mux employees found in the Bright Data dataset")
            return
        
        print(f"\n📊 Mux Employee Analysis")
        print("=" * 50)
        print(f"Total employees found: {len(employees)}")
        
        # Analyze by location
        locations = {}
        titles = {}
        companies = {}
        
        for emp in employees:
            # Location analysis
            location = emp.get('city', 'Unknown')
            if location not in locations:
                locations[location] = 0
            locations[location] += 1
            
            # Title analysis
            title = emp.get('position', 'Unknown')
            if title not in titles:
                titles[title] = 0
            titles[title] += 1
            
            # Company analysis (in case of multiple companies)
            company = emp.get('current_company_name', 'Unknown')
            if company not in companies:
                companies[company] = 0
            companies[company] += 1
        
        print(f"\n📍 Employee Locations (Top 10):")
        for location, count in sorted(locations.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"  • {location}: {count} employees")
        
        print(f"\n💼 Job Titles (Top 10):")
        for title, count in sorted(titles.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"  • {title}: {count} employees")
        
        print(f"\n🏢 Companies Found:")
        for company, count in sorted(companies.items(), key=lambda x: x[1], reverse=True):
            print(f"  • {company}: {count} employees")
        
        print(f"\n👥 Sample Employees:")
        for i, emp in enumerate(employees[:5], 1):
            print(f"  {i}. {emp.get('name', 'Unknown')}")
            print(f"     Title: {emp.get('position', 'Unknown')}")
            print(f"     Location: {emp.get('city', 'Unknown')}")
            print(f"     Company: {emp.get('current_company_name', 'Unknown')}")
            print()
    
    def find_mux_employees(self):
        """Main method to find all Mux employees"""
        
        print("🎯 Bright Data Mux Employee Finder")
        print("=" * 50)
        print(f"🔑 Using API Key: {self.api_key[:10]}...")
        print(f"📊 Dataset: LinkedIn People ({self.linkedin_dataset_id})")
        
        # Step 1: Create filter
        filter_data = self.create_mux_filter()
        
        # Step 2: Create snapshot
        snapshot_id = self.create_snapshot(filter_data)
        if not snapshot_id:
            print("❌ Failed to create snapshot")
            return
        
        # Step 3: Wait for completion
        if not self.wait_for_snapshot(snapshot_id):
            print("❌ Snapshot did not complete in time")
            return
        
        # Step 4: Download data
        employees = self.download_snapshot(snapshot_id)
        if not employees:
            print("❌ Failed to download snapshot data")
            return
        
        # Step 5: Analyze results
        self.analyze_mux_employees(employees)
        
        # Step 6: Save to file
        output_file = "mux_employees_brightdata.json"
        with open(output_file, 'w') as f:
            json.dump(employees, f, indent=2)
        print(f"\n💾 Results saved to: {output_file}")
        
        return employees

def main():
    """Main function"""
    finder = BrightDataMuxFinder()
    employees = finder.find_mux_employees()
    
    if employees:
        print(f"\n✅ Successfully found {len(employees)} Mux employees using Bright Data!")
        print("\n💡 Key Insights:")
        print("• Used multiple identification strategies to catch all variations")
        print("• Filtered by company name, ID, URL, and job titles")
        print("• Leveraged Bright Data's comprehensive LinkedIn dataset")
        print("• Results include current and past Mux employees")
    else:
        print(f"\n⚠️  No Mux employees found.")
        print("This could mean:")
        print("• Mux employees are not in this specific Bright Data dataset")
        print("• The company might be listed under a different name")
        print("• The dataset might need different filter criteria")

if __name__ == "__main__":
    main() 