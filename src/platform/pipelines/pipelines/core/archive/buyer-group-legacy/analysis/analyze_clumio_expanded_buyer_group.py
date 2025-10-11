#!/usr/bin/env python3
"""
Expanded Clumio Buyer Group Analysis
Since Clumio has a very small sales team, analyze all departments for optimal buyer group
"""

import json
import csv
from typing import Dict, List, Any
from collections import Counter

def load_clumio_data(filename: str) -> List[Dict[str, Any]]:
    """Load and parse Clumio employee data from CSV"""
    employees = []
    
    with open(filename, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                if row.get('current_company'):
                    row['current_company'] = json.loads(row['current_company'].replace('""', '"'))
                
                if row.get('experience'):
                    row['experience'] = json.loads(row['experience'].replace('""', '"'))
                
                if row.get('about'):
                    row['about'] = row['about'] or ''
                
                if row.get('position'):
                    row['position'] = row['position'] or ''
                
                employees.append(row)
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON for employee: {e}")
                continue
    
    return employees

def get_primary_title(employee: Dict[str, Any]) -> str:
    """Get the primary title from position, current_company, or experience"""
    title = employee.get('position', '') or ''
    if not title:
        current_company = employee.get('current_company', {})
        if isinstance(current_company, dict):
            title = current_company.get('title', '') or ''
    if not title:
        experience = employee.get('experience', [])
        if isinstance(experience, list) and experience:
            first_exp = experience[0]
            if isinstance(first_exp, dict):
                title = first_exp.get('title', '') or ''
    return title

def categorize_department(title: str, about: str = '') -> str:
    """Categorize department based on title and about section"""
    title_lower = title.lower()
    about_lower = about.lower()
    combined_text = f"{title_lower} {about_lower}"
    
    # Sales & Revenue Operations
    sales_keywords = [
        'sales', 'revenue', 'revops', 'account executive', 'business development',
        'sales development', 'sales operations', 'revenue operations', 'sales manager',
        'sales director', 'sales leader', 'sales enablement', 'sales strategy',
        'field sales', 'inside sales', 'enterprise sales', 'commercial sales'
    ]
    
    # Marketing
    marketing_keywords = [
        'marketing', 'product marketing', 'field marketing', 'demand generation',
        'growth marketing', 'digital marketing', 'content marketing', 'brand',
        'communications', 'public relations', 'pr', 'social media'
    ]
    
    # Engineering & Product
    engineering_keywords = [
        'engineer', 'software', 'developer', 'programmer', 'architect', 'technical',
        'product manager', 'product owner', 'scrum master', 'agile', 'devops',
        'site reliability', 'sre', 'platform', 'infrastructure', 'backend', 'frontend',
        'full stack', 'data engineer', 'machine learning', 'ai', 'ml'
    ]
    
    # Customer Success & Support
    customer_keywords = [
        'customer success', 'customer support', 'customer experience', 'cx',
        'support engineer', 'technical support', 'customer success manager',
        'account manager', 'customer success director'
    ]
    
    # Operations & Business
    operations_keywords = [
        'operations', 'business operations', 'strategy', 'business development',
        'partnerships', 'alliances', 'channel', 'operations manager', 'chief of staff'
    ]
    
    # HR & People
    hr_keywords = [
        'hr', 'human resources', 'people', 'talent', 'recruiting', 'recruitment',
        'people operations', 'hr manager', 'hr director', 'talent acquisition'
    ]
    
    # Finance & Legal
    finance_keywords = [
        'finance', 'financial', 'accounting', 'controller', 'cfo', 'legal',
        'counsel', 'attorney', 'compliance', 'risk', 'audit'
    ]
    
    # Executive & Leadership
    executive_keywords = [
        'ceo', 'cto', 'cfo', 'coo', 'president', 'vice president', 'vp',
        'director', 'head of', 'chief', 'founder', 'co-founder', 'executive'
    ]
    
    # Check categories in order of priority
    for keyword in sales_keywords:
        if keyword in combined_text:
            return 'Sales & Revenue Operations'
    
    for keyword in marketing_keywords:
        if keyword in combined_text:
            return 'Marketing'
    
    for keyword in engineering_keywords:
        if keyword in combined_text:
            return 'Engineering & Product'
    
    for keyword in customer_keywords:
        if keyword in combined_text:
            return 'Customer Success & Support'
    
    for keyword in operations_keywords:
        if keyword in combined_text:
            return 'Operations & Business'
    
    for keyword in hr_keywords:
        if keyword in combined_text:
            return 'HR & People'
    
    for keyword in finance_keywords:
        if keyword in combined_text:
            return 'Finance & Legal'
    
    for keyword in executive_keywords:
        if keyword in combined_text:
            return 'Executive & Leadership'
    
    return 'Other'

def calculate_seniority_level(title: str, connections: int, followers: int) -> str:
    """Calculate seniority level based on title and network metrics"""
    title_lower = title.lower()
    
    # Executive level
    if any(keyword in title_lower for keyword in ['ceo', 'cto', 'cfo', 'coo', 'president', 'founder', 'co-founder']):
        return 'Executive'
    
    # Senior leadership
    if any(keyword in title_lower for keyword in ['vice president', 'vp', 'director', 'head of', 'chief']):
        return 'Senior Leadership'
    
    # Mid-level management
    if any(keyword in title_lower for keyword in ['manager', 'lead', 'senior', 'principal']):
        return 'Mid-Level Management'
    
    # Individual contributor
    if any(keyword in title_lower for keyword in ['engineer', 'developer', 'analyst', 'specialist', 'coordinator']):
        return 'Individual Contributor'
    
    # Use network metrics as fallback
    total_network = int(connections or 0) + int(followers or 0)
    if total_network > 2000:
        return 'Senior Leadership'
    elif total_network > 1000:
        return 'Mid-Level Management'
    else:
        return 'Individual Contributor'

def calculate_influence_score(employee: Dict[str, Any]) -> float:
    """Calculate influence score based on multiple factors"""
    connections = int(employee.get('connections', 0) or 0)
    followers = int(employee.get('followers', 0) or 0)
    recommendations_count = int(employee.get('recommendations_count', 0) or 0)
    
    # Base score from network size
    network_score = min((connections + followers) / 1000, 10.0)
    
    # Bonus for recommendations
    recommendation_bonus = min(recommendations_count * 0.5, 5.0)
    
    # Seniority bonus
    title = get_primary_title(employee)
    seniority = calculate_seniority_level(title, connections, followers)
    seniority_bonus = {
        'Executive': 5.0,
        'Senior Leadership': 3.0,
        'Mid-Level Management': 1.5,
        'Individual Contributor': 0.5
    }.get(seniority, 0.0)
    
    return network_score + recommendation_bonus + seniority_bonus

def analyze_all_employees_for_buyer_group(employees: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze all employees to identify optimal buyer group for small sales team"""
    
    # Process all employees
    processed_employees = []
    for emp in employees:
        title = get_primary_title(emp)
        department = categorize_department(title, emp.get('about', ''))
        seniority = calculate_seniority_level(title, emp.get('connections', 0), emp.get('followers', 0))
        influence = calculate_influence_score(emp)
        
        processed_employees.append({
            'name': emp.get('name', 'Unknown'),
            'title': title,
            'department': department,
            'seniority': seniority,
            'influence_score': influence,
            'connections': emp.get('connections', 0),
            'followers': emp.get('followers', 0),
            'location': emp.get('city', 'Unknown'),
            'linkedin_url': emp.get('url', ''),
            'about': emp.get('about', '')[:200] + '...' if emp.get('about') else ''
        })
    
    # Sort by influence score (highest first)
    processed_employees.sort(key=lambda x: x['influence_score'], reverse=True)
    
    # Identify optimal buyer group (8 people max for smaller companies)
    optimal_buyer_group = []
    
    # Priority order for departments in buyer group intelligence platform
    priority_departments = [
        'Sales & Revenue Operations',
        'Marketing', 
        'Operations & Business',
        'Executive & Leadership',
        'Engineering & Product',
        'Customer Success & Support'
    ]
    
    # First, add high-influence people from priority departments
    for dept in priority_departments:
        dept_employees = [emp for emp in processed_employees if emp['department'] == dept]
        dept_employees.sort(key=lambda x: x['influence_score'], reverse=True)
        
        # Add top 2 from each priority department
        for emp in dept_employees[:2]:
            if len(optimal_buyer_group) < 8 and emp not in optimal_buyer_group:
                optimal_buyer_group.append(emp)
    
    # Fill remaining slots with highest influence people
    remaining_employees = [emp for emp in processed_employees if emp not in optimal_buyer_group]
    for emp in remaining_employees:
        if len(optimal_buyer_group) < 8:
            optimal_buyer_group.append(emp)
        else:
            break
    
    # Categorize into buyer group roles
    buyer_groups = {
        'Decision Makers': [],
        'Champions': [],
        'Stakeholders': [],
        'Blockers': [],
        'Introducers': []
    }
    
    for emp in optimal_buyer_group:
        seniority = emp['seniority']
        influence = emp['influence_score']
        department = emp['department']
        
        if seniority == 'Executive' and influence >= 8.0:
            buyer_groups['Decision Makers'].append(emp)
        elif seniority in ['Executive', 'Senior Leadership'] and influence >= 6.0:
            buyer_groups['Champions'].append(emp)
        elif seniority in ['Senior Leadership', 'Mid-Level Management'] and influence >= 4.0:
            buyer_groups['Stakeholders'].append(emp)
        elif influence < 3.0:
            buyer_groups['Blockers'].append(emp)
        else:
            buyer_groups['Introducers'].append(emp)
    
    return {
        'optimal_buyer_group': optimal_buyer_group,
        'buyer_groups': buyer_groups,
        'department_breakdown': Counter([emp['department'] for emp in optimal_buyer_group]),
        'seniority_breakdown': Counter([emp['seniority'] for emp in optimal_buyer_group])
    }

def main():
    """Main analysis function"""
    print("🔍 Analyzing Clumio Expanded Buyer Group Intelligence...")
    print("=" * 70)
    
    # Load data
    employees = load_clumio_data('snap_mdz6ili616uzgpjcnp.csv')
    print(f"📊 Loaded {len(employees)} employee records")
    
    # Analyze all employees for optimal buyer group
    analysis = analyze_all_employees_for_buyer_group(employees)
    
    # Print comprehensive report
    print("\n📋 CLUMIO EXPANDED BUYER GROUP INTELLIGENCE REPORT")
    print("=" * 70)
    
    print(f"🏢 Company: Clumio")
    print(f"👥 Total Employees: {len(employees)}")
    print(f"🎯 Optimal Buyer Group Size: {len(analysis['optimal_buyer_group'])}")
    
    print(f"\n📊 BUYER GROUP DEPARTMENT BREAKDOWN:")
    for dept, count in analysis['department_breakdown'].items():
        print(f"  • {dept}: {count} people")
    
    print(f"\n📈 BUYER GROUP SENIORITY BREAKDOWN:")
    for seniority, count in analysis['seniority_breakdown'].items():
        print(f"  • {seniority}: {count} people")
    
    print(f"\n🎯 DETAILED BUYER GROUP ROLES:")
    print("-" * 50)
    
    for role, people in analysis['buyer_groups'].items():
        if people:
            print(f"\n{role.upper()} ({len(people)} people):")
            for person in people:
                print(f"  • {person['name']} - {person['title'] or 'No title'}")
                print(f"    Department: {person['department']} | Seniority: {person['seniority']}")
                print(f"    Influence: {person['influence_score']:.1f} | Location: {person['location']}")
                if person['about']:
                    print(f"    About: {person['about']}")
                print()
    
    print(f"\n💡 STRATEGIC RECOMMENDATIONS:")
    print("  • Clumio has a very small sales team (6.7% of employees)")
    print("  • Recommended expanded buyer group includes Marketing, Operations, and Engineering")
    print("  • Focus on Revenue Operations and Sales Enablement roles")
    print("  • Consider product-led growth approach given engineering-heavy workforce")
    print("  • Target 8-person buyer group for optimal coverage")
    
    # Save detailed analysis
    with open('clumio_expanded_buyer_group.json', 'w') as f:
        json.dump(analysis, f, indent=2)
    
    print(f"\n📁 Detailed analysis saved to: clumio_expanded_buyer_group.json")

if __name__ == "__main__":
    main() 