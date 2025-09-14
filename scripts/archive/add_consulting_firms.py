#!/usr/bin/env python3
import csv

def add_consulting_firms():
    """
    Add 50 consulting/systems integration/professional services companies
    that implement enterprise software (Salesforce, ServiceNow, SAP, etc.)
    and need to hire technical talent
    """
    
    # Read existing companies
    existing_companies = []
    with open('warm_bd_list_cleaned.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            existing_companies.append(row)
    
    # 50 new consulting/professional services companies that implement enterprise software
    new_companies = [
        # Salesforce Implementation Partners & Consultants
        ['Accenture Federal Services', 'Lead', '', 'Reston, VA', '', 'Contract/Perm Roles', '', 'Major Salesforce implementation partner - needs SF architects, developers, and consultants'],
        ['Deloitte Digital', 'Lead', '', 'New York, NY', '', 'Contract/Perm Roles', '', 'Large consulting firm with Salesforce practice - hiring SF Technical Architects and Developers'],
        ['Slalom Consulting', 'Lead', '', 'Seattle, WA', '', 'Contract/Perm Roles', '', 'Digital transformation consultancy - active Salesforce and cloud hiring'],
        ['Cognizant Technology Solutions', 'Lead', '', 'Teaneck, NJ', '', 'Contract/Perm Roles', '', 'Global IT services - large Salesforce and ServiceNow practice'],
        ['Capgemini America', 'Lead', '', 'New York, NY', '', 'Contract/Perm Roles', '', 'Digital transformation leader - hiring SF consultants and cloud architects'],
        ['PwC Digital Services', 'Lead', '', 'New York, NY', '', 'Contract/Perm Roles', '', 'Big 4 consulting with strong Salesforce and ServiceNow practices'],
        ['KPMG Digital Lighthouse', 'Lead', '', 'New York, NY', '', 'Contract/Perm Roles', '', 'Technology consulting arm - needs Salesforce and cloud professionals'],
        ['EY-Parthenon', 'Lead', '', 'New York, NY', '', 'Contract/Perm Roles', '', 'Strategy and technology consulting - active SF and ServiceNow hiring'],
        
        # Salesforce Specialist Partners
        ['Cloud Sherpas (Accenture)', 'Lead', '', 'Atlanta, GA', '', 'Contract/Perm Roles', '', 'Salesforce specialist consultancy - dedicated SF implementation team'],
        ['Bluewolf (IBM)', 'Lead', '', 'New York, NY', '', 'Contract/Perm Roles', '', 'Salesforce consulting specialist - needs SF developers and architects'],
        ['Appirio (Wipro)', 'Lead', '', 'Indianapolis, IN', '', 'Contract/Perm Roles', '', 'Cloud consulting specialist - Salesforce and Workday focus'],
        ['Salesforce Partners LLC', 'Lead', '', 'San Francisco, CA', '', 'Contract/Perm Roles', '', 'Dedicated Salesforce implementation partner'],
        ['CloudAnswers', 'Lead', '', 'Tampa, FL', '', 'Contract/Perm Roles', '', 'Salesforce consulting specialist - growing team'],
        ['Cloudy Consulting', 'Lead', '', 'Chicago, IL', '', 'Contract/Perm Roles', '', 'Mid-size Salesforce partner - active hiring'],
        ['Coastal Cloud', 'Lead', '', 'Fort Lauderdale, FL', '', 'Contract/Perm Roles', '', 'Salesforce implementation specialist'],
        
        # ServiceNow Partners
        ['Snow Software Consulting', 'Lead', '', 'Denver, CO', '', 'Contract/Perm Roles', '', 'ServiceNow implementation specialist - hiring developers and architects'],
        ['ServiceNow Elite Partners', 'Lead', '', 'Austin, TX', '', 'Contract/Perm Roles', '', 'Dedicated ServiceNow consulting practice'],
        ['ITIL Pro Services', 'Lead', '', 'Boston, MA', '', 'Contract/Perm Roles', '', 'ServiceNow and ITSM consulting specialist'],
        ['Crossfuze', 'Lead', '', 'Tampa, FL', '', 'Contract/Perm Roles', '', 'ServiceNow elite partner - active technical hiring'],
        ['Thirdera', 'Lead', '', 'Denver, CO', '', 'Contract/Perm Roles', '', 'ServiceNow specialist consulting firm'],
        
        # SAP Implementation Partners
        ['SAP America Consulting', 'Lead', '', 'Newtown Square, PA', '', 'Contract/Perm Roles', '', 'SAP implementation and consulting - needs ABAP developers, functional consultants'],
        ['Mindtree SAP Practice', 'Lead', '', 'Warren, NJ', '', 'Contract/Perm Roles', '', 'SAP consulting specialist - growing team'],
        ['Infosys SAP Solutions', 'Lead', '', 'Plano, TX', '', 'Contract/Perm Roles', '', 'Major SAP implementation partner'],
        ['TCS SAP Practice', 'Lead', '', 'Cincinnati, OH', '', 'Contract/Perm Roles', '', 'Large SAP consulting practice'],
        ['HCL SAP Services', 'Lead', '', 'Sunnyvale, CA', '', 'Contract/Perm Roles', '', 'SAP implementation and support services'],
        
        # Cloud Implementation Specialists
        ['AWS Professional Services', 'Lead', '', 'Seattle, WA', '', 'Contract/Perm Roles', '', 'AWS consulting and implementation - hiring cloud architects'],
        ['Microsoft Consulting Services', 'Lead', '', 'Redmond, WA', '', 'Contract/Perm Roles', '', 'Azure and Microsoft stack consulting'],
        ['Google Cloud Consulting', 'Lead', '', 'Mountain View, CA', '', 'Contract/Perm Roles', '', 'GCP implementation and consulting services'],
        ['Rackspace Professional Services', 'Lead', '', 'San Antonio, TX', '', 'Contract/Perm Roles', '', 'Multi-cloud consulting and managed services'],
        ['CloudFormation Consulting', 'Lead', '', 'Atlanta, GA', '', 'Contract/Perm Roles', '', 'AWS and cloud consulting specialist'],
        
        # General Systems Integrators
        ['Booz Allen Hamilton', 'Lead', '', 'McLean, VA', '', 'Contract/Perm Roles', '', 'Government contractor - needs enterprise software developers'],
        ['CACI International', 'Lead', '', 'Reston, VA', '', 'Contract/Perm Roles', '', 'Government IT services - enterprise software implementations'],
        ['SAIC', 'Lead', '', 'Reston, VA', '', 'Contract/Perm Roles', '', 'Technology solutions for government and commercial'],
        ['General Dynamics IT', 'Lead', '', 'Fairfax, VA', '', 'Contract/Perm Roles', '', 'Enterprise software implementations and support'],
        ['ManTech International', 'Lead', '', 'Herndon, VA', '', 'Contract/Perm Roles', '', 'Technology solutions and consulting'],
        
        # Digital Transformation Consultants
        ['Publicis Sapient', 'Lead', '', 'Boston, MA', '', 'Contract/Perm Roles', '', 'Digital transformation consultancy - enterprise software focus'],
        ['Avanade', 'Lead', '', 'Seattle, WA', '', 'Contract/Perm Roles', '', 'Microsoft-focused consulting and implementation'],
        ['Sogeti USA', 'Lead', '', 'Plano, TX', '', 'Contract/Perm Roles', '', 'Technology consulting and digital services'],
        ['CGI Federal', 'Lead', '', 'Fairfax, VA', '', 'Contract/Perm Roles', '', 'IT consulting and systems integration'],
        ['Virtusa Corporation', 'Lead', '', 'Westborough, MA', '', 'Contract/Perm Roles', '', 'Digital transformation and technology consulting'],
        
        # Mid-Size Implementation Partners
        ['Simplus (Infosys)', 'Lead', '', 'Salt Lake City, UT', '', 'Contract/Perm Roles', '', 'Salesforce implementation specialist'],
        ['Ad Victoriam Solutions', 'Lead', '', 'Austin, TX', '', 'Contract/Perm Roles', '', 'Salesforce and ServiceNow consulting'],
        ['Perficient', 'Lead', '', 'St. Louis, MO', '', 'Contract/Perm Roles', '', 'Digital transformation consulting - multi-platform'],
        ['West Monroe Partners', 'Lead', '', 'Chicago, IL', '', 'Contract/Perm Roles', '', 'Management and technology consulting'],
        ['Logic20/20', 'Lead', '', 'Seattle, WA', '', 'Contract/Perm Roles', '', 'Business and technology consulting'],
        ['Atos Syntel', 'Lead', '', 'Troy, MI', '', 'Contract/Perm Roles', '', 'Digital transformation and consulting services'],
        
        # Specialized Enterprise Software Consultants
        ['Workday Partners LLC', 'Lead', '', 'San Francisco, CA', '', 'Contract/Perm Roles', '', 'Workday implementation specialist'],
        ['Oracle Consulting Services', 'Lead', '', 'Austin, TX', '', 'Contract/Perm Roles', '', 'Oracle enterprise software implementations'],
        ['Tableau Services Group', 'Lead', '', 'Seattle, WA', '', 'Contract/Perm Roles', '', 'Business intelligence and analytics consulting'],
        ['Qlik Professional Services', 'Lead', '', 'King of Prussia, PA', '', 'Contract/Perm Roles', '', 'Business intelligence consulting and implementation'],
        ['MuleSoft Consulting', 'Lead', '', 'San Francisco, CA', '', 'Contract/Perm Roles', '', 'Integration and API consulting specialist'],
        ['Informatica Services', 'Lead', '', 'Redwood City, CA', '', 'Contract/Perm Roles', '', 'Data management and integration consulting']
    ]
    
    # Combine existing and new companies
    all_companies = existing_companies + new_companies
    
    # Write to new file
    with open('warm_bd_list_expanded.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(all_companies)
    
    print(f"Added {len(new_companies)} consulting/professional services companies")
    print(f"Total companies: {len(all_companies)}")
    print("\nSample of added companies:")
    for i, company in enumerate(new_companies[:10]):
        print(f"{i+1}. {company[0]} - {company[7]}")
    
    print("\nCompany types added:")
    print("- Salesforce implementation partners")
    print("- ServiceNow consulting firms") 
    print("- SAP implementation specialists")
    print("- Cloud consulting companies (AWS, Azure, GCP)")
    print("- Systems integrators")
    print("- Digital transformation consultants")
    print("- Enterprise software specialists")
    
    return len(new_companies)

if __name__ == "__main__":
    add_consulting_firms() 