#!/usr/bin/env python3
"""
Analyze LinkedIn Experience Data
Show what work history information is available in the Bright Data LinkedIn dataset
"""

import json
import csv
from typing import Dict, List, Any
from collections import Counter

def load_and_analyze_experience_data(filename: str):
    """Load and analyze experience data from LinkedIn CSV"""
    
    employees_with_experience = []
    employees_without_experience = []
    
    with open(filename, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            experience_data = row.get('experience', '')
            
            if experience_data and len(experience_data) > 10:
                try:
                    # Parse the JSON experience data
                    experience_list = json.loads(experience_data.replace('""', '"'))
                    employees_with_experience.append({
                        'name': row.get('name', 'Unknown'),
                        'current_position': row.get('position', ''),
                        'experience': experience_list
                    })
                except json.JSONDecodeError:
                    print(f"Error parsing experience for {row.get('name', 'Unknown')}")
            else:
                employees_without_experience.append({
                    'name': row.get('name', 'Unknown'),
                    'current_position': row.get('position', '')
                })
    
    return employees_with_experience, employees_without_experience

def analyze_experience_patterns(employees_with_experience: List[Dict[str, Any]]):
    """Analyze patterns in the experience data"""
    
    all_companies = []
    all_titles = []
    experience_lengths = []
    current_vs_previous = []
    
    for emp in employees_with_experience:
        experience_list = emp['experience']
        experience_lengths.append(len(experience_list))
        
        for i, exp in enumerate(experience_list):
            if isinstance(exp, dict):
                company = exp.get('company', 'Unknown')
                title = exp.get('title', 'Unknown')
                start_date = exp.get('start_date', '')
                end_date = exp.get('end_date', '')
                
                all_companies.append(company)
                all_titles.append(title)
                
                # Check if this is current role
                if end_date == 'Present' or not end_date:
                    current_vs_previous.append('Current')
                else:
                    current_vs_previous.append('Previous')
    
    return {
        'total_employees_with_experience': len(employees_with_experience),
        'total_experience_entries': len(all_companies),
        'average_experience_entries_per_person': sum(experience_lengths) / len(experience_lengths) if experience_lengths else 0,
        'company_distribution': Counter(all_companies),
        'title_distribution': Counter(all_titles),
        'current_vs_previous_distribution': Counter(current_vs_previous)
    }

def show_detailed_experience_examples(employees_with_experience: List[Dict[str, Any]], num_examples: int = 3):
    """Show detailed examples of experience data"""
    
    print(f"\n📋 DETAILED EXPERIENCE EXAMPLES (showing {num_examples} people):")
    print("=" * 80)
    
    for i, emp in enumerate(employees_with_experience[:num_examples]):
        print(f"\n👤 {emp['name']} - Current: {emp['current_position']}")
        print("-" * 60)
        
        for j, exp in enumerate(emp['experience']):
            if isinstance(exp, dict):
                company = exp.get('company', 'Unknown')
                title = exp.get('title', 'Unknown')
                start_date = exp.get('start_date', '')
                end_date = exp.get('end_date', '')
                location = exp.get('location', '')
                description = exp.get('description', '')
                
                print(f"  {j+1}. {title} at {company}")
                print(f"     Period: {start_date} - {end_date}")
                print(f"     Location: {location}")
                if description:
                    print(f"     Description: {description[:100]}...")
                print()

def main():
    """Main analysis function"""
    print("🔍 Analyzing LinkedIn Experience Data from Bright Data Dataset")
    print("=" * 70)
    
    # Load and analyze experience data
    employees_with_exp, employees_without_exp = load_and_analyze_experience_data('snap_mdz6ili616uzgpjcnp.csv')
    
    print(f"📊 EXPERIENCE DATA COVERAGE:")
    print(f"  • Total employees: {len(employees_with_exp) + len(employees_without_exp)}")
    print(f"  • With experience data: {len(employees_with_exp)} ({len(employees_with_exp)/(len(employees_with_exp) + len(employees_without_exp))*100:.1f}%)")
    print(f"  • Without experience data: {len(employees_without_exp)} ({len(employees_without_exp)/(len(employees_with_exp) + len(employees_without_exp))*100:.1f}%)")
    
    if employees_with_exp:
        # Analyze patterns
        patterns = analyze_experience_patterns(employees_with_exp)
        
        print(f"\n📈 EXPERIENCE PATTERNS:")
        print(f"  • Total experience entries: {patterns['total_experience_entries']}")
        print(f"  • Average entries per person: {patterns['average_experience_entries_per_person']:.1f}")
        print(f"  • Current vs Previous roles: {dict(patterns['current_vs_previous_distribution'])}")
        
        print(f"\n🏢 TOP COMPANIES IN EXPERIENCE:")
        for company, count in patterns['company_distribution'].most_common(5):
            print(f"  • {company}: {count} mentions")
        
        print(f"\n💼 TOP TITLES IN EXPERIENCE:")
        for title, count in patterns['title_distribution'].most_common(5):
            print(f"  • {title}: {count} mentions")
        
        # Show detailed examples
        show_detailed_experience_examples(employees_with_exp)
        
        print(f"\n💡 KEY INSIGHTS:")
        print(f"  • Experience data provides rich work history context")
        print(f"  • Includes company names, titles, dates, locations, and descriptions")
        print(f"  • Can be used to identify career progression and expertise")
        print(f"  • Helps determine seniority and decision-making authority")
        print(f"  • Shows industry experience and technical skills")
        
    else:
        print("\n❌ No experience data found in the dataset")

if __name__ == "__main__":
    main() 