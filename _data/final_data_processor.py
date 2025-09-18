#!/usr/bin/env python3
"""
Final data processor to create import-ready files
"""

import csv
import os

def clean_value(value):
    """Clean a value by replacing 'nan' with empty string"""
    if not value or str(value).lower() == 'nan':
        return ''
    return str(value).strip()

def analyze_engagement(row):
    """Analyze engagement level and determine funnel stage"""
    score = 0
    
    # Email indicators
    if row.get('email') and clean_value(row.get('email')):
        score += 2
    if row.get('workEmail') and clean_value(row.get('workEmail')):
        score += 3
        
    # Phone indicators  
    if row.get('phone') and clean_value(row.get('phone')):
        score += 2
    if row.get('workPhone') and clean_value(row.get('workPhone')):
        score += 3
        
    # Professional indicators
    if row.get('linkedinUrl') and clean_value(row.get('linkedinUrl')):
        score += 2
    if row.get('company_name') and clean_value(row.get('company_name')):
        score += 2
    if row.get('jobTitle') and clean_value(row.get('jobTitle')):
        score += 1
        
    # High-value indicators
    notes = str(row.get('notes', '')).lower()
    tags = str(row.get('tags', '')).lower()
    if 'utc' in notes or 'utc' in tags or 'conference' in notes or 'attendee' in notes:
        score += 5
    if 'mailchimp' in notes or 'mailer' in notes:
        score += 3
        
    # Determine funnel stage
    if score >= 8:
        stage = 'Opportunity'
    elif score >= 4:
        stage = 'Lead'
    else:
        stage = 'Prospect'
        
    return score, stage

def main():
    workspace_id = "01K5D01YCQJ9TJ7CT4DZDE79T1"
    
    print("Creating final import files...")
    
    # Process people data
    people_file = 'processed/cleaned_people.csv'
    if os.path.exists(people_file):
        print(f"Processing {people_file}...")
        
        with open(people_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            people_rows = list(reader)
        
        print(f"Loaded {len(people_rows)} people records")
        
        # Process each row
        processed_people = []
        funnel_counts = {'Prospect': 0, 'Lead': 0, 'Opportunity': 0}
        
        for row in people_rows:
            # Clean all values
            cleaned_row = {k: clean_value(v) for k, v in row.items()}
            
            # Set workspace ID
            cleaned_row['workspaceId'] = workspace_id
            
            # Analyze engagement
            score, stage = analyze_engagement(cleaned_row)
            cleaned_row['engagement_score'] = score
            cleaned_row['funnel_stage'] = stage
            
            funnel_counts[stage] += 1
            processed_people.append(cleaned_row)
        
        # Write final people file
        if processed_people:
            fieldnames = list(processed_people[0].keys())
            with open('people_final_with_workspace.csv', 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(processed_people)
        
        print(f"People funnel distribution:")
        for stage, count in funnel_counts.items():
            percentage = (count / len(people_rows)) * 100
            print(f"  {stage}: {count} ({percentage:.1f}%)")
    
    # Process companies data
    companies_file = 'processed/cleaned_companies.csv'
    if os.path.exists(companies_file):
        print(f"Processing {companies_file}...")
        
        with open(companies_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            company_rows = list(reader)
        
        print(f"Loaded {len(company_rows)} company records")
        
        # Process each row
        processed_companies = []
        
        for row in company_rows:
            # Clean all values
            cleaned_row = {k: clean_value(v) for k, v in row.items()}
            
            # Set workspace ID
            cleaned_row['workspaceId'] = workspace_id
            
            processed_companies.append(cleaned_row)
        
        # Write final companies file
        if processed_companies:
            fieldnames = list(processed_companies[0].keys())
            with open('companies_final_with_workspace.csv', 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(processed_companies)
    
    print(f"\nFiles created:")
    print(f"  ✓ people_final_with_workspace.csv")
    print(f"  ✓ companies_final_with_workspace.csv")
    print(f"  Workspace ID: {workspace_id}")

if __name__ == "__main__":
    main()
