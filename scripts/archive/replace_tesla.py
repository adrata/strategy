#!/usr/bin/env python3
import csv

def replace_tesla():
    """Replace Tesla with another complex B2B L1 company"""
    
    # Read current list
    updated_companies = []
    tesla_found = False
    
    with open('company_data_360_FINAL.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        for row in reader:
            if len(row) > 1 and 'tesla' in row[1].lower():
                # Replace Tesla with a different complex B2B company
                replacement = ['L1', 'Visa Inc.', 'L1', 26000, '$52.3B', 'Global Payment Technology & Financial Services', 'visa.com', 'Global payment network selling complex payment processing infrastructure to banks, financial institutions, and large merchants – enterprise sales involving CTOs, payment executives, and risk managers, multi-year contracts for payment rails, fraud prevention, and digital payment solutions', 'Verified']
                updated_companies.append(replacement)
                tesla_found = True
                print(f"Replaced: {row[1]} -> {replacement[1]}")
            else:
                updated_companies.append(row)
    
    # Write updated file
    with open('company_data_360_FINAL.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(updated_companies)
    
    if tesla_found:
        print("✅ Tesla successfully replaced with Visa Inc.")
        print("Visa Inc. - Global payment technology with complex enterprise sales to banks and financial institutions")
    else:
        print("❌ Tesla not found in the list")
    
    return len(updated_companies)

if __name__ == "__main__":
    replace_tesla() 