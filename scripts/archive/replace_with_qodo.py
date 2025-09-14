#!/usr/bin/env python3
import csv

def replace_with_qodo():
    """
    Replace one company with Qodo to maintain exactly 360 companies
    """
    
    # Read current list (which now has 361 including Qodo)
    companies = []
    with open('company_data_360_FINAL_B2B.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        companies = list(reader)
    
    print("🔄 MAINTAINING EXACTLY 360 COMPANIES")
    print("=" * 50)
    
    # Find Qodo in the list
    qodo_index = -1
    for i, company in enumerate(companies):
        if len(company) > 1 and 'Qodo' in company[1]:
            qodo_index = i
            break
    
    if qodo_index == -1:
        print("❌ Qodo not found in list")
        return
    
    print(f"✅ Found Qodo at position {qodo_index + 1}")
    
    # Remove Qodo temporarily
    qodo_data = companies.pop(qodo_index)
    
    # Find a company to replace (let's replace the last company that's not Qodo)
    # We'll replace Workiva since it was our previous addition
    company_to_replace = None
    replace_index = -1
    
    for i, company in enumerate(companies):
        if len(company) > 1 and 'Workiva' in company[1]:
            company_to_replace = company[1]
            replace_index = i
            break
    
    if replace_index == -1:
        # If Workiva not found, replace the last company
        replace_index = len(companies) - 1
        company_to_replace = companies[replace_index][1]
    
    # Replace the selected company with Qodo
    companies[replace_index] = qodo_data
    
    print(f"🔄 REPLACEMENT MADE:")
    print(f"   Removed: {company_to_replace}")
    print(f"   Added: {qodo_data[1]}")
    print(f"   Position: {replace_index + 1}")
    
    # Write the corrected list
    with open('company_data_360_FINAL_B2B.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(companies)
    
    print(f"\n✅ FINAL COUNT: {len(companies)} companies")
    print(f"📊 QODO SUCCESSFULLY ADDED TO 360 LIST")
    
    # Show Qodo details
    print(f"\n🎯 QODO DETAILS:")
    print(f"   Company: {qodo_data[1]}")
    print(f"   Category: {qodo_data[0]} ({qodo_data[4]})")
    print(f"   Employees: {qodo_data[3]}")
    print(f"   Industry: {qodo_data[5]}")
    print(f"   Website: {qodo_data[6]}")
    print(f"   Complex B2B Sales: AI platform for enterprise dev teams")
    
    return companies

if __name__ == "__main__":
    replace_with_qodo() 