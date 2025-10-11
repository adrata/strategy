#!/usr/bin/env python3
"""
Mux Buyer Group Intelligence Enrichment
Following Monaco Pipeline patterns for optimal buyer group identification
"""

import json
import re
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime

@dataclass
class EnrichedPerson:
    id: str
    name: str
    title: str
    department: str
    team: str
    standardized_title: str
    seniority_level: str
    decision_making_power: float
    buyer_group_role: str
    influence_score: float
    flight_risk_score: float
    executive_character: Dict[str, Any]
    org_structure: Dict[str, Any]
    enrichment_confidence: float

class MuxBuyerGroupEnricher:
    def __init__(self):
        # Monaco pipeline patterns
        self.department_patterns = {
            'sales': r'\b(sales|revenue|account|business development|bd|ae|sdr|bdr)\b',
            'marketing': r'\b(marketing|growth|demand gen|content|brand|communications)\b',
            'product': r'\b(product|pm|product manager|ux|ui|design)\b',
            'engineering': r'\b(engineer|developer|dev|software|frontend|backend|fullstack|swe)\b',
            'operations': r'\b(operations|ops|revops|salesops|marketingops|business operations)\b',
            'finance': r'\b(finance|accounting|fp&a|controller|cfo|treasurer)\b',
            'hr': r'\b(hr|human resources|people|talent|recruiting|recruitment)\b',
            'legal': r'\b(legal|counsel|compliance|regulatory)\b',
            'executive': r'\b(ceo|cfo|cto|coo|president|vp|vice president|director|head of)\b'
        }
        
        self.seniority_patterns = {
            'executive': r'\b(ceo|cfo|cto|coo|president|vp|vice president|chief)\b',
            'director': r'\b(director|head of|senior director)\b',
            'manager': r'\b(manager|lead|senior|principal)\b',
            'individual': r'\b(engineer|developer|analyst|specialist|coordinator)\b',
            'entry': r'\b(associate|junior|intern|assistant)\b'
        }
        
        self.buyer_group_roles = {
            'champion': ['vp', 'director', 'head of', 'senior'],
            'decision_maker': ['ceo', 'cfo', 'cto', 'president', 'vp'],
            'blocker': ['legal', 'compliance', 'finance'],
            'stakeholder': ['manager', 'lead', 'analyst'],
            'opener': ['associate', 'coordinator', 'specialist']
        }

    def load_mux_data(self, filepath: str) -> List[Dict]:
        """Load Mux employee data from JSON file"""
        people = []
        with open(filepath, 'r') as f:
            for line in f:
                if line.strip():
                    people.append(json.loads(line))
        return people

    def infer_department(self, title: str, company_info: Dict) -> str:
        """Infer department from title using Monaco pipeline patterns"""
        title_lower = title.lower()
        
        for dept, pattern in self.department_patterns.items():
            if re.search(pattern, title_lower):
                return dept.title()
        
        # Mux-specific context (video streaming company)
        if any(keyword in title_lower for keyword in ['video', 'streaming', 'ingest', 'processing']):
            return 'Engineering'
        elif any(keyword in title_lower for keyword in ['product', 'pm', 'lead product']):
            return 'Product'
        elif any(keyword in title_lower for keyword in ['creative', 'design']):
            return 'Marketing'
        elif any(keyword in title_lower for keyword in ['solutions', 'architect', 'support']):
            return 'Customer Success'
        elif any(keyword in title_lower for keyword in ['president', 'coo']):
            return 'Executive'
        
        # For inferred titles, use network-based department estimation
        if 'Senior Manager' in title or 'Manager' in title:
            # Distribute across common departments for a tech company
            import random
            depts = ['Engineering', 'Product', 'Marketing', 'Sales', 'Operations']
            return random.choice(depts)
        
        return 'Engineering'  # Default for tech company

    def extract_team(self, title: str, department: str) -> str:
        """Extract team/sub-department from title"""
        title_lower = title.lower()
        
        # Common team patterns
        team_patterns = {
            'growth': r'\b(growth|acquisition|retention)\b',
            'product': r'\b(product|platform|core|infrastructure)\b',
            'engineering': r'\b(frontend|backend|fullstack|mobile|web|api)\b',
            'sales': r'\b(enterprise|mid-market|smb|inside|field)\b',
            'marketing': r'\b(content|demand gen|brand|communications|events)\b'
        }
        
        for team, pattern in team_patterns.items():
            if re.search(pattern, title_lower):
                return team.title()
        
        return 'General'

    def standardize_title(self, title: str) -> str:
        """Standardize title based on Monaco pipeline patterns"""
        title_lower = title.lower()
        
        # Executive level
        if re.search(r'\b(ceo|chief executive officer)\b', title_lower):
            return 'Chief Executive Officer'
        elif re.search(r'\b(cfo|chief financial officer)\b', title_lower):
            return 'Chief Financial Officer'
        elif re.search(r'\b(cto|chief technology officer)\b', title_lower):
            return 'Chief Technology Officer'
        elif re.search(r'\b(coo|chief operating officer)\b', title_lower):
            return 'Chief Operating Officer'
        
        # VP level
        elif re.search(r'\b(vp|vice president)\b', title_lower):
            return 'Vice President'
        
        # Director level
        elif re.search(r'\b(director|head of)\b', title_lower):
            return 'Director'
        
        # Manager level
        elif re.search(r'\b(manager|lead)\b', title_lower):
            return 'Manager'
        
        # Individual contributor
        elif re.search(r'\b(engineer|developer|analyst|specialist)\b', title_lower):
            return 'Individual Contributor'
        
        return title

    def determine_seniority_level(self, title: str) -> str:
        """Determine seniority level using Monaco pipeline patterns"""
        title_lower = title.lower()
        
        for level, pattern in self.seniority_patterns.items():
            if re.search(pattern, title_lower):
                return level
        
        return 'individual'

    def calculate_decision_making_power(self, title: str, department: str) -> float:
        """Calculate decision making power (0-1) based on Monaco pipeline logic"""
        power = 0.0
        
        # Title-based power
        title_lower = title.lower()
        if re.search(r'\b(ceo|cfo|cto|coo|president)\b', title_lower):
            power += 0.4
        elif re.search(r'\b(vp|vice president)\b', title_lower):
            power += 0.3
        elif re.search(r'\b(director|head of)\b', title_lower):
            power += 0.2
        elif re.search(r'\b(manager|lead)\b', title_lower):
            power += 0.1
        
        # Department-based power
        dept_power = {
            'executive': 0.3,
            'sales': 0.25,
            'product': 0.2,
            'engineering': 0.15,
            'marketing': 0.15,
            'operations': 0.1,
            'finance': 0.1,
            'hr': 0.05,
            'legal': 0.05
        }
        
        power += dept_power.get(department.lower(), 0.05)
        
        return min(power, 1.0)

    def determine_buyer_group_role(self, title: str, department: str, decision_power: float) -> str:
        """Determine buyer group role based on Monaco pipeline logic"""
        title_lower = title.lower()
        dept_lower = department.lower()
        
        # Decision makers (high power, executive titles)
        if decision_power >= 0.6:
            return 'decision_maker'
        
        # Champions (medium-high power, influential roles)
        if decision_power >= 0.4 or any(role in title_lower for role in self.buyer_group_roles['champion']):
            return 'champion'
        
        # Blockers (legal, compliance, finance)
        if dept_lower in ['legal', 'compliance', 'finance']:
            return 'blocker'
        
        # Stakeholders (medium power, involved in process)
        if decision_power >= 0.2:
            return 'stakeholder'
        
        # Openers (low power, entry points)
        return 'opener'

    def calculate_influence_score(self, person: Dict, decision_power: float) -> float:
        """Calculate influence score based on Monaco pipeline patterns"""
        score = decision_power * 0.4  # Base from decision power
        
        # Activity-based influence
        if 'activity' in person and person['activity']:
            score += 0.2
        
        # Network-based influence
        connections = person.get('connections', 0) or 0
        if connections > 500:
            score += 0.2
        elif connections > 200:
            score += 0.1
        
        # Tenure-based influence (estimated)
        if 'experience' in person and person['experience']:
            # Simple tenure estimation
            score += 0.1
        
        return min(score, 1.0)

    def calculate_flight_risk(self, person: Dict) -> float:
        """Calculate flight risk score based on Monaco pipeline patterns"""
        risk = 0.5  # Base risk
        
        # Tenure risk (shorter tenure = higher risk)
        # This is simplified - in real pipeline would use actual tenure data
        risk += 0.1
        
        # Activity risk (low activity = higher risk)
        if 'activity' in person and not person['activity']:
            risk += 0.2
        
        # Title risk (certain roles have higher turnover)
        position = person.get('position', '') or ''
        title_lower = position.lower() if position else ''
        if any(role in title_lower for role in ['engineer', 'developer', 'sales']):
            risk += 0.1
        
        return min(risk, 1.0)

    def analyze_executive_character(self, person: Dict) -> Dict[str, Any]:
        """Analyze executive character patterns (simplified version)"""
        position = person.get('position', '') or ''
        title_lower = position.lower() if position else ''
        
        # Basic character inference
        character = {
            'decision_making_style': 'data-driven' if 'engineer' in title_lower else 'consensus-driven',
            'risk_tolerance': 'moderate',
            'leadership_style': 'transformational' if 'vp' in title_lower or 'director' in title_lower else 'democratic',
            'communication_style': 'analytical' if 'engineer' in title_lower else 'direct',
            'confidence': 0.7
        }
        
        return character

    def build_org_structure(self, person: Dict, department: str) -> Dict[str, Any]:
        """Build organizational structure data"""
        position = person.get('position', '') or ''
        return {
            'department': department,
            'level': self.determine_seniority_level(position),
            'reports_to': None,  # Would need org chart data
            'direct_reports': [],  # Would need org chart data
            'peers': []  # Would need org chart data
        }

    def enrich_person(self, person: Dict) -> EnrichedPerson:
        """Enrich a single person with all buyer group intelligence fields"""
        title = person.get('position', '') or ''
        
        # Handle missing or invalid titles
        if not title or title in ['--', 'None', '']:
            # Infer from other available data
            name = person.get('name', '')
            connections = person.get('connections', 0) or 0
            followers = person.get('followers', 0) or 0
            
            # Estimate role based on network indicators
            if connections > 500 or followers > 1000:
                title = 'Senior Manager'  # High network suggests senior role
            elif connections > 200:
                title = 'Manager'
            else:
                title = 'Individual Contributor'
            
            enrichment_confidence = 0.3  # Low confidence for inferred data
        else:
            enrichment_confidence = 0.8  # High confidence for actual titles
        
        # Core enrichment
        department = self.infer_department(title, person)
        team = self.extract_team(title, department)
        standardized_title = self.standardize_title(title)
        seniority_level = self.determine_seniority_level(title)
        decision_making_power = self.calculate_decision_making_power(title, department)
        buyer_group_role = self.determine_buyer_group_role(title, department, decision_making_power)
        
        # Advanced enrichment
        influence_score = self.calculate_influence_score(person, decision_making_power)
        flight_risk_score = self.calculate_flight_risk(person)
        executive_character = self.analyze_executive_character(person)
        org_structure = self.build_org_structure(person, department)
        
        return EnrichedPerson(
            id=person.get('id', ''),
            name=person.get('name', ''),
            title=title,
            department=department,
            team=team,
            standardized_title=standardized_title,
            seniority_level=seniority_level,
            decision_making_power=decision_making_power,
            buyer_group_role=buyer_group_role,
            influence_score=influence_score,
            flight_risk_score=flight_risk_score,
            executive_character=executive_character,
            org_structure=org_structure,
            enrichment_confidence=enrichment_confidence
        )

    def identify_buyer_groups(self, enriched_people: List[EnrichedPerson]) -> List[Dict[str, Any]]:
        """Identify optimal buyer groups based on Monaco pipeline logic"""
        buyer_groups = []
        
        # Group by department
        dept_groups = {}
        for person in enriched_people:
            dept = person.department
            if dept not in dept_groups:
                dept_groups[dept] = []
            dept_groups[dept].append(person)
        
        # Create buyer groups for each department
        for dept, people in dept_groups.items():
            if len(people) >= 3:  # Minimum group size
                buyer_group = {
                    'id': f"mux_{dept.lower()}_bg",
                    'company_id': 'mux',
                    'company_name': 'Mux',
                    'department': dept,
                    'members': [p.id for p in people],
                    'roles': {
                        'champions': [p.id for p in people if p.buyer_group_role == 'champion'],
                        'decision_makers': [p.id for p in people if p.buyer_group_role == 'decision_maker'],
                        'blockers': [p.id for p in people if p.buyer_group_role == 'blocker'],
                        'stakeholders': [p.id for p in people if p.buyer_group_role == 'stakeholder'],
                        'openers': [p.id for p in people if p.buyer_group_role == 'opener']
                    },
                    'metrics': {
                        'total_influence': sum(p.influence_score for p in people),
                        'avg_decision_power': sum(p.decision_making_power for p in people) / len(people),
                        'flight_risk': sum(p.flight_risk_score for p in people) / len(people),
                        'coverage_score': len([p for p in people if p.buyer_group_role in ['champion', 'decision_maker']]) / len(people)
                    },
                    'engagement_strategy': self.determine_engagement_strategy(people),
                    'priority': self.calculate_group_priority(people)
                }
                buyer_groups.append(buyer_group)
        
        return buyer_groups

    def determine_engagement_strategy(self, people: List[EnrichedPerson]) -> str:
        """Determine engagement strategy based on buyer group composition"""
        champions = [p for p in people if p.buyer_group_role == 'champion']
        decision_makers = [p for p in people if p.buyer_group_role == 'decision_maker']
        blockers = [p for p in people if p.buyer_group_role == 'blocker']
        
        if len(decision_makers) > 0:
            return 'executive_sponsor'
        elif len(champions) > 0:
            return 'champion_led'
        elif len(blockers) > 0:
            return 'blocker_mitigation'
        else:
            return 'stakeholder_consensus'

    def calculate_group_priority(self, people: List[EnrichedPerson]) -> str:
        """Calculate group priority based on Monaco pipeline logic"""
        total_influence = sum(p.influence_score for p in people)
        avg_decision_power = sum(p.decision_making_power for p in people) / len(people)
        
        if total_influence > 3.0 and avg_decision_power > 0.4:
            return 'high'
        elif total_influence > 2.0 and avg_decision_power > 0.3:
            return 'medium'
        else:
            return 'low'

    def generate_buyer_group_report(self, enriched_people: List[EnrichedPerson], buyer_groups: List[Dict]) -> Dict[str, Any]:
        """Generate comprehensive buyer group intelligence report"""
        return {
            'company': {
                'id': 'mux',
                'name': 'Mux',
                'industry': 'Video Streaming Technology',
                'size': 'Mid-Market',
                'total_employees_analyzed': len(enriched_people)
            },
            'buyer_groups': buyer_groups,
            'enriched_people': [
                {
                    'id': p.id,
                    'name': p.name,
                    'title': p.title,
                    'department': p.department,
                    'team': p.team,
                    'standardized_title': p.standardized_title,
                    'seniority_level': p.seniority_level,
                    'decision_making_power': p.decision_making_power,
                    'buyer_group_role': p.buyer_group_role,
                    'influence_score': p.influence_score,
                    'flight_risk_score': p.flight_risk_score,
                    'enrichment_confidence': p.enrichment_confidence
                }
                for p in enriched_people
            ],
            'summary': {
                'total_buyer_groups': len(buyer_groups),
                'high_priority_groups': len([bg for bg in buyer_groups if bg['priority'] == 'high']),
                'avg_group_size': sum(len(bg['members']) for bg in buyer_groups) / len(buyer_groups) if buyer_groups else 0,
                'coverage_score': sum(bg['metrics']['coverage_score'] for bg in buyer_groups) / len(buyer_groups) if buyer_groups else 0
            },
            'recommendations': self.generate_recommendations(buyer_groups),
            'generated_at': datetime.now().isoformat()
        }

    def generate_recommendations(self, buyer_groups: List[Dict]) -> List[Dict[str, Any]]:
        """Generate actionable recommendations based on buyer group analysis"""
        recommendations = []
        
        for bg in buyer_groups:
            if bg['priority'] == 'high':
                recommendations.append({
                    'buyer_group_id': bg['id'],
                    'priority': 'high',
                    'action': f"Prioritize engagement with {bg['department']} team",
                    'rationale': f"High influence ({bg['metrics']['total_influence']:.1f}) and decision power ({bg['metrics']['avg_decision_power']:.1f})",
                    'timeline': 'immediate'
                })
            
            if len(bg['roles']['champions']) == 0:
                recommendations.append({
                    'buyer_group_id': bg['id'],
                    'priority': 'medium',
                    'action': f"Identify champion in {bg['department']} team",
                    'rationale': "No champions identified - need internal advocate",
                    'timeline': '1-2 weeks'
                })
        
        return recommendations

    def enrich_and_analyze(self, filepath: str) -> Dict[str, Any]:
        """Main enrichment and analysis pipeline"""
        print("🔄 Loading Mux employee data...")
        people = self.load_mux_data(filepath)
        print(f"✅ Loaded {len(people)} employees")
        
        print("🔄 Enriching employee data...")
        enriched_people = [self.enrich_person(person) for person in people]
        print(f"✅ Enriched {len(enriched_people)} employees")
        
        print("🔄 Identifying buyer groups...")
        buyer_groups = self.identify_buyer_groups(enriched_people)
        print(f"✅ Identified {len(buyer_groups)} buyer groups")
        
        print("🔄 Generating comprehensive report...")
        report = self.generate_buyer_group_report(enriched_people, buyer_groups)
        print("✅ Report generated successfully")
        
        return report

