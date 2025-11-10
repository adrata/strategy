import csv
from collections import Counter

# Read the main file
companies = set()
people = []
company_only_entries = []

with open('final_top - Sheet1.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = row.get('Name', '').strip()
        company = row.get('Company', '').strip()
        
        if company:
            companies.add(company)
        
        # Check if this is a person or a company entry
        # If Name == Company, it's likely a company-only entry
        # If Name != Company and Name looks like a person name, it's a person
        if name and company:
            if name == company:
                company_only_entries.append(company)
            else:
                # Check if name looks like a person (has first and last name, or doesn't contain company keywords)
                company_keywords = ['inc', 'co', 'corp', 'llc', 'association', 'company', 'district', 
                                  'authority', 'cooperative', 'power', 'electric', 'utility', 
                                  'administration', 'council', 'agency']
                name_lower = name.lower()
                if not any(keyword in name_lower for keyword in company_keywords):
                    people.append({'name': name, 'company': company})

print(f"Total unique companies: {len(companies)}")
print(f"Total people: {len(people)}")
print(f"Company-only entries (no people): {len(company_only_entries)}")
print(f"\nTotal rows in file: {len(people) + len(company_only_entries)}")

