#!/usr/bin/env python3
import csv
from collections import defaultdict

def detailed_dan_analysis():
    """
    Show detailed breakdown of Dan's companies by category
    """
    
    # Read the categorized companies
    categorized_companies = defaultdict(list)
    
    with open('dan_companies_categorized.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            if len(row) >= 2:
                company = row[0]
                category = row[1]
                categorized_companies[category].append(company)
    
    print("🎯 DAN'S DETAILED COMPANY BREAKDOWN BY SIZE")
    print("=" * 60)
    
    # Category descriptions
    category_info = {
        'L1': ('Largest Enterprises', '$25B+ revenue', 'Global tech giants'),
        'L2': ('Large Enterprises', '$1B-25B revenue', 'Major SaaS/Cloud companies'),
        'L3': ('Mid-Large Enterprises', '$500M-1B revenue', 'Established growth companies'),
        'M1': ('Medium Companies', '$100M-500M revenue', 'Scale-up SaaS companies'),
        'M2': ('Small-Medium Companies', '$50M-100M revenue', 'Growth-stage companies'),
        'M3': ('Small Companies', '$10M-50M revenue', 'Early-stage/niche companies')
    }
    
    for category in ['L1', 'L2', 'L3', 'M1', 'M2', 'M3']:
        companies = categorized_companies.get(category, [])
        if companies:
            desc, revenue, stage = category_info[category]
            print(f"\n🏢 {category} - {desc} ({revenue})")
            print(f"   Stage: {stage}")
            print(f"   Count: {len(companies)} companies")
            print(f"   Companies:")
            for i, company in enumerate(sorted(companies), 1):
                print(f"     {i:2d}. {company}")
    
    # Summary comparison table
    print(f"\n📊 DISTRIBUTION COMPARISON SUMMARY")
    print("=" * 70)
    
    dan_totals = {cat: len(companies) for cat, companies in categorized_companies.items() if cat != 'Unknown'}
    total_dan = sum(dan_totals.values())
    
    # 360 list distribution
    new_360_distribution = {
        'L1': 31, 'L2': 45, 'L3': 72, 
        'M1': 74, 'M2': 104, 'M3': 34
    }
    total_360 = sum(new_360_distribution.values())
    
    print(f"{'Category':<8} {'Description':<25} {'Dan':<8} {'360 List':<8} {'Gap':<8}")
    print("-" * 70)
    
    for category in ['L1', 'L2', 'L3', 'M1', 'M2', 'M3']:
        desc, _, _ = category_info[category]
        dan_count = dan_totals.get(category, 0)
        new_count = new_360_distribution[category]
        gap = new_count - dan_count
        
        print(f"{category:<8} {desc[:24]:<25} {dan_count:<8} {new_count:<8} {gap:+d}")
    
    print(f"\n🎯 KEY STRATEGIC INSIGHTS:")
    
    # Calculate enterprise vs mid-market focus
    dan_enterprise = dan_totals.get('L1', 0) + dan_totals.get('L2', 0) + dan_totals.get('L3', 0)
    dan_midmarket = dan_totals.get('M1', 0) + dan_totals.get('M2', 0) + dan_totals.get('M3', 0)
    
    new_enterprise = new_360_distribution['L1'] + new_360_distribution['L2'] + new_360_distribution['L3']
    new_midmarket = new_360_distribution['M1'] + new_360_distribution['M2'] + new_360_distribution['M3']
    
    print(f"\n📈 ENTERPRISE vs MID-MARKET FOCUS:")
    print(f"   Dan's Current Split:")
    print(f"     Enterprise (L1-L3): {dan_enterprise} companies ({dan_enterprise/total_dan*100:.1f}%)")
    print(f"     Mid-Market (M1-M3): {dan_midmarket} companies ({dan_midmarket/total_dan*100:.1f}%)")
    print(f"   \n   New 360 List Split:")
    print(f"     Enterprise (L1-L3): {new_enterprise} companies ({new_enterprise/total_360*100:.1f}%)")
    print(f"     Mid-Market (M1-M3): {new_midmarket} companies ({new_midmarket/total_360*100:.1f}%)")
    
    print(f"\n🔍 BIGGEST OPPORTUNITIES (Categories with Largest Gaps):")
    gaps = []
    for category in ['L1', 'L2', 'L3', 'M1', 'M2', 'M3']:
        dan_count = dan_totals.get(category, 0)
        new_count = new_360_distribution[category]
        gap = new_count - dan_count
        gaps.append((category, gap, category_info[category][0]))
    
    # Sort by largest positive gaps
    gaps.sort(key=lambda x: x[1], reverse=True)
    
    for i, (category, gap, desc) in enumerate(gaps[:3], 1):
        if gap > 0:
            print(f"   {i}. {category} ({desc}): +{gap} more companies")
            print(f"      → Opportunity to expand into this segment")
    
    print(f"\n💡 RECOMMENDATIONS:")
    
    # Check for M2 opportunity
    m2_gap = new_360_distribution['M2'] - dan_totals.get('M2', 0)
    if m2_gap > 50:
        print(f"   🎯 PRIORITY: Massive M2 opportunity (+{m2_gap} companies)")
        print(f"      M2 companies ($50M-100M) are the sweet spot for complex B2B sales")
    
    # Check for balance
    if dan_enterprise/total_dan > 0.45:
        print(f"   ⚖️ BALANCE: Consider more mid-market diversity")
        print(f"      Current enterprise focus may limit pipeline volume")
    
    print(f"\n📋 FILES CREATED:")
    print(f"   • dan_companies_categorized.csv - Full categorized list")
    print(f"   • This analysis shows expansion opportunities by size category")

if __name__ == "__main__":
    detailed_dan_analysis() 