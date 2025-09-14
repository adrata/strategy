#!/usr/bin/env python3
"""
Filter out false positives to find actual Mux sales team members
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

def is_real_sales_role(employee):
    """Check if employee has a real sales role"""
    title = (employee.get('position', '') or employee.get('title', '')).lower()
    name = employee.get('name', '').lower()
    
    # Real sales role keywords
    sales_keywords = [
        'account executive', 'sales executive', 'sales manager', 'sales director',
        'business development', 'sales development', 'customer success',
        'sales operations', 'sales enablement', 'revenue operations', 'revops',
        'account manager', 'sales representative', 'sales specialist',
        'vp sales', 'head of sales', 'chief revenue officer', 'cro'
    ]
    
    # Check if title contains real sales keywords
    for keyword in sales_keywords:
        if keyword in title:
            return True
    
    # Check for specific patterns that indicate sales roles
    if any(term in title for term in ['sales', 'revenue', 'account']) and any(term in title for term in ['executive', 'manager', 'director', 'representative', 'specialist']):
        return True
    
    return False

def find_real_sales_team():
    """Find actual sales team members"""
    employees = load_mux_employees()
    
    print("🎯 FINDING REAL MUX SALES TEAM MEMBERS")
    print("=" * 50)
    
    real_sales = []
    
    for employee in employees:
        if is_real_sales_role(employee):
            real_sales.append(employee)
    
    if real_sales:
        print(f"✅ Found {len(real_sales)} actual sales team members:")
        print()
        
        for i, employee in enumerate(real_sales, 1):
            name = employee.get('name', 'Unknown')
            title = employee.get('position', '') or employee.get('title', '')
            location = employee.get('location', 'Unknown')
            connections = employee.get('connections', 0) or 0
            followers = employee.get('followers', 0) or 0
            
            print(f"{i:2d}. {name}")
            print(f"    Title: {title}")
            print(f"    Location: {location}")
            print(f"    Network: {connections} connections, {followers} followers")
            print(f"    LinkedIn: {employee.get('url', 'N/A')}")
            print()
    else:
        print("❌ No actual sales team members found")
        
        # Show what we found instead
        print("\n🔍 WHAT WE FOUND INSTEAD:")
        print("-" * 30)
        
        # Show employees with "sales" in their data but not in title
        sales_mentions = []
        for employee in employees:
            title = (employee.get('position', '') or employee.get('title', '')).lower()
            if 'sales' not in title:  # Not in title
                # Check if "sales" appears elsewhere in their data
                employee_str = json.dumps(employee).lower()
                if 'sales' in employee_str:
                    sales_mentions.append(employee)
        
        if sales_mentions:
            print(f"Found {len(sales_mentions)} employees with 'sales' mentions but not in title:")
            for i, employee in enumerate(sales_mentions[:10], 1):  # Show first 10
                name = employee.get('name', 'Unknown')
                title = employee.get('position', '') or employee.get('title', '')
                print(f"  {i}. {name} - {title}")
        else:
            print("No 'sales' mentions found anywhere in employee data")
    
    # Check company structure
    print(f"\n📊 MUX COMPANY STRUCTURE")
    print(f"Total Employees: {len(employees)}")
    
    # Count by actual roles
    role_counts = {}
    for employee in employees:
        title = (employee.get('position', '') or employee.get('title', '')).lower()
        
        if is_real_sales_role(employee):
            role_counts['Sales'] = role_counts.get('Sales', 0) + 1
        elif any(keyword in title for keyword in ['engineer', 'developer', 'software']):
            role_counts['Engineering'] = role_counts.get('Engineering', 0) + 1
        elif any(keyword in title for keyword in ['product', 'pm']):
            role_counts['Product'] = role_counts.get('Product', 0) + 1
        elif any(keyword in title for keyword in ['marketing', 'creative', 'brand']):
            role_counts['Marketing'] = role_counts.get('Marketing', 0) + 1
        elif any(keyword in title for keyword in ['ceo', 'cto', 'cfo', 'president', 'chief']):
            role_counts['Executive'] = role_counts.get('Executive', 0) + 1
        elif any(keyword in title for keyword in ['support', 'customer success', 'solutions']):
            role_counts['Customer Success'] = role_counts.get('Customer Success', 0) + 1
        else:
            role_counts['Other/Unknown'] = role_counts.get('Other/Unknown', 0) + 1
    
    print("Department breakdown:")
    for dept, count in sorted(role_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {dept}: {count} employees")
    
    # Check if this is a product-led company
    print(f"\n🤔 COMPANY TYPE ANALYSIS")
    if role_counts.get('Sales', 0) == 0:
        print("❌ NO DEDICATED SALES TEAM FOUND")
        print("This appears to be a product-led company where:")
        print("- Sales might be handled by founders/executives")
        print("- Product team handles customer relationships")
        print("- Marketing team drives growth")
        print("- Customer success handles post-sale")
        
        # Look for revenue-related roles
        revenue_roles = []
        for employee in employees:
            title = (employee.get('position', '') or employee.get('title', '')).lower()
            if any(keyword in title for keyword in ['revenue', 'growth', 'business development']):
                revenue_roles.append(employee)
        
        if revenue_roles:
            print(f"\nFound {len(revenue_roles)} revenue/growth related roles:")
            for employee in revenue_roles:
                name = employee.get('name', 'Unknown')
                title = employee.get('position', '') or employee.get('title', '')
                print(f"  - {name}: {title}")

if __name__ == "__main__":
    find_real_sales_team() 