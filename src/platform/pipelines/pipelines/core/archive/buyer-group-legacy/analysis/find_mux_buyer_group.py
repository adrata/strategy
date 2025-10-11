#!/usr/bin/env python3
"""
Find Real Mux Buyer Group for Buyer Group Intelligence Platform
"""

import json
import re

def load_mux_employees():
    """Load the actual Mux employee data"""
    try:
        with open('mux_employees_exact.json', 'r') as f:
            # Read line by line since it's a JSONL file
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

def extract_title(employee):
    """Extract title from employee data"""
    # Try different title fields
    title = employee.get('position') or employee.get('title') or ''
    
    # If no title, try to extract from current_company
    if not title and employee.get('current_company'):
        title = employee.get('current_company', {}).get('title', '')
    
    return title

def categorize_employee(employee):
    """Categorize employee based on title and role"""
    title = extract_title(employee).lower()
    name = employee.get('name', '')
    
    # Sales Operations & Sales Leadership
    if any(keyword in title for keyword in ['sales', 'revenue', 'revops', 'salesforce']):
        if any(keyword in title for keyword in ['vp', 'director', 'head', 'lead', 'manager']):
            return 'Sales Leadership'
        elif any(keyword in title for keyword in ['operations', 'ops', 'enablement']):
            return 'Sales Operations'
        else:
            return 'Sales Team'
    
    # Product Team (customer intelligence focus)
    elif any(keyword in title for keyword in ['product', 'pm', 'customer']):
        return 'Product Team'
    
    # Marketing Team
    elif any(keyword in title for keyword in ['marketing', 'brand', 'creative', 'content']):
        return 'Marketing Team'
    
    # Engineering Team
    elif any(keyword in title for keyword in ['engineer', 'developer', 'technical', 'software']):
        return 'Engineering Team'
    
    # Operations Team
    elif any(keyword in title for keyword in ['operations', 'ops', 'process']):
        return 'Operations Team'
    
    # Executive Team
    elif any(keyword in title for keyword in ['ceo', 'cto', 'cfo', 'president', 'chief']):
        return 'Executive Team'
    
    # Default based on connections/followers
    else:
        connections = employee.get('connections', 0) or 0
        followers = employee.get('followers', 0) or 0
        
        if connections > 400 or followers > 500:
            return 'Senior Role'  # Likely senior position
        else:
            return 'Individual Contributor'

def analyze_buyer_group():
    """Analyze the actual Mux buyer group"""
    employees = load_mux_employees()
    
    if not employees:
        print("❌ No employee data found")
        return
    
    print(f"🎯 MUX BUYER GROUP ANALYSIS")
    print(f"Total Employees: {len(employees)}")
    print("=" * 60)
    
    # Categorize employees
    categories = {}
    for employee in employees:
        category = categorize_employee(employee)
        if category not in categories:
            categories[category] = []
        categories[category].append(employee)
    
    # Focus on Sales Operations & Sales Leadership
    print("\n🏆 PRIMARY BUYER GROUP: Sales Operations & Sales Leadership")
    print("-" * 50)
    
    sales_leadership = categories.get('Sales Leadership', [])
    sales_operations = categories.get('Sales Operations', [])
    sales_team = categories.get('Sales Team', [])
    
    # Combine all sales-related roles
    all_sales = sales_leadership + sales_operations + sales_team
    
    if all_sales:
        print(f"Found {len(all_sales)} sales-related employees:")
        
        for i, employee in enumerate(all_sales, 1):
            name = employee.get('name', 'Unknown')
            title = extract_title(employee)
            connections = employee.get('connections', 0) or 0
            followers = employee.get('followers', 0) or 0
            location = employee.get('location', 'Unknown')
            
            # Determine decision power based on title and network
            decision_power = 0.2  # Base
            if any(keyword in title.lower() for keyword in ['vp', 'director', 'head', 'lead']):
                decision_power = 0.4
            elif any(keyword in title.lower() for keyword in ['manager']):
                decision_power = 0.3
            elif connections > 400 or followers > 500:
                decision_power = 0.25
            
            print(f"{i:2d}. {name}")
            print(f"    Title: {title}")
            print(f"    Location: {location}")
            print(f"    Connections: {connections}, Followers: {followers}")
            print(f"    Decision Power: {decision_power:.2f}")
            print(f"    LinkedIn: {employee.get('url', 'N/A')}")
            print()
    else:
        print("❌ No sales-related employees found in current data")
    
    # Show other categories for context
    print("\n📊 OTHER TEAMS (For Context)")
    print("-" * 30)
    
    for category, team_employees in categories.items():
        if category not in ['Sales Leadership', 'Sales Operations', 'Sales Team']:
            print(f"{category}: {len(team_employees)} employees")
            
            # Show top 3 from each team
            for i, employee in enumerate(team_employees[:3], 1):
                name = employee.get('name', 'Unknown')
                title = extract_title(employee)
                print(f"  {i}. {name} - {title}")
            print()

def find_specific_roles():
    """Find employees with specific roles relevant to buyer group intelligence"""
    employees = load_mux_employees()
    
    print("\n🎯 SPECIFIC ROLES FOR BUYER GROUP INTELLIGENCE")
    print("=" * 60)
    
    # Keywords that indicate sales operations, enablement, or tool decisions
    sales_keywords = [
        'sales', 'revenue', 'revops', 'salesforce', 'enablement', 
        'operations', 'process', 'tool', 'platform', 'crm'
    ]
    
    # Keywords that indicate decision-making power
    decision_keywords = [
        'vp', 'director', 'head', 'lead', 'manager', 'chief', 'president'
    ]
    
    relevant_employees = []
    
    for employee in employees:
        title = extract_title(employee).lower()
        name = employee.get('name', '')
        
        # Check if role is relevant to sales operations or tool decisions
        is_sales_related = any(keyword in title for keyword in sales_keywords)
        has_decision_power = any(keyword in title for keyword in decision_keywords)
        
        if is_sales_related or has_decision_power:
            connections = employee.get('connections', 0) or 0
            followers = employee.get('followers', 0) or 0
            
            # Calculate relevance score
            relevance_score = 0
            if is_sales_related:
                relevance_score += 0.5
            if has_decision_power:
                relevance_score += 0.3
            if connections > 300:
                relevance_score += 0.1
            if followers > 400:
                relevance_score += 0.1
            
            relevant_employees.append({
                'employee': employee,
                'relevance_score': relevance_score,
                'is_sales_related': is_sales_related,
                'has_decision_power': has_decision_power
            })
    
    # Sort by relevance score
    relevant_employees.sort(key=lambda x: x['relevance_score'], reverse=True)
    
    print(f"Found {len(relevant_employees)} relevant employees:")
    print()
    
    for i, item in enumerate(relevant_employees[:15], 1):
        employee = item['employee']
        name = employee.get('name', 'Unknown')
        title = extract_title(employee)
        connections = employee.get('connections', 0) or 0
        followers = employee.get('followers', 0) or 0
        location = employee.get('location', 'Unknown')
        relevance_score = item['relevance_score']
        
        print(f"{i:2d}. {name}")
        print(f"    Title: {title}")
        print(f"    Location: {location}")
        print(f"    Relevance Score: {relevance_score:.2f}")
        print(f"    Sales Related: {'✅' if item['is_sales_related'] else '❌'}")
        print(f"    Decision Power: {'✅' if item['has_decision_power'] else '❌'}")
        print(f"    Network: {connections} connections, {followers} followers")
        print(f"    LinkedIn: {employee.get('url', 'N/A')}")
        print()

if __name__ == "__main__":
    analyze_buyer_group()
    find_specific_roles() 