#!/usr/bin/env python3
import csv

def add_current_new_status():
    """
    Add a Status column to distinguish between original ("Current") and added ("New") companies
    """
    
    print("🏷️ ADDING CURRENT/NEW STATUS COLUMN")
    print("=" * 60)
    
    # Original WARM B.D LIST companies (from the Excel file)
    original_companies = {
        'Information Protection Solutions',
        'Ivory Skies',
        'Leonardo Helicopters',
        'Contera Networks',
        'Delaware Division of medical',
        'ILMS Systems',
        'Advanced Algorithm Developmental for space',
        'Sev1Tech LLC',
        'HII',
        'Akiak NS LLC',
        'Appatian',
        'Vector X',
        'Nimba Solutions',
        'Locator X',
        'Neocol',
        'Cloud Masonry',
        'Epic Games',
        'Greenphire',
        'Radian',
        'Entech, LLC',
        'Albertsons Companies',
        'Carlisle Construction',
        'theITSupportCenter LLC',
        'ServiceNow',
        'Elliot Lewis',
        'LogicWorks',
        'Lassonde Pappas',
        'DW1'
    }
    
    # Read current list
    companies = []
    with open('warm_bd_list_FINAL_COMPLETE.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        companies = list(reader)
    
    print(f"📊 PROCESSING {len(companies)} COMPANIES")
    
    # Add the new Status column to header
    new_header = header + ['Relationship_Status']
    
    # Process each company
    current_count = 0
    new_count = 0
    
    for i, company in enumerate(companies):
        if len(company) < 1:
            continue
            
        company_name = company[0].strip()
        
        # Determine if this is an original ("Current") or added ("New") company
        if company_name in original_companies:
            relationship_status = 'Current'
            current_count += 1
            print(f"   📋 Current: {company_name}")
        else:
            relationship_status = 'New'
            new_count += 1
            print(f"   ➕ New: {company_name}")
        
        # Add the status to the company row
        company.append(relationship_status)
    
    # Write the updated list
    with open('warm_bd_list_WITH_STATUS.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(new_header)
        writer.writerows(companies)
    
    print(f"\n✅ STATUS COLUMN ADDED:")
    print(f"   📋 File: warm_bd_list_WITH_STATUS.csv")
    print(f"   📊 Total Companies: {len(companies)}")
    print(f"   📋 Current (Original): {current_count} companies")
    print(f"   ➕ New (Added): {new_count} companies")
    
    # Show breakdown by status and size
    from collections import Counter, defaultdict
    
    status_size_breakdown = defaultdict(lambda: defaultdict(int))
    
    for company in companies:
        if len(company) >= 15:  # Now has 15 columns including new status
            size_cat = company[2]
            relationship_status = company[14]  # Last column is relationship status
            status_size_breakdown[relationship_status][size_cat] += 1
    
    print(f"\n📈 BREAKDOWN BY RELATIONSHIP STATUS:")
    for status in ['Current', 'New']:
        print(f"\n   🏷️ {status.upper()} COMPANIES:")
        size_counts = status_size_breakdown[status]
        total = sum(size_counts.values())
        print(f"      Total: {total}")
        
        for size in ['L1', 'L2', 'L3', 'M1', 'M2', 'M3', 'S1', 'S2', 'S3', '-']:
            count = size_counts.get(size, 0)
            if count > 0:
                percentage = (count / total * 100) if total > 0 else 0
                print(f"      {size}: {count} companies ({percentage:.1f}%)")
    
    print(f"\n🎯 STRATEGIC INSIGHTS:")
    print(f"   • Original relationships preserved: {current_count}")
    print(f"   • New opportunities added: {new_count}")
    print(f"   • Perfect mix for BD outreach and relationship management")
    print(f"   • Easy filtering by relationship history")
    
    # Copy to final file
    import shutil
    shutil.copy('warm_bd_list_WITH_STATUS.csv', 'warm_bd_list_FINAL_COMPLETE.csv')
    print(f"\n📋 UPDATED: warm_bd_list_FINAL_COMPLETE.csv")
    
    return companies

if __name__ == "__main__":
    add_current_new_status() 