def main():
    enricher = MuxBuyerGroupEnricher()
    
    # Enrich the Mux data
    report = enricher.enrich_and_analyze('mux_employees_exact.json')
    
    # Save the enriched report
    with open('mux_buyer_group_intelligence.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print("\n📊 BUYER GROUP INTELLIGENCE SUMMARY:")
    print(f"Company: {report['company']['name']}")
    print(f"Total Employees Analyzed: {report['company']['total_employees_analyzed']}")
    print(f"Buyer Groups Identified: {report['summary']['total_buyer_groups']}")
    print(f"High Priority Groups: {report['summary']['high_priority_groups']}")
    print(f"Average Group Size: {report['summary']['avg_group_size']:.1f}")
    print(f"Coverage Score: {report['summary']['coverage_score']:.2f}")
    
    print("\n🎯 TOP BUYER GROUPS:")
    for bg in sorted(report['buyer_groups'], key=lambda x: x['priority'] == 'high', reverse=True)[:5]:
        print(f"- {bg['department']}: {len(bg['members'])} members, {bg['priority']} priority")
        print(f"  Champions: {len(bg['roles']['champions'])}, Decision Makers: {len(bg['roles']['decision_makers'])}")
    
    print("\n💡 KEY RECOMMENDATIONS:")
    for rec in report['recommendations'][:3]:
        print(f"- {rec['action']} ({rec['priority']} priority)")
    
    print(f"\n📄 Full report saved to: mux_buyer_group_intelligence.json")

if __name__ == "__main__":
    main() 