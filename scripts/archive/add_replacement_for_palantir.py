#!/usr/bin/env python3
import csv

def add_replacement_company():
    """
    Add one replacement company to maintain exactly 360 companies after removing Palantir
    """
    
    # Read current companies
    companies = []
    with open('company_data_360_FINAL_B2B.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        companies = list(reader)
    
    # Replacement company (L1 category to replace Palantir)
    replacement_company = [
        'L1', 'Workiva Inc.', 'L1', 2800, '$600M', 'Cloud Financial Reporting & Compliance Software', 'workiva.com',
        'Cloud platform for financial reporting and regulatory compliance – complex enterprise sales to CFOs, compliance officers, and IT teams (CFO, Chief Accounting Officer, compliance heads), multi-year contracts for SOX compliance, ESG reporting, and financial consolidation with extensive implementation services',
        'Verified'
    ]
    
    # Add the replacement company
    companies.append(replacement_company)
    
    # Write updated list
    with open('company_data_360_FINAL_B2B.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(companies)
    
    print("✅ PALANTIR REPLACEMENT COMPLETED")
    print("=" * 40)
    print(f"🗑️ REMOVED: Palantir Technologies Inc.")
    print(f"➕ ADDED: {replacement_company[1]} ({replacement_company[2]})")
    print(f"📊 TOTAL COMPANIES: {len(companies)}")
    print(f"📋 Industry: {replacement_company[5]}")
    print(f"💰 Revenue: {replacement_company[4]}")
    print(f"🎯 Complex B2B: Financial compliance software with multi-stakeholder sales")
    
    return companies

if __name__ == "__main__":
    add_replacement_company() 