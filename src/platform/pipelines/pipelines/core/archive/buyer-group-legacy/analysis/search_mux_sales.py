#!/usr/bin/env python3
"""
Thorough search for Mux sales team members
"""

import json

def load_mux_employees():
    """Load the actual Mux employee data"""
    try:
        with open('mux_employees_exact.json', 'r') as f:
            employees = []
            for line in f:
                line = line.strip()
                if line:
                    try:
                        employee = json.loads(line)
                        employees.append(employee)
                    except json.JSONDecodeError:
                        continue
            return employees
    except FileNotFoundError:
        print("❌ mux_employees_exact.json not found")
        return []

def search_all_fields(employee, search_term):
    """Search all fields in employee data for a term"""
    search_term = search_term.lower()
    
    # Search in all string fields
    for key, value in employee.items():
        if isinstance(value, str) and search_term in value.lower():
            return True
        elif isinstance(value, dict):
            for sub_key, sub_value in value.items():
                if isinstance(sub_value, str) and search_term in sub_value.lower():
                    return True
        elif isinstance(value, list):
            for item in value:
                if isinstance(item, str) and search_term in item.lower():
                    return True
                elif isinstance(item, dict):
                    for sub_key, sub_value in item.items():
                        if isinstance(sub_value, str) and search_term in sub_value.lower():
                            return True
    
    return False

def find_sales_team():
    """Find any sales team members"""
    employees = load_mux_employees()
    
    print("🔍 THOROUGH SEARCH FOR MUX SALES TEAM")
    print("=" * 50)
    
    # Sales-related search terms
    sales_terms = [
        'sales', 'revenue', 'revops', 'salesforce', 'enablement',
        'account executive', 'ae', 'sdr', 'bdr', 'sales development',
        'business development', 'customer success', 'cs', 'account manager',
        'sales manager', 'sales director', 'vp sales', 'head of sales',
        'sales operations', 'sales ops', 'sales enablement'
    ]
    
    found_sales = []
    
    for employee in employees:
        name = employee.get('name', '')
        title = employee.get('position', '') or employee.get('title', '')
        
        # Check if any sales term appears anywhere in the employee data
        for term in sales_terms:
            if search_all_fields(employee, term):
                found_sales.append({
                    'employee': employee,
                    'matched_term': term
                })
                break
    
    if found_sales:
        print(f"✅ Found {len(found_sales)} potential sales team members:")
        print()
        
        for i, item in enumerate(found_sales, 1):
            employee = item['employee']
            name = employee.get('name', 'Unknown')
            title = employee.get('position', '') or employee.get('title', '')
            location = employee.get('location', 'Unknown')
            connections = employee.get('connections', 0) or 0
            followers = employee.get('followers', 0) or 0
            matched_term = item['matched_term']
            
            print(f"{i:2d}. {name}")
            print(f"    Title: {title}")
            print(f"    Location: {location}")
            print(f"    Matched Term: '{matched_term}'")
            print(f"    Network: {connections} connections, {followers} followers")
            print(f"    LinkedIn: {employee.get('url', 'N/A')}")
            print()
    else:
        print("❌ No sales team members found")
    
    # Also check for any titles that might be sales-related but not obvious
    print("\n🔍 CHECKING ALL EMPLOYEE TITLES")
    print("-" * 30)
    
    all_titles = []
    for employee in employees:
        title = employee.get('position', '') or employee.get('title', '')
        if title:
            all_titles.append((employee.get('name', 'Unknown'), title))
    
    # Sort by title to see patterns
    all_titles.sort(key=lambda x: x[1].lower())
    
    print("All employee titles:")
    for name, title in all_titles:
        print(f"  {name}: {title}")
    
    # Check company size and structure
    print(f"\n📊 COMPANY STRUCTURE ANALYSIS")
    print(f"Total Employees: {len(employees)}")
    
    # Count by department/role type
    role_counts = {}
    for employee in employees:
        title = (employee.get('position', '') or employee.get('title', '')).lower()
        
        if any(keyword in title for keyword in ['engineer', 'developer', 'software']):
            role_counts['Engineering'] = role_counts.get('Engineering', 0) + 1
        elif any(keyword in title for keyword in ['product', 'pm']):
            role_counts['Product'] = role_counts.get('Product', 0) + 1
        elif any(keyword in title for keyword in ['marketing', 'creative', 'brand']):
            role_counts['Marketing'] = role_counts.get('Marketing', 0) + 1
        elif any(keyword in title for keyword in ['sales', 'revenue', 'account']):
            role_counts['Sales'] = role_counts.get('Sales', 0) + 1
        elif any(keyword in title for keyword in ['operations', 'ops']):
            role_counts['Operations'] = role_counts.get('Operations', 0) + 1
        elif any(keyword in title for keyword in ['ceo', 'cto', 'cfo', 'president', 'chief']):
            role_counts['Executive'] = role_counts.get('Executive', 0) + 1
        else:
            role_counts['Other'] = role_counts.get('Other', 0) + 1
    
    print("Department breakdown:")
    for dept, count in sorted(role_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {dept}: {count} employees")

if __name__ == "__main__":
    find_sales_team() 