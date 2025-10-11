#!/usr/bin/env python3
import json

def view_buyer_group_report():
    with open('mux_buyer_group_intelligence.json', 'r') as f:
        report = json.load(f)
    
    print("🎯 MUX BUYER GROUP INTELLIGENCE REPORT")
    print("=" * 50)
    
    print(f"\n📊 COMPANY OVERVIEW:")
    print(f"Company: {report['company']['name']}")
    print(f"Industry: {report['company']['industry']}")
    print(f"Size: {report['company']['size']}")
    print(f"Total Employees Analyzed: {report['company']['total_employees_analyzed']}")
    
    print(f"\n📈 SUMMARY METRICS:")
    print(f"Total Buyer Groups: {report['summary']['total_buyer_groups']}")
    print(f"High Priority Groups: {report['summary']['high_priority_groups']}")
    print(f"Average Group Size: {report['summary']['avg_group_size']:.1f}")
    print(f"Coverage Score: {report['summary']['coverage_score']:.2f}")
    
    print(f"\n🎯 BUYER GROUP DETAILS:")
    for bg in report['buyer_groups']:
        print(f"\n{bg['department']} Team ({len(bg['members'])} members):")
        print(f"  Priority: {bg['priority']}")
        print(f"  Engagement Strategy: {bg['engagement_strategy']}")
        print(f"  Champions: {len(bg['roles']['champions'])}")
        print(f"  Decision Makers: {len(bg['roles']['decision_makers'])}")
        print(f"  Blockers: {len(bg['roles']['blockers'])}")
        print(f"  Stakeholders: {len(bg['roles']['stakeholders'])}")
        print(f"  Openers: {len(bg['roles']['openers'])}")
        print(f"  Coverage Score: {bg['metrics']['coverage_score']:.2f}")
        print(f"  Total Influence: {bg['metrics']['total_influence']:.1f}")
        print(f"  Avg Decision Power: {bg['metrics']['avg_decision_power']:.2f}")
    
    print(f"\n💡 RECOMMENDATIONS:")
    for i, rec in enumerate(report['recommendations'], 1):
        print(f"{i}. {rec['action']} ({rec['priority']} priority)")
        print(f"   Rationale: {rec['rationale']}")
        print(f"   Timeline: {rec['timeline']}")
    
    print(f"\n📋 SAMPLE ENRICHED PEOPLE:")
    for person in report['enriched_people'][:5]:
        print(f"- {person['name']}: {person['title']}")
        print(f"  Department: {person['department']}, Team: {person['team']}")
        print(f"  Role: {person['buyer_group_role']}, Influence: {person['influence_score']:.2f}")
        print(f"  Decision Power: {person['decision_making_power']:.2f}")

if __name__ == "__main__":
    view_buyer_group_report() 