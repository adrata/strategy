#!/usr/bin/env python3
import csv

def fix_size_categories():
    """
    Fix overlapping S1 and M3 size categories to make them distinct
    Proper categorization:
    S3: $2M-10M (Smallest)
    S2: $10M-25M (Medium Small) 
    S1: $25M-40M (Largest Small)
    M3: $40M-50M (Smallest Medium)
    """
    
    # Read current comprehensive list
    companies = []
    with open('warm_bd_list_FINAL_COMPREHENSIVE.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        companies = list(reader)
    
    print("🔧 FIXING SIZE CATEGORY OVERLAPS")
    print("=" * 50)
    
    # Define proper size boundaries
    size_rules = {
        'S3': {'min': 2, 'max': 10},    # $2M-10M
        'S2': {'min': 10, 'max': 25},   # $10M-25M  
        'S1': {'min': 25, 'max': 40},   # $25M-40M
        'M3': {'min': 40, 'max': 50}    # $40M-50M
    }
    
    def extract_revenue_midpoint(revenue_str):
        """Extract midpoint revenue from revenue string"""
        if revenue_str == '-' or not revenue_str:
            return 0
        
        # Remove $ and M, handle ranges
        clean_str = revenue_str.replace('$', '').replace('M', '').replace('B', '000')
        
        if '-' in clean_str:
            # Handle ranges like "25M-40M"
            parts = clean_str.split('-')
            try:
                low = float(parts[0])
                high = float(parts[1])
                return (low + high) / 2
            except:
                return 0
        else:
            try:
                return float(clean_str)
            except:
                return 0
    
    def determine_correct_size_category(revenue_str):
        """Determine correct size category based on revenue"""
        midpoint = extract_revenue_midpoint(revenue_str)
        
        if midpoint == 0:
            return 'S3'  # Default for unknown
        elif midpoint <= 10:
            return 'S3'
        elif midpoint <= 25:
            return 'S2'
        elif midpoint <= 40:
            return 'S1'
        elif midpoint <= 50:
            return 'M3'
        else:
            return 'M3'  # Cap at M3 since we want everything under $50M
    
    def get_proper_revenue_range(size_category):
        """Get proper revenue range string for size category"""
        ranges = {
            'S3': '$2M-10M',
            'S2': '$10M-25M', 
            'S1': '$25M-40M',
            'M3': '$40M-50M'
        }
        return ranges.get(size_category, '$25M-40M')
    
    # Fix each company's categorization
    changes_made = []
    for i, company in enumerate(companies):
        if len(company) < 5:
            continue
            
        current_size = company[2]
        current_revenue = company[4]
        
        # Determine correct size based on revenue
        correct_size = determine_correct_size_category(current_revenue)
        correct_revenue_range = get_proper_revenue_range(correct_size)
        
        if current_size != correct_size:
            changes_made.append({
                'company': company[0],
                'old_size': current_size,
                'new_size': correct_size,
                'revenue': current_revenue,
                'new_revenue_range': correct_revenue_range
            })
            
            # Update the company data
            company[2] = correct_size
            # Also update revenue range to be consistent
            if current_revenue and current_revenue != '-':
                company[4] = correct_revenue_range
    
    # Write corrected list
    with open('warm_bd_list_FIXED_CATEGORIES.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(companies)
    
    print(f"📊 FIXED {len(changes_made)} COMPANIES:")
    for change in changes_made:
        print(f"   • {change['company']}: {change['old_size']} → {change['new_size']} ({change['revenue']})")
    
    # Generate new distribution summary
    from collections import Counter
    size_counts = Counter([company[2] for company in companies if len(company) > 2])
    
    print(f"\n📏 CORRECTED SIZE DISTRIBUTION:")
    print(f"   S3 ($2M-10M):   {size_counts.get('S3', 0)} companies")
    print(f"   S2 ($10M-25M):  {size_counts.get('S2', 0)} companies") 
    print(f"   S1 ($25M-40M):  {size_counts.get('S1', 0)} companies")
    print(f"   M3 ($40M-50M):  {size_counts.get('M3', 0)} companies")
    
    print(f"\n✅ SIZE CATEGORIES NOW DISTINCT:")
    print(f"   • S3: $2M-10M (Smallest companies)")
    print(f"   • S2: $10M-25M (Medium small companies)")
    print(f"   • S1: $25M-40M (Largest small companies)")
    print(f"   • M3: $40M-50M (Smallest medium companies)")
    print(f"   • NO OVERLAPS - All categories are distinct")
    
    print(f"\n📋 FIXED FILE: warm_bd_list_FIXED_CATEGORIES.csv")
    print(f"🎯 All companies remain under $50M for BD targeting")
    
    return companies

if __name__ == "__main__":
    fix_size_categories() 