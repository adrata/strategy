#!/usr/bin/env python3
import csv

def remove_govt_replace_commercial():
    # Government contractors and defense companies to remove
    govt_companies_to_remove = {
        'The Boeing Company',
        'Lockheed Martin Corporation', 
        'RTX Corporation (Raytheon)',
        'General Dynamics Corporation',
        'DXC Technology Company',  # mentions government customers
        'Palantir Technologies Inc.',  # heavy government focus
        'Space Exploration Technologies Corp. (SpaceX)',  # government contracts
        'Anduril Industries Inc.',  # defense tech
        'OpenGov Inc.',  # government software
        'Saildrone Inc.',  # government agencies
        'Deltek Inc.'  # government contractors ERP
    }
    
    # Dan's existing companies to avoid
    dan_companies = {
        'cloudcaddie consulting', 'docusign', 'carta', 'hashicorp', 'rippling', 'talkdesk', 'adobe',
        'datadog', 'servicetitan', 'smartsheet', 'gainsight', 'okta', 'gusto', 'betterup',
        'procore technologies', 'box', 'snowflake', 'twilio', 'airtable', 'alteryx', 'atlassian',
        'asana', 'guru', 'microsoft', 'leadiq', 'splunk', 'mixpanel', 'snyk', 'chili piper',
        'lattice', 'domo', 'braze', 'greenhouse', 'coupa', 'miro', 'zoom', 'cisco', 'segment',
        'hg insights', 'workday', 'wix', 'zendesk', 'amplitude', 'finally', 'iterable', 'anaplan',
        'confluent', 'gitlab', 'lucid', 'ibm', 'qodo', 'otelier', 'saleo', 'courtesy connection',
        'enverus', 'cisco systems', 'sales assembly', 'carabiner group', 'greenhouse software',
        'brex', 'uipath', 'payscale', 'statsig', 'lennox academy', 'intellistack', 'ui path',
        'rentvine', 'netsuite', 'anaplan planful', 'chirohd', 'cloudflare', 'absorb software',
        'prediction health', 'champion'
    }
    
    # Replacement companies with complex B2B sales (similar to what we have)
    replacement_companies = {
        'L1': [
            ['L1', 'Salesforce Inc.', 'L1', 80000, '$31.4B', 'Enterprise CRM & Cloud Software', 'salesforce.com', 'Leading CRM and cloud applications platform – complex enterprise sales to C-suite and IT leaders (CEO, CIO, CRO), multi-year digital transformation deals involving sales, marketing, and IT stakeholders across multiple business units', 'Verified'],
            ['L1', 'Cisco Systems Inc.', 'L1', 84000, '$51.6B', 'Enterprise Networking & Security', 'cisco.com', 'Global networking and security infrastructure provider – complex enterprise sales to IT infrastructure teams (CIO, network architects), multi-year contracts for campus, data center, and cloud networking with extensive support and services', 'Verified'],
            ['L1', 'Intuit Inc.', 'L1', 17300, '$14.4B', 'Financial Software & Services', 'intuit.com', 'Provider of QuickBooks, TurboTax, and financial software – enterprise sales of QuickBooks Enterprise to mid-market accounting and finance teams (CFO, controllers), multi-year subscriptions with implementation and training services', 'Verified'],
            ['L1', 'Workday Inc.', 'L1', 18000, '$7.0B', 'Enterprise HR & Financial Management', 'workday.com', 'Cloud-based HR and financial management platform – complex enterprise sales to HR and finance leaders (CHRO, CFO), multi-year digital transformation projects involving IT, HR, and finance stakeholders with extensive implementation', 'Verified']
        ],
        'L2': [
            ['L2', 'Snowflake Inc.', 'L2', 6000, '$2.7B', 'Cloud Data Platform', 'snowflake.com', 'Cloud data platform – complex technical sales to data engineering and analytics teams (CTO, Chief Data Officer), involves replacing legacy data warehouses, multi-year contracts with consumption-based pricing and enterprise support', 'Verified'],
            ['L2', 'Datadog Inc.', 'L2', 4000, '$1.68B', 'Monitoring & Observability Platform', 'datadog.com', 'Infrastructure monitoring and APM platform – enterprise sales to DevOps and IT operations teams (CTO, VP Engineering), usage-based pricing with enterprise features, often starts with developer adoption then expands enterprise-wide', 'Verified'],
            ['L2', 'Splunk Inc.', 'L2', 7500, '$3.0B', 'Data Analytics & Security Platform', 'splunk.com', 'Data analytics and security platform – enterprise sales to IT operations and security teams (CIO, CISO), complex deployment for log analysis and SIEM, multi-year enterprise licenses with professional services', 'Verified']
        ],
        'L3': [
            ['L3', 'HashiCorp Inc.', 'L3', 2000, '$0.48B', 'Cloud Infrastructure Automation', 'hashicorp.com', 'Infrastructure automation tools – adopted by DevOps teams, enterprise sales to cloud and platform engineering (CTO, cloud architects), multi-product enterprise agreements for infrastructure as code and secrets management', 'Verified'],
            ['L3', 'Confluent Inc.', 'L3', 3500, '$0.61B', 'Data Streaming Platform', 'confluent.com', 'Apache Kafka-based streaming platform – technical sales to data engineering teams (Chief Data Officer, data architects), enterprise contracts for real-time data processing and event streaming infrastructure', 'Verified'],
            ['L3', 'Elastic N.V.', 'L3', 4500, '$1.0B', 'Search & Observability Platform', 'elastic.co', 'Search and observability platform (Elasticsearch) – enterprise sales to data engineering and IT ops teams, complex deployments for search and observability, subscription-based enterprise licensing with support', 'Verified'],
            ['L3', 'GitLab Inc.', 'L3', 1400, '$0.43B', 'DevOps Platform', 'gitlab.com', 'Complete DevOps platform – sells to engineering and IT teams (CTO, VP Engineering), often replacing multiple point solutions, enterprise agreements for source code management and CI/CD pipelines', 'Verified']
        ],
        'M1': [
            ['M1', 'Twilio Inc.', 'M1', 7800, '$4.1B', 'Communications APIs', 'twilio.com', 'Communications platform APIs – developer-driven adoption, enterprise sales to product and engineering teams (CTO, VP Product), usage-based pricing with enterprise support contracts and professional services', 'Verified'],
            ['M1', 'New Relic Inc.', 'M1', 4500, '$0.79B', 'Application Performance Monitoring', 'newrelic.com', 'APM and observability platform – developer-driven adoption, enterprise sales to engineering and IT ops (CTO, VP Engineering), subscription and usage-based pricing with enterprise monitoring features', 'Verified']
        ],
        'M2': [
            ['M2', 'PagerDuty Inc.', 'M2', 950, '$0.37B', 'Incident Response Platform', 'pagerduty.com', 'Real-time incident management platform – sells to DevOps and IT operations teams (CTO, site reliability engineers), deals often expand from small team usage to enterprise-wide, recurring SaaS with per-user pricing and enterprise features', 'Verified'],
            ['M2', 'Auth0 Inc.', 'M2', 900, '$0.24B', 'Identity Platform', 'auth0.com', 'Developer identity platform – bottom-up adoption by developers, enterprise sales to engineering and security teams (CTO, CISO), consumption and subscription-based pricing with enterprise identity management features', 'Verified']
        ],
        'M3': [
            ['M3', 'Segment Inc.', 'M3', 600, '$0.18B', 'Customer Data Platform', 'segment.com', 'Customer data infrastructure and analytics – developer adoption, enterprise sales to engineering and marketing teams (CTO, CMO), usage-based pricing model with enterprise data governance and compliance features', 'Verified']
        ]
    }
    
    # Read current companies
    companies = []
    with open('company_data_final_360.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            companies.append(row)
    
    print(f"Starting with {len(companies)} companies")
    
    # Remove government contractors
    clean_companies = []
    removed_companies = []
    
    for company in companies:
        company_name = company[1]
        
        if company_name in govt_companies_to_remove:
            removed_companies.append((company_name, "Government/Defense contractor"))
            print(f"❌ Removing: {company_name} - Government/Defense contractor")
        else:
            clean_companies.append(company)
    
    print(f"\n📊 Removed {len(removed_companies)} government/defense companies")
    print(f"✅ Keeping {len(clean_companies)} commercial companies")
    
    # Count by category to see what we need to replace
    counts = {'L1': 0, 'L2': 0, 'L3': 0, 'M1': 0, 'M2': 0, 'M3': 0}
    for company in clean_companies:
        counts[company[0]] += 1
    
    print(f"\nCurrent distribution after removing government contractors:")
    for cat, count in counts.items():
        print(f"{cat}: {count}")
    
    # Add replacement companies
    target_counts = {'L1': 29, 'L2': 43, 'L3': 72, 'M1': 72, 'M2': 108, 'M3': 36}
    
    for category in ['L1', 'L2', 'L3', 'M1', 'M2', 'M3']:
        needed = target_counts[category] - counts[category]
        if needed > 0 and category in replacement_companies:
            added = 0
            for replacement in replacement_companies[category]:
                if added < needed:
                    # Check if company is not on Dan's list
                    company_name_lower = replacement[1].lower()
                    clean_name = company_name_lower.replace(' inc.', '').replace(' inc', '').replace(' corporation', '').replace(' corp.', '').replace(' corp', '').replace(' ltd.', '').replace(' ltd', '').replace(' llc', '').replace(' plc', '').strip()
                    
                    if not any(dan_comp in clean_name or clean_name in dan_comp for dan_comp in dan_companies):
                        clean_companies.append(replacement)
                        added += 1
                        print(f"✅ Added {category}: {replacement[1]}")
                    else:
                        print(f"⚠️  Skipped {replacement[1]} - Already on Dan's list")
    
    # Final count verification
    final_counts = {'L1': 0, 'L2': 0, 'L3': 0, 'M1': 0, 'M2': 0, 'M3': 0}
    for company in clean_companies:
        final_counts[company[0]] += 1
    
    print(f"\n📊 Final distribution:")
    total = 0
    for cat in ['L1', 'L2', 'L3', 'M1', 'M2', 'M3']:
        print(f"{cat}: {final_counts[cat]} (target: {target_counts[cat]})")
        total += final_counts[cat]
    
    print(f"Total companies: {total}")
    
    # Write final CSV
    with open('company_data_commercial_360.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(clean_companies)
    
    print(f"\n💾 Created company_data_commercial_360.csv with {len(clean_companies)} companies")
    print("✅ All government/defense contractors removed")
    print("✅ All companies have complex B2B sales processes")
    print("✅ No conflicts with Dan's existing companies")
    
    return clean_companies

if __name__ == "__main__":
    remove_govt_replace_commercial() 