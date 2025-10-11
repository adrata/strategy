#!/usr/bin/env python3
"""
Expanded Yello.co Buyer Group Analysis
Since Yello.co has a very small sales team, analyze all departments for optimal buyer group
Focus on identifying the best buyer group for purchasing a buyer group intelligence platform
"""

import json
import csv
from typing import Dict, List, Any
from collections import Counter

def load_yello_data(filename: str) -> List[Dict[str, Any]]:
    """Load and parse Yello.co employee data from CSV"""
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
        'field sales', 'inside sales', 'enterprise sales', 'commercial sales',
        'business development representative', 'bdr', 'sdr', 'client manager'
    ]
    
    # Marketing
    marketing_keywords = [
        'marketing', 'product marketing', 'field marketing', 'demand generation',
        'growth marketing', 'digital marketing', 'content marketing', 'brand',
        'communications', 'public relations', 'pr', 'social media', 'brand content'
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
        'account manager', 'customer success director', 'client manager'
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
    if any(keyword in title_lower for keyword in ['engineer', 'developer', 'analyst', 'specialist', 'coordinator', 'representative']):
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
    """Analyze all employees to identify optimal buyer group for buyer group intelligence platform"""
    
    # Process all employees
    processed_employees = []
    for emp in employees:
        title = get_primary_title(emp)
        department = categorize_department(title, emp.get('about', ''))
        seniority = calculate_seniority_level(title, emp.get('connections', 0), emp.get('followers', 0))
        influence_score = calculate_influence_score(emp)
        
        processed_employees.append({
            'name': emp.get('name', 'Unknown'),
            'title': title,
            'department': department,
            'seniority': seniority,
            'influence_score': influence_score,
            'connections': emp.get('connections', 0),
            'followers': emp.get('followers', 0),
            'location': emp.get('city', 'Unknown'),
            'linkedin_url': emp.get('url', ''),
            'about': emp.get('about', '')[:200] + '...' if emp.get('about') else ''
        })
    
    # Sort by influence score (highest first)
    processed_employees.sort(key=lambda x: x['influence_score'], reverse=True)
    
    # Select optimal buyer group (8 people for smaller companies)
    optimal_buyer_group = []
    priority_departments = [
        'Sales & Revenue Operations',
        'Marketing', 
        'Operations & Business',
        'Executive & Leadership',
        'Engineering & Product',
        'Customer Success & Support'
    ]
    
    # First, get top employees from priority departments
    for dept in priority_departments:
        dept_employees = [emp for emp in processed_employees if emp['department'] == dept]
        # Take top 2 from each priority department
        optimal_buyer_group.extend(dept_employees[:2])
    
    # If we don't have enough, fill with highest influence scores from any department
    if len(optimal_buyer_group) < 8:
        remaining_employees = [emp for emp in processed_employees if emp not in optimal_buyer_group]
        optimal_buyer_group.extend(remaining_employees[:8 - len(optimal_buyer_group)])
    
    # Limit to top 8
    optimal_buyer_group = optimal_buyer_group[:8]
    
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
        
        # Decision Makers: Executive level with high influence
        if seniority == 'Executive' and influence >= 8.0:
            buyer_groups['Decision Makers'].append(emp)
        # Champions: Senior leadership or high-influence sales/marketing
        elif (seniority in ['Executive', 'Senior Leadership'] and influence >= 6.0) or \
             (department in ['Sales & Revenue Operations', 'Marketing'] and influence >= 5.0):
            buyer_groups['Champions'].append(emp)
        # Stakeholders: Mid-level management or key department heads
        elif seniority in ['Senior Leadership', 'Mid-Level Management'] and influence >= 4.0:
            buyer_groups['Stakeholders'].append(emp)
        # Blockers: Low influence or non-strategic roles
        elif influence < 3.0 or department == 'Other':
            buyer_groups['Blockers'].append(emp)
        # Introducers: Everyone else
        else:
            buyer_groups['Introducers'].append(emp)
    
    return {
        'optimal_buyer_group': optimal_buyer_group,
        'buyer_groups': buyer_groups,
        'department_breakdown': Counter([emp['department'] for emp in optimal_buyer_group]),
        'seniority_breakdown': Counter([emp['seniority'] for emp in optimal_buyer_group])
    }

def generate_expanded_report(employees: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate expanded buyer group report"""
    
    # Analyze company context
    total_employees = len(employees)
    departments = Counter()
    for emp in employees:
        title = get_primary_title(emp)
        department = categorize_department(title, emp.get('about', ''))
        departments[department] += 1
    
    # Get expanded buyer group analysis
    buyer_group_analysis = analyze_all_employees_for_buyer_group(employees)
    
    # Calculate metrics
    sales_percentage = (departments['Sales & Revenue Operations'] / total_employees) * 100 if total_employees > 0 else 0
    marketing_percentage = (departments['Marketing'] / total_employees) * 100 if total_employees > 0 else 0
    
    # Generate strategic recommendations
    recommendations = []
    
    if sales_percentage < 10:
        recommendations.append("Very small sales team - expand buyer group to include Marketing and Operations")
        recommendations.append("Focus on Revenue Operations and Sales Enablement roles")
        recommendations.append("Consider product-led growth approach for this company")
    
    if marketing_percentage > 20:
        recommendations.append("Strong marketing presence - include Marketing leadership in buyer group")
        recommendations.append("Leverage marketing's influence on sales technology decisions")
    
    # Create comprehensive report
    report = {
        'company_name': 'Yello.co',
        'analysis_date': '2025-01-27',
        'company_context': {
            'total_employees': total_employees,
            'department_distribution': dict(departments),
            'sales_percentage': sales_percentage,
            'marketing_percentage': marketing_percentage,
            'company_type': 'Marketing-Led' if marketing_percentage > sales_percentage else 'Sales-Led'
        },
        'buyer_group_analysis': buyer_group_analysis,
        'strategic_recommendations': recommendations,
        'platform_value_proposition': {
            'target_company_size': 'Small to Medium (107 employees)',
            'optimal_buyer_group_size': 8,
            'primary_departments': ['Sales & Revenue Operations', 'Marketing', 'Operations'],
            'expected_deal_size': '$5K-$50K',
            'key_benefits': [
                'Streamline buyer group identification for small sales teams',
                'Improve sales efficiency with targeted stakeholder mapping',
                'Reduce time spent on prospect research',
                'Increase win probability through strategic buyer group targeting'
            ]
        }
    }
    
    return report

def main():
    """Main analysis function"""
    print("🔍 Analyzing Yello.co Expanded Buyer Group Intelligence...")
    print("=" * 70)
    
    # Load data
    employees = load_yello_data('snap_mdz7c9h027xkyh27id.csv')
    print(f"📊 Loaded {len(employees)} employee records")
    
    # Generate expanded report
    report = generate_expanded_report(employees)
    
    # Save detailed report
    with open('yello_expanded_buyer_group.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    # Print comprehensive summary
    print("\n📋 YELLO.CO EXPANDED BUYER GROUP INTELLIGENCE REPORT")
    print("=" * 70)
    
    company_context = report['company_context']
    buyer_analysis = report['buyer_group_analysis']
    
    print(f"🏢 Company: {report['company_name']}")
    print(f"👥 Total Employees: {company_context['total_employees']}")
    print(f"📈 Company Type: {company_context['company_type']}")
    print(f"💰 Sales Team: {company_context['sales_percentage']:.1f}%")
    print(f"📢 Marketing Team: {company_context['marketing_percentage']:.1f}%")
    
    print(f"\n🎯 OPTIMAL BUYER GROUP ({len(buyer_analysis['optimal_buyer_group'])} people)")
    print("-" * 50)
    
    for role, people in buyer_analysis['buyer_groups'].items():
        if people:
            print(f"\n{role.upper()} ({len(people)} people):")
            for person in people:
                print(f"  • {person['name']} - {person['title']}")
                print(f"    {person['department']} | {person['seniority']} | Influence: {person['influence_score']:.1f}")
    
    print(f"\n📊 BUYER GROUP BREAKDOWN:")
    print(f"  • Departments: {dict(buyer_analysis['department_breakdown'])}")
    print(f"  • Seniority: {dict(buyer_analysis['seniority_breakdown'])}")
    
    print(f"\n💡 STRATEGIC RECOMMENDATIONS:")
    for rec in report['strategic_recommendations']:
        print(f"  • {rec}")
    
    print(f"\n🎯 PLATFORM VALUE PROPOSITION:")
    platform_value = report['platform_value_proposition']
    print(f"  • Target Company Size: {platform_value['target_company_size']}")
    print(f"  • Expected Deal Size: {platform_value['expected_deal_size']}")
    print(f"  • Key Benefits:")
    for benefit in platform_value['key_benefits']:
        print(f"    - {benefit}")
    
    print(f"\n📁 Detailed report saved to: yello_expanded_buyer_group.json")

if __name__ == "__main__":
    main() 