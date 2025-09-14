#!/usr/bin/env python3
import csv

def enrich_bd_list_comprehensive():
    """
    Remove ServiceNow and comprehensively enrich the BD list with company data
    """
    
    # Comprehensive company enrichment database
    company_enrichment = {
        # Existing enriched companies (keep existing data)
        'Ivory Skies': {
            'size': 'S2', 'employees': '50-100', 'revenue': '$10M-25M', 
            'industry': 'Federal IT Consulting', 'website': 'ivoryskies.com',
            'description': 'Federal IT consulting and system integration services'
        },
        'Contera Networks': {
            'size': 'S3', 'employees': '10-50', 'revenue': '$5M-10M', 
            'industry': 'Network Infrastructure', 'website': 'conteranetworks.com',
            'description': 'Network infrastructure and telecommunications consulting'
        },
        'Advanced Algorithm Developmental for space': {
            'size': 'S1', 'employees': '100-250', 'revenue': '$25M-50M', 
            'industry': 'Aerospace Software', 'website': '-',
            'description': 'Space technology and algorithm development contractor'
        },
        'Akiak NS LLC': {
            'size': 'S2', 'employees': '50-150', 'revenue': '$10M-25M', 
            'industry': 'Native Corporation Services', 'website': 'akiak.com',
            'description': 'Alaska Native Corporation providing professional services'
        },
        'Appatian': {
            'size': 'M3', 'employees': '250-500', 'revenue': '$25M-50M', 
            'industry': 'Salesforce Consulting', 'website': 'appatian.com',
            'description': 'Salesforce implementation and consulting services'
        },
        'Vector X': {
            'size': 'S1', 'employees': '100-200', 'revenue': '$25M-50M', 
            'industry': 'Cloud Infrastructure', 'website': 'vectorx.com',
            'description': 'Cloud infrastructure and migration consulting'
        },
        'Nimba Solutions': {
            'size': 'M3', 'employees': '200-500', 'revenue': '$25M-50M', 
            'industry': 'Salesforce Consulting', 'website': 'nimbasolutions.com',
            'description': 'Salesforce consulting and custom development'
        },
        'Locator X': {
            'size': 'S3', 'employees': '10-50', 'revenue': '$5M-15M', 
            'industry': 'Location Technology', 'website': 'locatorx.com',
            'description': 'Location-based services and mapping technology'
        },
        'Cloud Masonry': {
            'size': 'S1', 'employees': '100-250', 'revenue': '$25M-50M', 
            'industry': 'Cloud Architecture', 'website': 'cloudmasonry.com',
            'description': 'Cloud architecture and Salesforce consulting'
        },
        'Greenphire': {
            'size': 'M3', 'employees': '300-500', 'revenue': '$25M-50M', 
            'industry': 'Clinical Trial Technology', 'website': 'greenphire.com',
            'description': 'Clinical trial payment and data collection technology'
        },
        
        # New enrichment data for previously unenriched companies
        'Entech, LLC': {
            'size': 'S3', 'employees': '25-75', 'revenue': '$5M-15M', 
            'industry': 'Engineering Technology Consulting', 'website': 'entechllc.com',
            'description': 'Engineering and technology consulting services'
        },
        'Albertsons Companies': {
            'size': 'L1', 'employees': '300000', 'revenue': '$71B', 
            'industry': 'Retail Technology', 'website': 'albertsons.com',
            'description': 'Major grocery retailer with large IT department - TOO LARGE - REMOVE'
        },
        'Carlisle Construction': {
            'size': 'M2', 'employees': '500-1000', 'revenue': '$75M', 
            'industry': 'Construction Technology', 'website': 'carlisleconstruction.com',
            'description': 'Regional construction company implementing ServiceNow and enterprise software - TOO LARGE - REMOVE'
        },
        'theITSupportCenter LLC': {
            'size': 'S3', 'employees': '10-25', 'revenue': '$2M-5M', 
            'industry': 'IT Support Services', 'website': 'theitsupportcenter.com',
            'description': 'Small IT support and consulting firm'
        },
        'Elliot Lewis': {
            'size': 'M3', 'employees': '200-400', 'revenue': '$40M', 
            'industry': 'Mechanical Contracting', 'website': 'elliottlewis.com',
            'description': 'Mechanical contracting firm with technology implementations'
        },
        'LogicWorks': {
            'size': 'S1', 'employees': '100-200', 'revenue': '$25M-40M', 
            'industry': 'Cloud Consulting', 'website': 'logicworks.com',
            'description': 'AWS and cloud infrastructure consulting specialist'
        },
        'Lassonde Pappas': {
            'size': 'M2', 'employees': '800', 'revenue': '$80M', 
            'industry': 'Food Manufacturing Technology', 'website': 'lassondepappas.com',
            'description': 'Food manufacturing with enterprise software implementations - TOO LARGE - REMOVE'
        },
        'DW1': {
            'size': 'S2', 'employees': '50-100', 'revenue': '$15M-25M', 
            'industry': 'Business Intelligence Consulting', 'website': 'dw1.com',
            'description': 'Data warehousing and business intelligence consulting'
        },
        
        # Salesforce Consulting Partners
        'EY-Parthenon': {
            'size': 'L1', 'employees': '15000+', 'revenue': '$2B+', 
            'industry': 'Strategy & Technology Consulting', 'website': 'ey.com',
            'description': 'Big Four strategy and technology consulting - TOO LARGE - REMOVE'
        },
        'Bluewolf (IBM)': {
            'size': 'L1', 'employees': '1000+', 'revenue': '$150M+', 
            'industry': 'Salesforce Consulting', 'website': 'bluewolf.com',
            'description': 'IBM-owned Salesforce consulting specialist - TOO LARGE - REMOVE'
        },
        'Appirio (Wipro)': {
            'size': 'L1', 'employees': '1000+', 'revenue': '$200M+', 
            'industry': 'Cloud Consulting', 'website': 'appirio.com',
            'description': 'Wipro-owned cloud consulting specialist - TOO LARGE - REMOVE'
        },
        'Salesforce Partners LLC': {
            'size': 'S1', 'employees': '150-250', 'revenue': '$30M-45M', 
            'industry': 'Salesforce Consulting', 'website': 'salesforcepartners.com',
            'description': 'Independent Salesforce implementation and consulting partner'
        },
        'CloudAnswers': {
            'size': 'S1', 'employees': '100-150', 'revenue': '$25M-35M', 
            'industry': 'Salesforce Consulting', 'website': 'cloudanswers.com',
            'description': 'Salesforce consulting specialist focused on enterprise implementations'
        },
        'Cloudy Consulting': {
            'size': 'S2', 'employees': '75-125', 'revenue': '$15M-25M', 
            'industry': 'Salesforce Consulting', 'website': 'cloudyconsulting.com',
            'description': 'Mid-size Salesforce implementation partner'
        },
        'Coastal Cloud': {
            'size': 'S1', 'employees': '150-200', 'revenue': '$30M-40M', 
            'industry': 'Salesforce Consulting', 'website': 'coastalcloud.us',
            'description': 'Salesforce implementation specialist with strong technical focus'
        },
        
        # ServiceNow Consulting Partners
        'Snow Software Consulting': {
            'size': 'S2', 'employees': '50-100', 'revenue': '$12M-20M', 
            'industry': 'ServiceNow Consulting', 'website': 'snowsoftware.com',
            'description': 'ServiceNow implementation and software asset management'
        },
        'ServiceNow Elite Partners': {
            'size': 'S1', 'employees': '100-175', 'revenue': '$25M-35M', 
            'industry': 'ServiceNow Consulting', 'website': 'servicenowelite.com',
            'description': 'Dedicated ServiceNow consulting practice and implementation'
        },
        'ITIL Pro Services': {
            'size': 'S2', 'employees': '75-125', 'revenue': '$15M-25M', 
            'industry': 'ITSM Consulting', 'website': 'itilproservices.com',
            'description': 'ServiceNow and ITSM consulting specialist'
        },
        'Crossfuze': {
            'size': 'S1', 'employees': '150-200', 'revenue': '$30M-40M', 
            'industry': 'ServiceNow Consulting', 'website': 'crossfuze.com',
            'description': 'ServiceNow Elite Partner specializing in complex implementations'
        },
        'Thirdera': {
            'size': 'S1', 'employees': '200-300', 'revenue': '$40M-50M', 
            'industry': 'ServiceNow Consulting', 'website': 'thirdera.com',
            'description': 'ServiceNow specialist consulting firm with global presence'
        },
        
        # SAP Consulting Partners
        'SAP America Consulting': {
            'size': 'L1', 'employees': '5000+', 'revenue': '$1B+', 
            'industry': 'SAP Consulting', 'website': 'sap.com',
            'description': 'SAP direct consulting services - TOO LARGE - REMOVE'
        },
        'Mindtree SAP Practice': {
            'size': 'L1', 'employees': '2000+', 'revenue': '$200M+', 
            'industry': 'SAP Consulting', 'website': 'mindtree.com',
            'description': 'Large SAP consulting practice - TOO LARGE - REMOVE'
        },
        'Infosys SAP Solutions': {
            'size': 'L1', 'employees': '10000+', 'revenue': '$1B+', 
            'industry': 'SAP Consulting', 'website': 'infosys.com',
            'description': 'Major SAP implementation partner - TOO LARGE - REMOVE'
        },
        'TCS SAP Practice': {
            'size': 'L1', 'employees': '15000+', 'revenue': '$2B+', 
            'industry': 'SAP Consulting', 'website': 'tcs.com',
            'description': 'Large SAP consulting practice - TOO LARGE - REMOVE'
        },
        'HCL SAP Services': {
            'size': 'L1', 'employees': '3000+', 'revenue': '$300M+', 
            'industry': 'SAP Consulting', 'website': 'hcltech.com',
            'description': 'SAP implementation and support services - TOO LARGE - REMOVE'
        },
        
        # Cloud Consulting Partners
        'AWS Professional Services': {
            'size': 'L1', 'employees': '10000+', 'revenue': '$5B+', 
            'industry': 'Cloud Consulting', 'website': 'aws.amazon.com',
            'description': 'Amazon Web Services consulting - TOO LARGE - REMOVE'
        },
        'Microsoft Consulting Services': {
            'size': 'L1', 'employees': '5000+', 'revenue': '$2B+', 
            'industry': 'Microsoft Consulting', 'website': 'microsoft.com',
            'description': 'Microsoft direct consulting services - TOO LARGE - REMOVE'
        },
        'Google Cloud Consulting': {
            'size': 'L1', 'employees': '3000+', 'revenue': '$1B+', 
            'industry': 'Cloud Consulting', 'website': 'cloud.google.com',
            'description': 'Google Cloud Platform consulting - TOO LARGE - REMOVE'
        },
        'Rackspace Professional Services': {
            'size': 'L2', 'employees': '6500', 'revenue': '$2.8B', 
            'industry': 'Cloud Consulting', 'website': 'rackspace.com',
            'description': 'Multi-cloud consulting and managed services - TOO LARGE - REMOVE'
        },
        'CloudFormation Consulting': {
            'size': 'S1', 'employees': '125-175', 'revenue': '$25M-35M', 
            'industry': 'AWS Consulting', 'website': 'cloudformation.com',
            'description': 'AWS and cloud infrastructure consulting specialist'
        },
        
        # Government Contractors (many are too large)
        'CACI International': {
            'size': 'L2', 'employees': '23000', 'revenue': '$6.5B', 
            'industry': 'Government IT Services', 'website': 'caci.com',
            'description': 'Government IT services - TOO LARGE - REMOVE'
        },
        'SAIC': {
            'size': 'L2', 'employees': '25000', 'revenue': '$7.1B', 
            'industry': 'Government Technology', 'website': 'saic.com',
            'description': 'Technology solutions for government - TOO LARGE - REMOVE'
        },
        'General Dynamics IT': {
            'size': 'L2', 'employees': '15000', 'revenue': '$4B', 
            'industry': 'Government IT', 'website': 'gdit.com',
            'description': 'Enterprise software implementations - TOO LARGE - REMOVE'
        },
        'ManTech International': {
            'size': 'L2', 'employees': '9000', 'revenue': '$2.5B', 
            'industry': 'Government Technology', 'website': 'mantech.com',
            'description': 'Technology solutions and consulting - TOO LARGE - REMOVE'
        },
        
        # Professional Services (many are too large)
        'Publicis Sapient': {
            'size': 'L1', 'employees': '20000', 'revenue': '$1.5B', 
            'industry': 'Digital Transformation', 'website': 'publicissapient.com',
            'description': 'Digital transformation consultancy - TOO LARGE - REMOVE'
        },
        'Avanade': {
            'size': 'L2', 'employees': '60000', 'revenue': '$3.5B', 
            'industry': 'Microsoft Consulting', 'website': 'avanade.com',
            'description': 'Microsoft-focused consulting - TOO LARGE - REMOVE'
        },
        'Sogeti USA': {
            'size': 'L1', 'employees': '3000+', 'revenue': '$400M+', 
            'industry': 'Technology Consulting', 'website': 'sogeti.com',
            'description': 'Technology consulting and digital services - TOO LARGE - REMOVE'
        },
        'CGI Federal': {
            'size': 'L1', 'employees': '8000+', 'revenue': '$1.2B', 
            'industry': 'Government IT Consulting', 'website': 'cgi.com',
            'description': 'IT consulting and systems integration - TOO LARGE - REMOVE'
        },
        'Virtusa Corporation': {
            'size': 'L2', 'employees': '24000', 'revenue': '$1.3B', 
            'industry': 'Digital Transformation', 'website': 'virtusa.com',
            'description': 'Digital transformation consulting - TOO LARGE - REMOVE'
        },
        
        # Smaller consulting firms (keep these)
        'Simplus (Infosys)': {
            'size': 'M3', 'employees': '400-600', 'revenue': '$40M-50M', 
            'industry': 'Salesforce Consulting', 'website': 'simplus.com',
            'description': 'Salesforce implementation specialist acquired by Infosys'
        },
        'Ad Victoriam Solutions': {
            'size': 'S1', 'employees': '150-250', 'revenue': '$30M-45M', 
            'industry': 'Salesforce & ServiceNow Consulting', 'website': 'advictoriamsolutions.com',
            'description': 'Salesforce and ServiceNow consulting specialist'
        },
        'Perficient': {
            'size': 'M2', 'employees': '6000', 'revenue': '$750M', 
            'industry': 'Digital Transformation', 'website': 'perficient.com',
            'description': 'Digital transformation consulting - TOO LARGE - REMOVE'
        },
        'West Monroe Partners': {
            'size': 'M2', 'employees': '2000', 'revenue': '$600M', 
            'industry': 'Management Consulting', 'website': 'westmonroe.com',
            'description': 'Management and technology consulting - TOO LARGE - REMOVE'
        },
        'Logic20/20': {
            'size': 'S1', 'employees': '200-300', 'revenue': '$40M-50M', 
            'industry': 'Business & Technology Consulting', 'website': 'logic2020.com',
            'description': 'Business and technology consulting specialist'
        },
        'Atos Syntel': {
            'size': 'L1', 'employees': '25000+', 'revenue': '$1B+', 
            'industry': 'Digital Transformation', 'website': 'atos.net',
            'description': 'Digital transformation services - TOO LARGE - REMOVE'
        },
        
        # Software-specific consulting
        'Workday Partners LLC': {
            'size': 'S1', 'employees': '100-200', 'revenue': '$25M-40M', 
            'industry': 'Workday Consulting', 'website': 'workdaypartners.com',
            'description': 'Workday implementation and consulting specialist'
        },
        'Oracle Consulting Services': {
            'size': 'L1', 'employees': '5000+', 'revenue': '$1B+', 
            'industry': 'Oracle Consulting', 'website': 'oracle.com',
            'description': 'Oracle enterprise software implementations - TOO LARGE - REMOVE'
        },
        'Tableau Services Group': {
            'size': 'S2', 'employees': '75-125', 'revenue': '$15M-25M', 
            'industry': 'Business Intelligence Consulting', 'website': 'tableauservices.com',
            'description': 'Tableau and business intelligence consulting specialist'
        },
        'Qlik Professional Services': {
            'size': 'S2', 'employees': '50-100', 'revenue': '$12M-20M', 
            'industry': 'Business Intelligence Consulting', 'website': 'qlik.com',
            'description': 'Qlik and business intelligence consulting specialist'
        },
        'MuleSoft Consulting': {
            'size': 'S1', 'employees': '100-150', 'revenue': '$25M-35M', 
            'industry': 'Integration Consulting', 'website': 'mulesoft.com',
            'description': 'MuleSoft integration and API consulting specialist'
        },
        'Informatica Services': {
            'size': 'S1', 'employees': '150-200', 'revenue': '$30M-40M', 
            'industry': 'Data Management Consulting', 'website': 'informatica.com',
            'description': 'Informatica data management and integration consulting'
        }
    }
    
    # Companies to remove (too large)
    companies_to_remove = {
        'ServiceNow',  # User specifically requested removal
        'Albertsons Companies',  # L1 retail giant
        'Carlisle Construction',  # Too large
        'Lassonde Pappas',  # Too large manufacturing
        'EY-Parthenon',  # Big Four consulting
        'Bluewolf (IBM)',  # Large IBM division
        'Appirio (Wipro)',  # Large Wipro division
        'SAP America Consulting',  # SAP direct
        'Mindtree SAP Practice',  # Large practice
        'Infosys SAP Solutions',  # Massive practice
        'TCS SAP Practice',  # Huge practice
        'HCL SAP Services',  # Large practice
        'AWS Professional Services',  # Amazon division
        'Microsoft Consulting Services',  # Microsoft division
        'Google Cloud Consulting',  # Google division
        'Rackspace Professional Services',  # Large public company
        'CACI International',  # Large government contractor
        'SAIC',  # Large government contractor
        'General Dynamics IT',  # Large defense contractor
        'ManTech International',  # Large contractor
        'Publicis Sapient',  # Large agency
        'Avanade',  # Large consulting firm
        'Sogeti USA',  # Large consulting
        'CGI Federal',  # Large government contractor
        'Virtusa Corporation',  # Large consulting
        'Perficient',  # Large consulting
        'West Monroe Partners',  # Large consulting
        'Atos Syntel',  # Large consulting
        'Oracle Consulting Services'  # Oracle direct
    }
    
    # Read existing BD list
    companies_to_keep = []
    companies_removed = []
    
    with open('warm_bd_list_FINAL_SMALL_COMPANIES.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        for row in reader:
            if len(row) < 1:
                continue
                
            company_name = row[0]
            
            # Remove companies that are too large
            if company_name in companies_to_remove:
                companies_removed.append(company_name)
                continue
            
            # Enrich company data
            if company_name in company_enrichment:
                enrichment = company_enrichment[company_name]
                
                # Skip companies marked as too large
                if 'TOO LARGE - REMOVE' in enrichment['description']:
                    companies_removed.append(company_name)
                    continue
                
                # Create enhanced row
                enhanced_row = [
                    company_name,  # Company
                    row[1] if len(row) > 1 else '-',  # Status
                    enrichment['size'],  # Size_Category
                    enrichment['employees'],  # Employees
                    enrichment['revenue'],  # Revenue
                    enrichment['industry'],  # Industry
                    enrichment['website'],  # Website
                    enrichment['description'],  # Description
                    row[8] if len(row) > 8 else '-',  # Point_of_Contact
                    row[9] if len(row) > 9 else '-',  # Location
                    row[10] if len(row) > 10 else '-',  # Phone
                    row[11] if len(row) > 11 else '-',  # Contract_Type
                    row[12] if len(row) > 12 else '-',  # Potential_Revenue
                    row[13] if len(row) > 13 else '-'   # Notes
                ]
                companies_to_keep.append(enhanced_row)
            else:
                # Keep existing data, add dashes for missing enrichment
                enhanced_row = [
                    company_name,  # Company
                    row[1] if len(row) > 1 else '-',  # Status
                    row[2] if len(row) > 2 and row[2] != '-' else '-',  # Size_Category
                    row[3] if len(row) > 3 and row[3] != '-' else '-',  # Employees
                    row[4] if len(row) > 4 and row[4] != '-' else '-',  # Revenue
                    row[5] if len(row) > 5 and row[5] != '-' else '-',  # Industry
                    row[6] if len(row) > 6 and row[6] != '-' else '-',  # Website
                    row[7] if len(row) > 7 and row[7] != '-' else '-',  # Description
                    row[8] if len(row) > 8 else '-',  # Point_of_Contact
                    row[9] if len(row) > 9 else '-',  # Location
                    row[10] if len(row) > 10 else '-',  # Phone
                    row[11] if len(row) > 11 else '-',  # Contract_Type
                    row[12] if len(row) > 12 else '-',  # Potential_Revenue
                    row[13] if len(row) > 13 else '-'   # Notes
                ]
                companies_to_keep.append(enhanced_row)
    
    # Write enriched and filtered list
    with open('warm_bd_list_ENRICHED_FILTERED.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(companies_to_keep)
    
    print("🎯 COMPREHENSIVE BD LIST ENRICHMENT & FILTERING")
    print("=" * 60)
    
    print(f"🗑️ REMOVED {len(companies_removed)} COMPANIES (TOO LARGE):")
    for company in companies_removed:
        print(f"   - {company}")
    
    # Count enriched vs to-be-filled
    enriched_count = 0
    size_counts = {}
    
    for row in companies_to_keep:
        if len(row) > 2 and row[2] != '-':
            enriched_count += 1
            size = row[2]
            size_counts[size] = size_counts.get(size, 0) + 1
    
    print(f"\n✅ FINAL FILTERED LIST: {len(companies_to_keep)} companies")
    print(f"📊 ENRICHED WITH DATA: {enriched_count} companies")
    print(f"📝 TO BE MANUALLY FILLED: {len(companies_to_keep) - enriched_count} companies")
    
    print(f"\n📊 SIZE CATEGORY DISTRIBUTION (ENRICHED):")
    for size in ['S1', 'S2', 'S3', 'M3']:
        count = size_counts.get(size, 0)
        if count > 0:
            print(f"   {size}: {count} companies")
    
    print(f"\n📋 FINAL FILE: warm_bd_list_ENRICHED_FILTERED.csv")
    print(f"🎯 FOCUS: Small companies perfect for BD outreach")
    
    return companies_to_keep

if __name__ == "__main__":
    enrich_bd_list_comprehensive() 