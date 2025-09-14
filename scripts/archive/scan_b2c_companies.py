#!/usr/bin/env python3
import csv

def scan_for_b2c_companies():
    """
    Scan the 360 company list for companies that might be B2C or prosumer focused
    """
    
    # Companies that might be too B2C/prosumer focused
    potentially_b2c_companies = []
    
    with open('company_data_360_FINAL.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        for row in reader:
            if len(row) < 2:
                continue
                
            company_name = row[1]
            description = row[7] if len(row) > 7 else ''
            
            # Check for potential B2C indicators
            b2c_indicators = [
                'consumer', 'retail', 'individual', 'personal', 'turbotax', 
                'ride-sharing', 'e-commerce', 'small business', 'prosumer',
                'individual users', 'consumers', 'retail customers'
            ]
            
            # Check if company might be too B2C focused
            if any(indicator in description.lower() for indicator in b2c_indicators):
                potentially_b2c_companies.append({
                    'company': company_name,
                    'category': row[2],
                    'description': description[:100] + '...' if len(description) > 100 else description
                })
            
            # Specific companies we should review
            review_companies = [
                'intuit', 'uber', 'amazon', 'alphabet', 'google', 'tesla',
                'airbnb', 'doordash', 'lyft', 'spotify', 'netflix', 'meta',
                'facebook', 'twitter', 'instagram', 'tiktok', 'snapchat'
            ]
            
            if any(review in company_name.lower() for review in review_companies):
                potentially_b2c_companies.append({
                    'company': company_name,
                    'category': row[2],
                    'description': description[:100] + '...' if len(description) > 100 else description,
                    'reason': 'Known consumer-focused company'
                })
    
    print("🔍 POTENTIALLY B2C/PROSUMER COMPANIES TO REVIEW:")
    print("=" * 60)
    
    for company in potentially_b2c_companies:
        print(f"\n📍 {company['company']} ({company['category']})")
        print(f"   Description: {company['description']}")
        if 'reason' in company:
            print(f"   Reason: {company['reason']}")
    
    print(f"\n📊 Total companies to review: {len(potentially_b2c_companies)}")
    
    return potentially_b2c_companies

if __name__ == "__main__":
    scan_for_b2c_companies() 