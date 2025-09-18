#!/usr/bin/env python3
"""
TOP Engineering Plus Data Cleanup Script
Processes and cleans the three datasets for import into Adrata platform
"""

import pandas as pd
import numpy as np
import re
from pathlib import Path
from datetime import datetime
import json
from typing import Dict, List, Tuple, Optional

class TOPDataCleaner:
    def __init__(self, data_dir: str = "."):
        self.data_dir = Path(data_dir)
        self.processed_dir = self.data_dir / "processed"
        self.reports_dir = self.data_dir / "reports"
        
        # Create directories
        self.processed_dir.mkdir(exist_ok=True)
        self.reports_dir.mkdir(exist_ok=True)
        
        # Data storage
        self.raw_data = {}
        self.cleaned_data = {}
        self.duplicates = {}
        self.quality_issues = {}
        
        # TOP Engineering Plus workspace ID
        self.workspace_id = "01K5D01YCQJ9TJ7CT4DZDE79T1"
        
    def load_raw_data(self):
        """Load all raw Excel files"""
        print("📁 Loading raw data files...")
        
        files = {
            "capsule_contacts": "Exported Capsule Contacts 2025-08-29.xlsx",
            "mailer_campaign": "Physical Mailer Campaign 2025-08-29.xlsx",
            "utc_regions": "UTC All Regions 2023.xlsx"
        }
        
        for key, filename in files.items():
            file_path = self.data_dir / filename
            if file_path.exists():
                print(f"  Loading {filename}...")
                if key == "utc_regions":
                    # UTC file has different structure
                    df = pd.read_excel(file_path, sheet_name="Sheet1")
                else:
                    df = pd.read_excel(file_path, sheet_name="contacts")
                
                self.raw_data[key] = df
                print(f"    ✅ Loaded {len(df)} records")
            else:
                print(f"    ❌ File not found: {filename}")
    
    def analyze_data_quality(self):
        """Analyze data quality across all datasets"""
        print("\n🔍 Analyzing data quality...")
        
        for dataset_name, df in self.raw_data.items():
            print(f"\n📊 {dataset_name.upper()} Quality Analysis:")
            print(f"  Total records: {len(df)}")
            
            # Key field analysis
            key_fields = self._get_key_fields(dataset_name)
            quality_report = {}
            
            for field in key_fields:
                if field in df.columns:
                    non_null_count = df[field].notna().sum()
                    completeness = (non_null_count / len(df)) * 100
                    quality_report[field] = {
                        'completeness': completeness,
                        'non_null_count': non_null_count,
                        'total_count': len(df)
                    }
                    print(f"    {field}: {completeness:.1f}% complete ({non_null_count}/{len(df)})")
            
            self.quality_issues[dataset_name] = quality_report
    
    def _get_key_fields(self, dataset_name: str) -> List[str]:
        """Get key fields for each dataset"""
        if dataset_name == "utc_regions":
            return ['Company', 'First Name', 'Last Name', 'Email', 'Title', 'Work Phone']
        else:
            return ['Name', 'First Name', 'Last Name', 'Email', 'Job Title', 'Organization', 'Phone Number']
    
    def standardize_data(self):
        """Standardize data across all datasets"""
        print("\n🔧 Standardizing data...")
        
        for dataset_name, df in self.raw_data.items():
            print(f"  Processing {dataset_name}...")
            
            # Create standardized dataframe
            std_df = pd.DataFrame()
            
            if dataset_name == "utc_regions":
                std_df = self._standardize_utc_data(df)
            else:
                std_df = self._standardize_capsule_data(df)
            
            self.cleaned_data[dataset_name] = std_df
            print(f"    ✅ Standardized {len(std_df)} records")
    
    def _standardize_utc_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Standardize UTC regions data"""
        std_df = pd.DataFrame()
        
        # Map UTC fields to standard format
        std_df['source_dataset'] = 'utc_regions'
        std_df['source_id'] = df.get('Unnamed: 0', range(len(df)))
        std_df['type'] = 'Person'  # All UTC records are people
        
        # Name fields
        std_df['first_name'] = df['First Name'].astype(str).str.strip()
        std_df['last_name'] = df['Last Name'].astype(str).str.strip()
        std_df['full_name'] = std_df['first_name'] + ' ' + std_df['last_name']
        
        # Contact fields
        std_df['email'] = df['Email'].astype(str).str.strip().str.lower()
        std_df['work_phone'] = df['Work Phone'].astype(str).str.strip()
        std_df['job_title'] = df['Title'].astype(str).str.strip()
        
        # Company fields
        std_df['company_name'] = df['Company'].astype(str).str.strip()
        
        # Address fields
        std_df['address'] = df['Address'].astype(str).str.strip()
        std_df['city'] = df['City'].astype(str).str.strip()
        std_df['state'] = df['State'].astype(str).str.strip()
        std_df['postal_code'] = df['Zip Code'].astype(str).str.strip()
        
        # Additional fields
        std_df['region'] = df['Region '].astype(str).str.strip()
        std_df['notes'] = df['Notes '].astype(str).str.strip()
        
        # Tags
        std_df['tags'] = 'UTC Conference 2023'
        
        return std_df
    
    def _standardize_capsule_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Standardize Capsule CRM data"""
        std_df = pd.DataFrame()
        
        # Map Capsule fields to standard format
        std_df['source_dataset'] = 'capsule_contacts'
        std_df['source_id'] = df['ID']
        std_df['type'] = df['Type']
        
        # Name fields
        std_df['first_name'] = df['First Name'].astype(str).str.strip()
        std_df['last_name'] = df['Last Name'].astype(str).str.strip()
        std_df['full_name'] = df['Name'].astype(str).str.strip()
        
        # Contact fields
        std_df['email'] = df['Email'].astype(str).str.strip().str.lower()
        std_df['work_email'] = df['Work Email'].astype(str).str.strip().str.lower()
        std_df['personal_email'] = df['Home Email'].astype(str).str.strip().str.lower()
        
        # Phone fields
        std_df['phone'] = df['Phone Number'].astype(str).str.strip()
        std_df['work_phone'] = df['Work Phone'].astype(str).str.strip()
        std_df['mobile_phone'] = df['Mobile Phone'].astype(str).str.strip()
        
        # Job information
        std_df['job_title'] = df['Job Title'].astype(str).str.strip()
        
        # Company fields
        std_df['company_name'] = df['Organization'].astype(str).str.strip()
        std_df['company'] = df['Company'].astype(str).str.strip()
        
        # Address fields
        std_df['address'] = df['Address Street'].astype(str).str.strip()
        std_df['city'] = df['City'].astype(str).str.strip()
        std_df['state'] = df['State'].astype(str).str.strip()
        std_df['postal_code'] = df['Postcode'].astype(str).str.strip()
        std_df['country'] = df['Country'].astype(str).str.strip()
        
        # Additional fields
        std_df['region'] = df['Region'].astype(str).str.strip()
        std_df['source'] = df['Source'].astype(str).str.strip()
        std_df['notes'] = df['Notes'].astype(str).str.strip()
        std_df['tags'] = df['Tags'].astype(str).str.strip()
        std_df['linkedin'] = df['LinkedIn'].astype(str).str.strip()
        
        # Dates
        std_df['created_at'] = df['Created']
        std_df['updated_at'] = df['Updated']
        std_df['last_contacted'] = df['Last Contacted']
        
        return std_df
    
    def deduplicate_data(self):
        """Identify and handle duplicate records"""
        print("\n🔄 Identifying duplicates...")
        
        # Combine all standardized data
        all_data = []
        for dataset_name, df in self.cleaned_data.items():
            df_copy = df.copy()
            df_copy['original_dataset'] = dataset_name
            all_data.append(df_copy)
        
        combined_df = pd.concat(all_data, ignore_index=True)
        
        # Deduplication strategies
        duplicates_by_email = self._find_duplicates_by_email(combined_df)
        duplicates_by_name = self._find_duplicates_by_name(combined_df)
        
        # Merge duplicate findings
        all_duplicates = set(duplicates_by_email) | set(duplicates_by_name)
        
        print(f"  Found {len(all_duplicates)} potential duplicate records")
        
        # Create deduplicated dataset
        self.deduplicated_data = combined_df.drop_duplicates(subset=['email'], keep='first')
        print(f"  After deduplication: {len(self.deduplicated_data)} unique records")
        
        # Store duplicate information
        self.duplicates = {
            'by_email': duplicates_by_email,
            'by_name': duplicates_by_name,
            'total_duplicates': len(all_duplicates)
        }
    
    def _find_duplicates_by_email(self, df: pd.DataFrame) -> List[int]:
        """Find duplicates based on email address"""
        email_duplicates = df[df['email'].duplicated(keep=False) & df['email'].notna()]
        return email_duplicates.index.tolist()
    
    def _find_duplicates_by_name(self, df: pd.DataFrame) -> List[int]:
        """Find duplicates based on name similarity"""
        # Simple name-based deduplication
        name_duplicates = df[df['full_name'].duplicated(keep=False) & df['full_name'].notna()]
        return name_duplicates.index.tolist()
    
    def validate_data(self):
        """Validate cleaned data"""
        print("\n✅ Validating cleaned data...")
        
        validation_results = {}
        
        # Email validation
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        valid_emails = self.deduplicated_data['email'].str.match(email_pattern, na=False)
        validation_results['valid_emails'] = valid_emails.sum()
        validation_results['invalid_emails'] = (~valid_emails).sum()
        
        # Phone validation (basic)
        phone_pattern = r'^[\+]?[1-9][\d]{0,15}$'
        valid_phones = self.deduplicated_data['phone'].str.replace(r'[^\d+]', '', regex=True).str.match(phone_pattern, na=False)
        validation_results['valid_phones'] = valid_phones.sum()
        validation_results['invalid_phones'] = (~valid_phones).sum()
        
        # Required fields validation
        required_fields = ['first_name', 'last_name', 'email']
        for field in required_fields:
            non_null_count = self.deduplicated_data[field].notna().sum()
            validation_results[f'{field}_complete'] = non_null_count
            validation_results[f'{field}_missing'] = len(self.deduplicated_data) - non_null_count
        
        print(f"  Valid emails: {validation_results['valid_emails']}")
        print(f"  Invalid emails: {validation_results['invalid_emails']}")
        print(f"  Valid phones: {validation_results['valid_phones']}")
        print(f"  Invalid phones: {validation_results['invalid_phones']}")
        
        self.validation_results = validation_results
    
    def prepare_import_files(self):
        """Prepare files for import into Adrata"""
        print("\n📤 Preparing import files...")
        
        # Separate people and companies
        people_data = self.deduplicated_data[self.deduplicated_data['type'] == 'Person'].copy()
        company_data = self.deduplicated_data[self.deduplicated_data['type'] == 'Organization'].copy()
        
        # Also extract companies from people data
        company_from_people = people_data[people_data['company_name'].notna()].copy()
        company_from_people = company_from_people[['company_name', 'address', 'city', 'state', 'postal_code', 'country']].drop_duplicates()
        company_from_people['type'] = 'Company'
        
        # Combine company data
        all_companies = pd.concat([company_data, company_from_people], ignore_index=True)
        all_companies = all_companies.drop_duplicates(subset=['company_name'])
        
        # Prepare people data for Adrata schema
        people_import = self._prepare_people_import(people_data)
        
        # Prepare company data for Adrata schema
        companies_import = self._prepare_companies_import(all_companies)
        
        # Save import files
        people_import.to_csv(self.processed_dir / "cleaned_people.csv", index=False)
        companies_import.to_csv(self.processed_dir / "cleaned_companies.csv", index=False)
        
        print(f"  ✅ People import file: {len(people_import)} records")
        print(f"  ✅ Companies import file: {len(companies_import)} records")
        
        self.import_files = {
            'people': people_import,
            'companies': companies_import
        }
    
    def _prepare_people_import(self, df: pd.DataFrame) -> pd.DataFrame:
        """Prepare people data for Adrata import"""
        import_df = pd.DataFrame()
        
        # Required fields
        import_df['workspaceId'] = self.workspace_id
        import_df['firstName'] = df['first_name']
        import_df['lastName'] = df['last_name']
        import_df['fullName'] = df['full_name']
        
        # Contact information
        import_df['email'] = df['email']
        import_df['workEmail'] = df.get('work_email', '')
        import_df['personalEmail'] = df.get('personal_email', '')
        import_df['phone'] = df.get('phone', '')
        import_df['mobilePhone'] = df.get('mobile_phone', '')
        import_df['workPhone'] = df.get('work_phone', '')
        
        # Job information
        import_df['jobTitle'] = df.get('job_title', '')
        import_df['department'] = ''
        
        # Address information
        import_df['address'] = df.get('address', '')
        import_df['city'] = df.get('city', '')
        import_df['state'] = df.get('state', '')
        import_df['country'] = df.get('country', '')
        import_df['postalCode'] = df.get('postal_code', '')
        
        # Additional fields
        import_df['linkedinUrl'] = df.get('linkedin', '')
        import_df['notes'] = df.get('notes', '')
        import_df['tags'] = df.get('tags', '')
        
        # Metadata
        import_df['createdAt'] = datetime.now()
        import_df['updatedAt'] = datetime.now()
        
        return import_df
    
    def _prepare_companies_import(self, df: pd.DataFrame) -> pd.DataFrame:
        """Prepare company data for Adrata import"""
        import_df = pd.DataFrame()
        
        # Required fields
        import_df['workspaceId'] = self.workspace_id
        import_df['name'] = df['company_name']
        
        # Contact information
        import_df['email'] = ''
        import_df['phone'] = ''
        import_df['website'] = ''
        
        # Address information
        import_df['address'] = df.get('address', '')
        import_df['city'] = df.get('city', '')
        import_df['state'] = df.get('state', '')
        import_df['country'] = df.get('country', '')
        import_df['postalCode'] = df.get('postal_code', '')
        
        # Additional fields
        import_df['industry'] = 'Engineering'
        import_df['description'] = ''
        import_df['notes'] = ''
        import_df['tags'] = 'TOP Engineering'
        
        # Metadata
        import_df['createdAt'] = datetime.now()
        import_df['updatedAt'] = datetime.now()
        
        return import_df
    
    def generate_reports(self):
        """Generate data quality and processing reports"""
        print("\n📊 Generating reports...")
        
        # Data quality report
        self._generate_quality_report()
        
        # Deduplication report
        self._generate_deduplication_report()
        
        # Import preparation report
        self._generate_import_report()
        
        print("  ✅ Reports generated in reports/ directory")
    
    def _generate_quality_report(self):
        """Generate data quality report"""
        report_path = self.reports_dir / "data_quality_report.md"
        
        with open(report_path, 'w') as f:
            f.write("# Data Quality Report\n\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            for dataset_name, quality_data in self.quality_issues.items():
                f.write(f"## {dataset_name.upper()}\n\n")
                f.write("| Field | Completeness | Non-Null | Total |\n")
                f.write("|-------|-------------|----------|-------|\n")
                
                for field, data in quality_data.items():
                    f.write(f"| {field} | {data['completeness']:.1f}% | {data['non_null_count']} | {data['total_count']} |\n")
                f.write("\n")
    
    def _generate_deduplication_report(self):
        """Generate deduplication report"""
        report_path = self.reports_dir / "deduplication_report.md"
        
        with open(report_path, 'w') as f:
            f.write("# Deduplication Report\n\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            f.write(f"## Summary\n\n")
            f.write(f"- Total duplicates found: {self.duplicates['total_duplicates']}\n")
            f.write(f"- Duplicates by email: {len(self.duplicates['by_email'])}\n")
            f.write(f"- Duplicates by name: {len(self.duplicates['by_name'])}\n")
            f.write(f"- Final unique records: {len(self.deduplicated_data)}\n\n")
    
    def _generate_import_report(self):
        """Generate import preparation report"""
        report_path = self.reports_dir / "import_validation_report.md"
        
        with open(report_path, 'w') as f:
            f.write("# Import Validation Report\n\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            f.write("## Validation Results\n\n")
            f.write(f"- Valid emails: {self.validation_results['valid_emails']}\n")
            f.write(f"- Invalid emails: {self.validation_results['invalid_emails']}\n")
            f.write(f"- Valid phones: {self.validation_results['valid_phones']}\n")
            f.write(f"- Invalid phones: {self.validation_results['invalid_phones']}\n\n")
            
            f.write("## Import Files\n\n")
            f.write(f"- People records: {len(self.import_files['people'])}\n")
            f.write(f"- Company records: {len(self.import_files['companies'])}\n\n")
    
    def run_full_cleanup(self):
        """Run the complete data cleanup process"""
        print("🚀 Starting TOP Engineering Plus Data Cleanup")
        print("=" * 60)
        
        try:
            # Load and analyze data
            self.load_raw_data()
            self.analyze_data_quality()
            
            # Clean and standardize data
            self.standardize_data()
            self.deduplicate_data()
            self.validate_data()
            
            # Prepare for import
            self.prepare_import_files()
            self.generate_reports()
            
            print("\n" + "=" * 60)
            print("✅ Data cleanup completed successfully!")
            print(f"📁 Processed files saved to: {self.processed_dir}")
            print(f"📊 Reports saved to: {self.reports_dir}")
            
        except Exception as e:
            print(f"\n❌ Error during cleanup: {e}")
            raise

def main():
    """Main function"""
    cleaner = TOPDataCleaner()
    cleaner.run_full_cleanup()

if __name__ == "__main__":
    main()
