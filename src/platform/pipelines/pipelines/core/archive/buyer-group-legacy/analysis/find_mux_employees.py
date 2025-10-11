#!/usr/bin/env python3
import csv
import json
import re
from collections import defaultdict
from difflib import SequenceMatcher

class MuxCompanyFinder:
    """Specialized finder for Mux company employees"""
    
    def __init__(self):
        self.companies_by_id = defaultdict(list)
        self.companies_by_name = defaultdict(list)
        self.companies_by_url = defaultdict(list)
        self.companies_by_location = defaultdict(list)
        
    def load_data(self, filepath):
        """Load LinkedIn data"""
        print("📊 Loading LinkedIn data...")
        
        with open(filepath, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row_num, row in enumerate(reader, 1):
                try:
                    self._process_row(row, row_num)
                except Exception as e:
                    continue
    
    def _process_row(self, row, row_num):
        """Process a single row of LinkedIn data"""
        experience_str = row.get('experience', '')
        if not experience_str or experience_str == 'experience':
            return
            
        try:
            # Clean JSON string
            experience_str = experience_str.replace('""', '"')
            if experience_str.startswith('"') and experience_str.endswith('"'):
                experience_str = experience_str[1:-1]
            
            experiences = json.loads(experience_str)
            
            for exp in experiences:
                self._add_company_data(exp, row, row_num)
                
        except json.JSONDecodeError:
            pass
    
    def _add_company_data(self, exp, row, row_num):
        """Add company data to indexes"""
        company_name = exp.get('company', '').strip()
        company_id = exp.get('company_id', '').strip()
        location = exp.get('location', '').strip()
        url = exp.get('url', '').strip()
        
        person_data = {
            'row': row_num,
            'person_name': row.get('name', ''),
            'title': exp.get('title', ''),
            'start_date': exp.get('start_date', ''),
            'end_date': exp.get('end_date', ''),
            'location': location,
            'company_name': company_name,
            'company_id': company_id,
            'url': url
        }
        
        # Index by company ID
        if company_id:
            self.companies_by_id[company_id].append(person_data)
        
        # Index by company name
        if company_name:
            self.companies_by_name[company_name].append(person_data)
        
        # Index by URL
        if url:
            self.companies_by_url[url].append(person_data)
        
        # Index by location
        if location:
            self.companies_by_location[location].append(person_data)
    
    def find_mux_employees(self):
        """
        Find all employees at Mux using multiple identification strategies
        """
        print("\n🎯 Finding Mux Employees")
        print("=" * 40)
        
        results = []
        
        # Strategy 1: Use LinkedIn Company ID (most reliable)
        mux_company_id = "mux"
        if mux_company_id in self.companies_by_id:
            id_results = self.companies_by_id[mux_company_id]
            results.extend(id_results)
            print(f"✅ Found {len(id_results)} people using LinkedIn company ID: {mux_company_id}")
        
        # Strategy 2: Use LinkedIn Company URL
        mux_url = "https://www.linkedin.com/company/mux/"
        if mux_url in self.companies_by_url:
            url_results = self.companies_by_url[mux_url]
            results.extend(url_results)
            print(f"✅ Found {len(url_results)} people using company URL: {mux_url}")
        
        # Strategy 3: Use exact company name match
        exact_names = ["Mux", "MUX", "mux"]
        for name in exact_names:
            if name in self.companies_by_name:
                name_results = self.companies_by_name[name]
                results.extend(name_results)
                print(f"✅ Found {len(name_results)} people using exact company name: {name}")
        
        # Strategy 4: Use fuzzy matching for similar names
        fuzzy_results = self._fuzzy_match_mux()
        if fuzzy_results:
            results.extend(fuzzy_results)
            print(f"✅ Found {len(fuzzy_results)} people using fuzzy name matching")
        
        # Strategy 5: Search for companies that might be Mux-related
        related_results = self._find_related_companies()
        if related_results:
            results.extend(related_results)
            print(f"✅ Found {len(related_results)} people in potentially related companies")
        
        # Remove duplicates and return
        unique_results = self._remove_duplicates(results)
        
        return unique_results
    
    def _fuzzy_match_mux(self, threshold=0.7):
        """Find companies with names similar to Mux"""
        results = []
        target_name = "mux"
        
        for name in self.companies_by_name.keys():
            normalized_name = re.sub(r'[^\w\s]', '', name.lower())
            similarity = SequenceMatcher(None, target_name, normalized_name).ratio()
            
            if similarity >= threshold and similarity < 1.0:
                company_results = self.companies_by_name[name]
                results.extend(company_results)
                print(f"   🔍 Fuzzy match: '{name}' (similarity: {similarity:.2f})")
        
        return results
    
    def _find_related_companies(self):
        """Find companies that might be related to Mux"""
        results = []
        
        # Look for companies that might be Mux subsidiaries, divisions, or related entities
        related_keywords = [
            "mux", "video", "streaming", "media", "broadcast", "content"
        ]
        
        for name in self.companies_by_name.keys():
            name_lower = name.lower()
            for keyword in related_keywords:
                if keyword in name_lower and "mux" in name_lower:
                    company_results = self.companies_by_name[name]
                    results.extend(company_results)
                    print(f"   🔍 Related company found: '{name}'")
                    break
        
        return results
    
    def _remove_duplicates(self, people_list):
        """Remove duplicate people based on row number"""
        seen = set()
        unique = []
        for person in people_list:
            if person['row'] not in seen:
                seen.add(person['row'])
                unique.append(person)
        return unique
    
    def analyze_mux_results(self, employees):
        """Analyze the Mux employee results"""
        if not employees:
            print("\n❌ No Mux employees found in the dataset")
            return
        
        print(f"\n📊 Mux Employee Analysis")
        print("=" * 40)
        print(f"Total unique employees found: {len(employees)}")
        
        # Analyze by location
        locations = defaultdict(int)
        for emp in employees:
            location = emp.get('location', 'Unknown')
            locations[location] += 1
        
        print(f"\n📍 Employee Locations:")
        for location, count in sorted(locations.items(), key=lambda x: x[1], reverse=True):
            print(f"  • {location}: {count} employees")
        
        # Analyze by job titles
        titles = defaultdict(int)
        for emp in employees:
            title = emp.get('title', 'Unknown')
            titles[title] += 1
        
        print(f"\n💼 Job Titles:")
        for title, count in sorted(titles.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"  • {title}: {count} employees")
        
        # Show sample employees
        print(f"\n👥 Sample Employees:")
        for i, emp in enumerate(employees[:5], 1):
            print(f"  {i}. {emp['person_name']} - {emp['title']}")
            print(f"     Location: {emp.get('location', 'Unknown')}")
            print(f"     Company: {emp.get('company_name', 'Unknown')}")
            if emp.get('company_id'):
                print(f"     Company ID: {emp['company_id']}")
            print()
    
    def search_similar_companies(self):
        """Search for companies with similar names to Mux"""
        print(f"\n🔍 Searching for companies similar to 'Mux'")
        print("=" * 50)
        
        similar_companies = []
        target = "mux"
        
        for name in self.companies_by_name.keys():
            name_lower = name.lower()
            
            # Check for exact substring match
            if target in name_lower:
                similar_companies.append((name, 1.0, "exact substring"))
            # Check for similarity
            else:
                similarity = SequenceMatcher(None, target, name_lower).ratio()
                if similarity > 0.5:
                    similar_companies.append((name, similarity, "fuzzy match"))
        
        # Sort by similarity
        similar_companies.sort(key=lambda x: x[1], reverse=True)
        
        print(f"Found {len(similar_companies)} companies similar to 'Mux':")
        for name, similarity, match_type in similar_companies[:10]:
            employee_count = len(self.companies_by_name[name])
            print(f"  • {name} (similarity: {similarity:.2f}, {match_type}, {employee_count} employees)")

def main():
    """Main function to demonstrate Mux employee finding"""
    print("🎯 Mux Company Employee Finder")
    print("=" * 50)
    
    # Initialize finder
    finder = MuxCompanyFinder()
    
    # Load data
    finder.load_data('data/linkedin/LinkedIn people profiles.csv')
    
    print(f"\n📊 Data Loaded:")
    print(f"• Total companies: {len(finder.companies_by_name)}")
    print(f"• Companies with IDs: {len(finder.companies_by_id)}")
    print(f"• Companies with URLs: {len(finder.companies_by_url)}")
    
    # Search for similar companies first
    finder.search_similar_companies()
    
    # Find Mux employees
    mux_employees = finder.find_mux_employees()
    
    # Analyze results
    finder.analyze_mux_results(mux_employees)
    
    # Provide recommendations
    print(f"\n💡 Recommendations for Finding Mux Employees:")
    print("1. Use LinkedIn company ID 'mux' as primary identifier")
    print("2. Use LinkedIn URL 'https://www.linkedin.com/company/mux/' as backup")
    print("3. Search for exact name matches: 'Mux', 'MUX', 'mux'")
    print("4. Use fuzzy matching for similar company names")
    print("5. Consider location data to disambiguate if multiple Mux companies exist")
    print("6. Cross-reference with job titles related to video/streaming/media")
    
    if not mux_employees:
        print(f"\n⚠️  No Mux employees found in this dataset.")
        print("This could mean:")
        print("• Mux employees are not in this specific LinkedIn dataset")
        print("• The company might be listed under a different name")
        print("• The dataset might be from a different time period")
        print("• Mux might be a newer company not represented in this data")

if __name__ == "__main__":
    main() 