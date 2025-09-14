#!/usr/bin/env python3
import csv
from collections import Counter

def categorize_dan_companies():
    """
    Categorize Dan's existing companies with L1-M3 size classifications
    """
    
    # Company size categorizations based on revenue and employee count
    company_categories = {
        # L1 - Largest Companies ($25B+ revenue)
        'Microsoft': 'L1',
        'IBM': 'L1', 
        'Adobe': 'L1',
        'Cisco': 'L1',
        'Cisco Systems': 'L1',
        
        # L2 - Large Companies ($1B-25B revenue)
        'Snowflake': 'L2',
        'Workday': 'L2',
        'Atlassian': 'L2',
        'Zoom': 'L2',
        'Splunk': 'L2',
        'Okta': 'L2',
        'Zendesk': 'L2',
        'DocuSign': 'L2',
        'Twilio': 'L2',
        'Box': 'L2',
        'Cloudflare': 'L2',
        'NetSuite': 'L2',
        'UIPath': 'L2',
        'UiPath': 'L2',
        'UI Path': 'L2',
        
        # L3 - Mid-Large Companies ($500M-1B revenue)
        'DataDog': 'L3',
        'Alteryx': 'L3',
        'HashiCorp': 'L3',
        'GitLab': 'L3',
        'Confluent': 'L3',
        'Anaplan': 'L3',
        'Anaplan Planful': 'L3',
        'Coupa': 'L3',
        'Procore Technologies': 'L3',
        'ServiceTitan': 'L3',
        'Brex': 'L3',
        
        # M1 - Medium Companies ($100M-500M revenue)
        'Smartsheet': 'M1',
        'Gainsight': 'M1',
        'Airtable': 'M1',
        'Asana': 'M1',
        'Domo': 'M1',
        'Greenhouse': 'M1',
        'Greenhouse Software': 'M1',
        'Braze': 'M1',
        'Miro': 'M1',
        'Segment': 'M1',
        'Segment, now Salesforce': 'M1',
        'Rippling': 'M1',
        'Talkdesk': 'M1',
        'Amplitude': 'M1',
        'Iterable': 'M1',
        'Wix': 'M1',
        'BetterUp': 'M1',
        'Absorb Software': 'M1',
        
        # M2 - Small-Medium Companies ($50M-100M revenue)
        'Gusto': 'M2',
        'Lattice': 'M2',
        'Mixpanel': 'M2',
        'Snyk': 'M2',
        'HG Insights': 'M2',
        'Lucid': 'M2',
        'Finally': 'M2',
        'Carta': 'M2',
        'Guru': 'M2',
        'Payscale': 'M2',
        'Enverus': 'M2',
        
        # M3 - Small Companies ($10M-50M revenue)
        'Chili Piper': 'M3',
        'LeadIQ': 'M3',
        'CloudCaddie Consulting': 'M3',
        'Qodo': 'M3',
        'Otelier': 'M3',
        'Saleo': 'M3',
        'Courtesy Connection': 'M3',
        'Sales Assembly': 'M3',
        'Carabiner Group': 'M3',
        'Statsig': 'M3',
        'Lennox Academy': 'M3',
        'Intellistack': 'M3',
        'Rentvine': 'M3',
        'ChiroHD': 'M3',
        'Prediction Health': 'M3',
        'Champion': 'M3',
        'Unknown Company': 'M3'  # Assuming small
    }
    
    # Read Dan's companies
    dan_companies = []
    with open('dan-existing-companies.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            if row and row[0].strip():
                dan_companies.append(row[0].strip())
    
    # Categorize companies
    categorized_companies = []
    uncategorized = []
    
    for company in dan_companies:
        if company in company_categories:
            category = company_categories[company]
            categorized_companies.append([company, category])
        else:
            # Try to match partial names
            found = False
            for known_company, category in company_categories.items():
                if known_company.lower() in company.lower() or company.lower() in known_company.lower():
                    categorized_companies.append([company, category])
                    found = True
                    break
            if not found:
                uncategorized.append(company)
                categorized_companies.append([company, 'Unknown'])
    
    # Write categorized list
    with open('dan_companies_categorized.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Company Name', 'Size Category'])
        writer.writerows(categorized_companies)
    
    # Count distributions
    dan_distribution = Counter([cat[1] for cat in categorized_companies if cat[1] != 'Unknown'])
    
    print("🎯 DAN'S COMPANY SIZE DISTRIBUTION")
    print("=" * 50)
    
    print(f"📊 DAN'S COMPANIES BY SIZE CATEGORY:")
    total_categorized = sum(dan_distribution.values())
    for category in ['L1', 'L2', 'L3', 'M1', 'M2', 'M3']:
        count = dan_distribution.get(category, 0)
        percentage = (count / total_categorized * 100) if total_categorized > 0 else 0
        print(f"   {category}: {count} companies ({percentage:.1f}%)")
    
    print(f"\n📋 TOTAL CATEGORIZED: {total_categorized} companies")
    print(f"❓ UNCATEGORIZED: {len(uncategorized)} companies")
    
    if uncategorized:
        print(f"\n❓ UNCATEGORIZED COMPANIES:")
        for company in uncategorized:
            print(f"   - {company}")
    
    # Compare to 360 list distribution
    print(f"\n🔄 COMPARISON: DAN'S LIST vs NEW 360 LIST")
    print("=" * 55)
    
    # 360 list distribution (from our previous analysis)
    new_360_distribution = {
        'L1': 31, 'L2': 45, 'L3': 72, 
        'M1': 74, 'M2': 104, 'M3': 34
    }
    total_360 = sum(new_360_distribution.values())
    
    print(f"{'Category':<8} {'Dan Count':<10} {'Dan %':<8} {'360 Count':<10} {'360 %':<8} {'Difference'}")
    print("-" * 55)
    
    for category in ['L1', 'L2', 'L3', 'M1', 'M2', 'M3']:
        dan_count = dan_distribution.get(category, 0)
        dan_pct = (dan_count / total_categorized * 100) if total_categorized > 0 else 0
        new_count = new_360_distribution[category]
        new_pct = (new_count / total_360 * 100)
        diff = new_pct - dan_pct
        
        print(f"{category:<8} {dan_count:<10} {dan_pct:<7.1f}% {new_count:<10} {new_pct:<7.1f}% {diff:+.1f}%")
    
    print(f"\n📈 KEY INSIGHTS:")
    
    # Calculate focus areas
    dan_large = dan_distribution.get('L1', 0) + dan_distribution.get('L2', 0) + dan_distribution.get('L3', 0)
    dan_medium = dan_distribution.get('M1', 0) + dan_distribution.get('M2', 0) + dan_distribution.get('M3', 0)
    dan_large_pct = (dan_large / total_categorized * 100) if total_categorized > 0 else 0
    dan_medium_pct = (dan_medium / total_categorized * 100) if total_categorized > 0 else 0
    
    new_large = new_360_distribution['L1'] + new_360_distribution['L2'] + new_360_distribution['L3']
    new_medium = new_360_distribution['M1'] + new_360_distribution['M2'] + new_360_distribution['M3']
    new_large_pct = (new_large / total_360 * 100)
    new_medium_pct = (new_medium / total_360 * 100)
    
    print(f"   Dan's Large Companies (L1-L3): {dan_large} ({dan_large_pct:.1f}%)")
    print(f"   New 360 Large Companies (L1-L3): {new_large} ({new_large_pct:.1f}%)")
    print(f"   Dan's Medium Companies (M1-M3): {dan_medium} ({dan_medium_pct:.1f}%)")
    print(f"   New 360 Medium Companies (M1-M3): {new_medium} ({new_medium_pct:.1f}%)")
    
    print(f"\n💡 STRATEGIC IMPLICATIONS:")
    if dan_large_pct > new_large_pct:
        print(f"   • Dan focuses MORE on large enterprises ({dan_large_pct:.1f}% vs {new_large_pct:.1f}%)")
        print(f"   • New 360 list provides MORE mid-market diversity")
    else:
        print(f"   • New 360 list has MORE large enterprise coverage")
        print(f"   • Dan has MORE mid-market focus currently")
    
    print(f"\n📋 SAVED FILE: dan_companies_categorized.csv")
    
    return categorized_companies, dan_distribution

if __name__ == "__main__":
    categorize_dan_companies() 