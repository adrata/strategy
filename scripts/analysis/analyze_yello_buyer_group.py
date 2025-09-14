#!/usr/bin/env python3
"""
Comprehensive Yello.co Buyer Group Analysis
Utilizes all available data fields to identify optimal buyer group for buyer group intelligence platform
"""

import json
import csv
import re
from typing import Dict, List, Any, Optional
from collections import defaultdict, Counter

def load_yello_data(filename: str) -> List[Dict[str, Any]]:
    """Load and parse Yello.co employee data from CSV"""
    employees = []
    
    with open(filename, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Parse nested JSON fields
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

def extract_title_from_current_company(employee: Dict[str, Any]) -> str:
    """Extract title from current_company object"""
    current_company = employee.get('current_company', {})
    if isinstance(current_company, dict):
        return current_company.get('title', '') or ''
    return ''

def extract_title_from_experience(employee: Dict[str, Any]) -> str:
    """Extract current title from experience array"""
    experience = employee.get('experience', [])
    if isinstance(experience, list) and experience:
        # Get the first (most recent) experience
        first_exp = experience[0]
        if isinstance(first_exp, dict):
            return first_exp.get('title', '') or ''
    return ''

def get_primary_title(employee: Dict[str, Any]) -> str:
    """Get the primary title from position, current_company, or experience"""
    # Priority: position > current_company.title > experience[0].title
    title = employee.get('position', '') or ''
    if not title:
        title = extract_title_from_current_company(employee)
    if not title:
        title = extract_title_from_experience(employee)
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
        'business development representative', 'bdr', 'sdr'
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

def identify_buyer_group_roles(employees: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """Identify optimal buyer group roles for buyer group intelligence platform"""
    
    # Focus on Sales & Revenue Operations (primary buyer group)
    sales_employees = []
    for emp in employees:
        title = get_primary_title(emp)
        department = categorize_department(title, emp.get('about', ''))
        
        if department == 'Sales & Revenue Operations':
            sales_employees.append({
                'name': emp.get('name', 'Unknown'),
                'title': title,
                'department': department,
                'seniority': calculate_seniority_level(title, emp.get('connections', 0), emp.get('followers', 0)),
                'influence_score': calculate_influence_score(emp),
                'connections': emp.get('connections', 0),
                'followers': emp.get('followers', 0),
                'location': emp.get('city', 'Unknown'),
                'linkedin_url': emp.get('url', ''),
                'about': emp.get('about', '')[:200] + '...' if emp.get('about') else ''
            })
    
    # Sort by influence score (highest first)
    sales_employees.sort(key=lambda x: x['influence_score'], reverse=True)
    
    # Categorize into buyer group roles
    buyer_groups = {
        'Decision Makers': [],
        'Champions': [],
        'Stakeholders': [],
        'Blockers': [],
        'Introducers': []
    }
    
    for emp in sales_employees:
        seniority = emp['seniority']
        influence = emp['influence_score']
        
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
    
    return buyer_groups

def analyze_company_context(employees: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze company context and characteristics"""
    
    total_employees = len(employees)
    departments = Counter()
    locations = Counter()
    seniority_levels = Counter()
    
    for emp in employees:
        title = get_primary_title(emp)
        department = categorize_department(title, emp.get('about', ''))
        seniority = calculate_seniority_level(title, emp.get('connections', 0), emp.get('followers', 0))
        
        departments[department] += 1
        locations[emp.get('city', 'Unknown')] += 1
        seniority_levels[seniority] += 1
    
    # Calculate company characteristics
    sales_percentage = (departments['Sales & Revenue Operations'] / total_employees) * 100 if total_employees > 0 else 0
    marketing_percentage = (departments['Marketing'] / total_employees) * 100 if total_employees > 0 else 0
    engineering_percentage = (departments['Engineering & Product'] / total_employees) * 100 if total_employees > 0 else 0
    
    return {
        'total_employees': total_employees,
        'department_distribution': dict(departments),
        'location_distribution': dict(locations),
        'seniority_distribution': dict(seniority_levels),
        'sales_percentage': sales_percentage,
        'marketing_percentage': marketing_percentage,
        'engineering_percentage': engineering_percentage,
        'company_type': 'Sales-Led' if sales_percentage > marketing_percentage and sales_percentage > engineering_percentage else 'Marketing-Led' if marketing_percentage > engineering_percentage else 'Product-Led'
    }

def generate_buyer_group_report(employees: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate comprehensive buyer group report"""
    
    # Analyze company context
    company_context = analyze_company_context(employees)
    
    # Identify buyer group roles
    buyer_groups = identify_buyer_group_roles(employees)
    
    # Calculate metrics
    total_sales_employees = sum(len(group) for group in buyer_groups.values())
    total_employees = len(employees)
    
    # Generate recommendations
    recommendations = []
    
    if company_context['sales_percentage'] < 20:
        recommendations.append("Low sales team presence - consider product-led growth approach")
        recommendations.append("Focus on Revenue Operations and Sales Enablement roles")
    else:
        recommendations.append("Strong sales presence - traditional sales-led approach viable")
    
    if total_sales_employees < 5:
        recommendations.append("Small sales team - consider expanding buyer group to include Marketing and Operations")
    
    # Create comprehensive report
    report = {
        'company_name': 'Yello.co',
        'analysis_date': '2025-01-27',
        'company_context': company_context,
        'buyer_group_analysis': {
            'total_sales_employees': total_sales_employees,
            'total_employees': total_employees,
            'sales_percentage': (total_sales_employees / total_employees * 100) if total_employees > 0 else 0,
            'buyer_groups': buyer_groups,
            'optimal_buyer_group_size': min(total_sales_employees, 8),  # Cap at 8 for smaller companies
            'recommended_approach': 'Focused Sales Team' if total_sales_employees >= 5 else 'Expanded Buyer Group'
        },
        'recommendations': recommendations,
        'data_quality': {
            'total_records': total_employees,
            'records_with_titles': sum(1 for emp in employees if get_primary_title(emp)),
            'records_with_about': sum(1 for emp in employees if emp.get('about')),
            'records_with_experience': sum(1 for emp in employees if emp.get('experience'))
        }
    }
    
    return report

def main():
    """Main analysis function"""
    print("🔍 Analyzing Yello.co Buyer Group Intelligence...")
    print("=" * 60)
    
    # Load data
    employees = load_yello_data('snap_mdz7c9h027xkyh27id.csv')
    print(f"📊 Loaded {len(employees)} employee records")
    
    # Generate comprehensive report
    report = generate_buyer_group_report(employees)
    
    # Save detailed report
    with open('yello_buyer_group_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    # Print summary
    print("\n📋 YELLO.CO BUYER GROUP INTELLIGENCE REPORT")
    print("=" * 60)
    
    company_context = report['company_context']
    buyer_analysis = report['buyer_group_analysis']
    
    print(f"🏢 Company: {report['company_name']}")
    print(f"👥 Total Employees: {company_context['total_employees']}")
    print(f"📈 Company Type: {company_context['company_type']}")
    print(f"💰 Sales Team Size: {buyer_analysis['total_sales_employees']}")
    print(f"📊 Sales Percentage: {buyer_analysis['sales_percentage']:.1f}%")
    
    print(f"\n🎯 OPTIMAL BUYER GROUP ({buyer_analysis['optimal_buyer_group_size']} people)")
    print("-" * 40)
    
    for role, people in buyer_analysis['buyer_groups'].items():
        if people:
            print(f"\n{role.upper()} ({len(people)} people):")
            for person in people[:3]:  # Show top 3 per role
                print(f"  • {person['name']} - {person['title']}")
                print(f"    Influence: {person['influence_score']:.1f} | {person['seniority']}")
            if len(people) > 3:
                print(f"  ... and {len(people) - 3} more")
    
    print(f"\n💡 RECOMMENDATIONS:")
    for rec in report['recommendations']:
        print(f"  • {rec}")
    
    print(f"\n📁 Detailed report saved to: yello_buyer_group_report.json")
    
    # Data quality summary
    data_quality = report['data_quality']
    print(f"\n📊 DATA QUALITY:")
    print(f"  • Records with titles: {data_quality['records_with_titles']}/{data_quality['total_records']}")
    print(f"  • Records with about: {data_quality['records_with_about']}/{data_quality['total_records']}")
    print(f"  • Records with experience: {data_quality['records_with_experience']}/{data_quality['total_records']}")

if __name__ == "__main__":
    main() 