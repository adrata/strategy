#!/usr/bin/env python3
import csv
import pandas as pd

def restore_original_companies():
    """
    Ensure all original WARM B.D LIST companies are included in the final list
    """
    
    print("🔍 CHECKING ORIGINAL WARM B.D LIST COMPANIES")
    print("=" * 60)
    
    # Read the original Excel file
    try:
        original_df = pd.read_excel('WARM B.D LIST.xlsx')
        original_companies = [str(company).strip() for company in original_df['Client'].dropna() if str(company) != 'nan']
    except:
        # Fallback to CSV if Excel reading fails
        with open('warm_bd_list_raw.csv', 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader)
            original_companies = []
            for row in reader:
                if row and row[0].strip():
                    original_companies.append(row[0].strip())
    
    # Read current final list
    current_companies = []
    current_company_names = set()
    
    with open('warm_bd_list_FINAL_CORRECTED.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            if row and row[0].strip():
                current_companies.append(row)
                current_company_names.add(row[0].strip())
    
    print(f"📊 ORIGINAL COMPANIES: {len(original_companies)}")
    print(f"📊 CURRENT COMPANIES: {len(current_companies)}")
    
    # Find missing original companies
    missing_companies = []
    for orig_company in original_companies:
        if orig_company not in current_company_names:
            missing_companies.append(orig_company)
    
    print(f"\n🔍 MISSING ORIGINAL COMPANIES: {len(missing_companies)}")
    for company in missing_companies:
        print(f"   • {company}")
    
    if not missing_companies:
        print("✅ ALL ORIGINAL COMPANIES ARE PRESENT!")
        return current_companies
    
    # Add missing companies back with basic data
    print(f"\n➕ RESTORING {len(missing_companies)} MISSING COMPANIES:")
    
    for company in missing_companies:
        # Create basic entry for missing company
        missing_entry = [
            company,  # Company
            'Lead',   # Status (default)
            '-',      # Size_Category (to be filled)
            '-',      # Employees (to be filled)
            '-',      # Revenue (to be filled)
            '-',      # Industry (to be filled)
            '-',      # Website (to be filled)
            '-',      # Description (to be filled)
            '-',      # Point_of_Contact
            '-',      # Location
            '-',      # Phone
            'Contract/Perm Roles',  # Contract_Type
            '-',      # Potential_Revenue
            'Original WARM B.D LIST company - needs enrichment'  # Notes
        ]
        
        current_companies.append(missing_entry)
        print(f"   ✅ Restored: {company}")
    
    # Write the complete list
    with open('warm_bd_list_COMPLETE_WITH_ORIGINALS.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(current_companies)
    
    print(f"\n✅ COMPLETE LIST CREATED:")
    print(f"   📋 File: warm_bd_list_COMPLETE_WITH_ORIGINALS.csv")
    print(f"   📊 Total Companies: {len(current_companies)}")
    print(f"   🔄 Original companies: {len(original_companies)} (all restored)")
    print(f"   ➕ Added companies: {len(current_companies) - len(original_companies)}")
    
    # Show breakdown by status
    from collections import Counter
    status_counts = Counter([row[1] for row in current_companies if len(row) > 1])
    
    print(f"\n📈 STATUS BREAKDOWN:")
    for status, count in sorted(status_counts.items()):
        print(f"   {status}: {count} companies")
    
    print(f"\n🎯 NEXT STEPS:")
    print(f"   • Review companies marked with '-' for enrichment")
    print(f"   • Add size categories, revenue, and industry data")
    print(f"   • Verify all original relationships are preserved")
    
    return current_companies

if __name__ == "__main__":
    restore_original_companies() 