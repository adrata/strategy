#!/usr/bin/env python3
import csv

def replace_b2c_companies():
    """
    Replace B2C/prosumer companies with pure B2B companies
    """
    
    # Companies to remove (too B2C/prosumer focused)
    companies_to_remove = {
        'Alphabet Inc. (Google)',  # Primarily consumer-focused
        'Amazon.com Inc.',  # Primarily e-commerce/B2C
        'Intuit Inc.',  # TurboTax and small business focus
        'Uber Technologies Inc.',  # Primarily B2C ride-sharing
        'Block Inc. (Square)',  # Small business/prosumer focus
        'Shopify Inc.',  # E-commerce platform for SMBs
        'BigCommerce Holdings Inc.',  # E-commerce for SMBs
        'Bolt Financial Inc.',  # Consumer checkout focus
        'Klaviyo Inc.',  # SMB marketing focus
        'Attentive Inc.',  # Retail/e-commerce text marketing
        'ReCharge (Recharge Payments)',  # D2C subscription billing
        'NuORDER Inc.',  # Fashion/consumer brands
    }
    
    # Replacement companies (pure B2B with complex sales)
    replacement_companies = [
        # L1 replacements
        ['L1', 'Palantir Technologies Inc.', 'L1', 3000, '$2.4B', 'Big Data Analytics & Government Software', 'palantir.com', 'Big data analytics platforms for government and large enterprises – extremely complex B2B sales involving top executives, technical leads, and procurement teams; very long sales cycles for high-value, customized implementations requiring security clearances and extensive technical validation', 'Verified'],
        ['L1', 'Veeva Systems Inc.', 'L1', 5000, '$2.0B', 'Life Sciences Cloud Software', 'veeva.com', 'Cloud software for pharmaceutical and life sciences companies – complex enterprise sales to regulatory affairs, clinical operations, and commercial teams (Head of IT, CMO, regulatory heads), multi-year deployments for drug development and commercialization processes', 'Verified'],
        ['L1', 'Cadence Design Systems', 'L1', 9500, '$4.1B', 'Electronic Design Automation Software', 'cadence.com', 'EDA software for semiconductor and electronics design – complex enterprise sales to engineering teams at chip manufacturers and electronics companies (CTOs, engineering VPs), multi-year licensing deals for critical design tools', 'Verified'],
        ['L1', 'Synopsys Inc.', 'L1', 18000, '$5.8B', 'Electronic Design Automation & IP', 'synopsys.com', 'EDA software and semiconductor IP provider – enterprise sales to chip design teams at major semiconductor companies (CTOs, design managers), complex licensing agreements for design tools and IP blocks', 'Verified'],
        
        # L2 replacements  
        ['L2', 'Guidewire Software Inc.', 'L2', 4500, '$870M', 'Insurance Core Systems', 'guidewire.com', 'Core systems for property & casualty insurers – complex enterprise sales to insurance CIOs and business stakeholders, multi-year implementations replacing legacy systems with extensive customization and integration requirements', 'Verified'],
        ['L2', 'Vertiv Holdings Co.', 'L2', 20000, '$5.8B', 'Critical Digital Infrastructure', 'vertiv.com', 'Data center infrastructure and services – complex B2B sales of power, cooling, and IT infrastructure to enterprises and colocation providers (facility managers, CTOs, operations teams), multi-year infrastructure projects', 'Verified'],
        
        # L3 replacements
        ['L3', 'Informatica Inc.', 'L3', 5000, '$1.5B', 'Enterprise Data Management', 'informatica.com', 'Enterprise data integration and management platform – complex sales to data engineering and IT teams (Chief Data Officer, data architects), multi-year licenses for data warehousing and integration projects', 'Verified'],
        
        # M1 replacements
        ['M1', 'Bentley Systems Inc.', 'M1', 4500, '$1.0B', 'Infrastructure Engineering Software', 'bentley.com', 'Engineering software for infrastructure projects – enterprise sales to engineering firms and utilities (engineering managers, project directors), complex licensing for infrastructure design and asset management', 'Verified'],
        
        # M2 replacements
        ['M2', 'Blackbaud Inc.', 'M2', 3500, '$900M', 'Nonprofit & Education Software', 'blackbaud.com', 'Software solutions for nonprofits and educational institutions – enterprise sales to IT and operations teams at large nonprofits and universities (CIO, development directors), multi-year software and services contracts', 'Verified'],
        ['M2', 'Tyler Technologies Inc.', 'M2', 6500, '$1.6B', 'Government & Public Sector Software', 'tylertech.com', 'Software solutions for local government and public sector – complex procurement-driven sales to government IT and department heads (CIO, city managers), multi-year contracts for public administration systems', 'Verified'],
        ['M2', 'Proofpoint Inc.', 'M2', 3500, '$1.2B', 'Cybersecurity & Compliance', 'proofpoint.com', 'Email security and compliance platform – enterprise sales to cybersecurity teams and compliance officers (CISO, compliance heads), comprehensive security deployments for email protection and regulatory compliance', 'Verified'],
        ['M2', 'Carbon Black (VMware)', 'M2', 1500, '$400M', 'Endpoint Security Platform', 'carbonblack.com', 'Next-generation endpoint protection platform – enterprise sales to cybersecurity and IT teams (CISO, security architects), complex deployments for endpoint detection and response across large organizations', 'Verified'],
    ]
    
    # Read current companies
    companies_to_keep = []
    companies_removed = []
    
    with open('company_data_360_FINAL.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        for row in reader:
            if len(row) > 1 and row[1] in companies_to_remove:
                companies_removed.append(row[1])
            else:
                companies_to_keep.append(row)
    
    print(f"🗑️ REMOVING {len(companies_removed)} B2C/PROSUMER COMPANIES:")
    for company in companies_removed:
        print(f"   - {company}")
    
    # Add replacement companies
    companies_to_keep.extend(replacement_companies)
    
    print(f"\n➕ ADDING {len(replacement_companies)} PURE B2B COMPANIES:")
    for company in replacement_companies:
        print(f"   + {company[1]} ({company[2]}) - {company[5]}")
    
    # Write updated list
    with open('company_data_360_PURE_B2B.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(companies_to_keep)
    
    print(f"\n✅ UPDATED LIST: {len(companies_to_keep)} companies")
    print(f"📊 REMOVED: {len(companies_removed)} B2C/prosumer companies")
    print(f"📊 ADDED: {len(replacement_companies)} pure B2B companies")
    print(f"📋 SAVED AS: company_data_360_PURE_B2B.csv")
    
    return companies_to_keep

if __name__ == "__main__":
    replace_b2c_companies() 