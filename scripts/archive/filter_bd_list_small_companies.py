#!/usr/bin/env python3
import csv
import re

def filter_small_companies():
    """
    Filter BD list to keep only companies $50M or below in revenue
    Remove large enterprises (L1, L2, L3) and focus on accessible smaller companies
    """
    
    # Read the enriched BD list
    companies_to_keep = []
    companies_removed = []
    
    with open('warm_bd_list_FINAL_ENRICHED.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        for row in reader:
            if len(row) < 3:
                companies_to_keep.append(row)
                continue
                
            company_name = row[0]
            size_category = row[2] if len(row) > 2 else '-'
            revenue = row[4] if len(row) > 4 else '-'
            
            # Remove large companies (L1, L2, L3)
            if size_category in ['L1', 'L2', 'L3']:
                companies_removed.append({
                    'name': company_name,
                    'size': size_category,
                    'revenue': revenue,
                    'reason': 'Too large (L1/L2/L3 category)'
                })
                continue
            
            # Check for large M1 companies (over $50M)
            if size_category == 'M1':
                revenue_text = revenue.lower()
                if ('100m' in revenue_text or 'billion' in revenue_text or 
                    '$1b' in revenue_text or '$100m-' in revenue_text):
                    companies_removed.append({
                        'name': company_name,
                        'size': size_category,
                        'revenue': revenue,
                        'reason': 'M1 company over $50M'
                    })
                    continue
            
            # Remove specific large companies by name
            large_company_indicators = [
                'accenture', 'deloitte', 'cognizant', 'capgemini', 'epic games',
                'leonardo', 'hii', 'slalom', 'radian'
            ]
            
            if any(indicator in company_name.lower() for indicator in large_company_indicators):
                companies_removed.append({
                    'name': company_name,
                    'size': size_category,
                    'revenue': revenue,
                    'reason': 'Known large enterprise'
                })
                continue
            
            # Keep the company
            companies_to_keep.append(row)
    
    print("🎯 FILTERING BD LIST FOR SMALLER COMPANIES ($50M OR BELOW)")
    print("=" * 60)
    
    print(f"🗑️ REMOVING {len(companies_removed)} LARGE COMPANIES:")
    for company in companies_removed:
        print(f"   - {company['name']} ({company['size']}) - {company['reason']}")
    
    # Write filtered list
    with open('warm_bd_list_SMALL_COMPANIES.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(companies_to_keep)
    
    # Generate summary
    size_counts = {}
    status_counts = {}
    revenue_ranges = {}
    
    for row in companies_to_keep:
        if len(row) > 2:
            size = row[2]
            size_counts[size] = size_counts.get(size, 0) + 1
            
            status = row[1] if len(row) > 1 else '-'
            status_counts[status] = status_counts.get(status, 0) + 1
            
            revenue = row[4] if len(row) > 4 else '-'
            if revenue != '-':
                revenue_ranges[revenue] = revenue_ranges.get(revenue, 0) + 1
    
    print(f"\n✅ FILTERED LIST: {len(companies_to_keep)} companies")
    print(f"📊 REMOVED: {len(companies_removed)} large companies")
    
    print("\n📊 SIZE CATEGORY DISTRIBUTION (FILTERED):")
    for size in ['M2', 'M3', 'S1', 'S2', 'S3', '-']:
        count = size_counts.get(size, 0)
        if count > 0:
            print(f"   {size}: {count} companies")
    
    print("\n📈 STATUS DISTRIBUTION (FILTERED):")
    for status, count in sorted(status_counts.items()):
        print(f"   {status}: {count} companies")
    
    print("\n💰 REVENUE RANGES (ENRICHED COMPANIES):")
    for revenue, count in sorted(revenue_ranges.items()):
        if revenue != '-':
            print(f"   {revenue}: {count} companies")
    
    print(f"\n📋 FILTERED FILE: warm_bd_list_SMALL_COMPANIES.csv")
    print(f"🎯 FOCUS: Companies $50M or below - more accessible for BD outreach")
    
    return companies_to_keep

if __name__ == "__main__":
    filter_small_companies() 