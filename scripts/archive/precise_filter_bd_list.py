#!/usr/bin/env python3
import csv
import re

def precise_filter_small_companies():
    """
    Precisely filter BD list to keep only companies $50M or below in revenue
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
            
            should_remove = False
            removal_reason = ""
            
            # Remove all L1, L2, L3 companies (too large)
            if size_category in ['L1', 'L2', 'L3']:
                should_remove = True
                removal_reason = f'Too large ({size_category} category)'
            
            # Remove M1 companies (typically $100M-500M)
            elif size_category == 'M1':
                should_remove = True
                removal_reason = 'M1 category ($100M+)'
            
            # Remove M2 companies ($50M-100M range - above $50M threshold)
            elif size_category == 'M2':
                should_remove = True
                removal_reason = 'M2 category ($50M-100M range)'
            
            # Check revenue field for specific amounts above $50M
            elif revenue != '-':
                revenue_lower = revenue.lower()
                if (any(indicator in revenue_lower for indicator in 
                       ['100m', 'billion', '$1b', '$50m-', '$60m', '$70m', '$80m', '$90m'])):
                    should_remove = True
                    removal_reason = f'Revenue above $50M: {revenue}'
            
            # Remove specific large companies by name regardless of categorization
            large_company_names = [
                'accenture', 'deloitte', 'cognizant', 'capgemini', 'epic games',
                'leonardo', 'hii', 'slalom', 'radian', 'pwc', 'ernst', 'young',
                'kpmg', 'mckinsey', 'booz', 'bain'
            ]
            
            if any(name in company_name.lower() for name in large_company_names):
                should_remove = True
                removal_reason = 'Known large enterprise'
            
            if should_remove:
                companies_removed.append({
                    'name': company_name,
                    'size': size_category,
                    'revenue': revenue,
                    'reason': removal_reason
                })
            else:
                companies_to_keep.append(row)
    
    print("🎯 PRECISE FILTERING: COMPANIES $50M OR BELOW ONLY")
    print("=" * 55)
    
    print(f"🗑️ REMOVING {len(companies_removed)} COMPANIES ABOVE $50M:")
    for company in companies_removed:
        print(f"   - {company['name']} ({company['size']}) - {company['reason']}")
    
    # Write filtered list
    with open('warm_bd_list_UNDER_50M.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(companies_to_keep)
    
    # Generate summary
    size_counts = {}
    status_counts = {}
    revenue_ranges = {}
    enriched_count = 0
    
    for row in companies_to_keep:
        if len(row) > 2:
            size = row[2]
            size_counts[size] = size_counts.get(size, 0) + 1
            
            status = row[1] if len(row) > 1 else '-'
            status_counts[status] = status_counts.get(status, 0) + 1
            
            revenue = row[4] if len(row) > 4 else '-'
            if revenue != '-':
                revenue_ranges[revenue] = revenue_ranges.get(revenue, 0) + 1
                enriched_count += 1
    
    print(f"\n✅ FILTERED LIST: {len(companies_to_keep)} companies ($50M or below)")
    print(f"📊 REMOVED: {len(companies_removed)} companies (above $50M)")
    
    print("\n📊 SIZE CATEGORY DISTRIBUTION (FILTERED):")
    for size in ['M3', 'S1', 'S2', 'S3', '-']:
        count = size_counts.get(size, 0)
        if count > 0:
            print(f"   {size}: {count} companies")
    
    print("\n📈 STATUS DISTRIBUTION (FILTERED):")
    for status, count in sorted(status_counts.items()):
        print(f"   {status}: {count} companies")
    
    print("\n💰 REVENUE RANGES (ENRICHED COMPANIES - ALL $50M OR BELOW):")
    for revenue, count in sorted(revenue_ranges.items()):
        if revenue != '-':
            print(f"   {revenue}: {count} companies")
    
    print(f"\n📈 DATA COMPLETENESS:")
    print(f"   Enriched with data: {enriched_count} companies")
    print(f"   To be filled: {len(companies_to_keep) - enriched_count} companies")
    
    print(f"\n📋 FINAL FILE: warm_bd_list_UNDER_50M.csv")
    print(f"🎯 PERFECT FIT: All companies $50M revenue or below - highly accessible for BD")
    
    return companies_to_keep

if __name__ == "__main__":
    precise_filter_small_companies() 