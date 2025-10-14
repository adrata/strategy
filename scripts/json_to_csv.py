#!/usr/bin/env python3
"""
JSON to CSV Converter
Converts data_notary.json to data_notary.csv format
"""

import json
import csv
import sys
from pathlib import Path


def convert_json_to_csv(json_file_path, csv_file_path):
    """
    Convert JSON file to CSV format
    
    Args:
        json_file_path (str): Path to input JSON file
        csv_file_path (str): Path to output CSV file
    """
    try:
        # Read JSON file
        with open(json_file_path, 'r', encoding='utf-8') as json_file:
            data = json.load(json_file)
        
        # Define CSV columns (excluding badges)
        fieldnames = ['name', 'title', 'company', 'city', 'state', 'phone', 'email', 'image_url']
        
        # Write CSV file
        with open(csv_file_path, 'w', newline='', encoding='utf-8') as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            
            # Write header
            writer.writeheader()
            
            # Write data rows
            for record in data:
                # Create row with only the specified fields, handling null values
                row = {}
                for field in fieldnames:
                    value = record.get(field)
                    # Convert None to empty string for CSV
                    row[field] = value if value is not None else ''
                
                writer.writerow(row)
        
        print(f"Successfully converted {len(data)} records from {json_file_path} to {csv_file_path}")
        
    except FileNotFoundError:
        print(f"Error: File {json_file_path} not found")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {json_file_path}: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


def main():
    """Main function"""
    # Get the directory where this script is located
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    # Define file paths
    json_file = project_root / "data_notary.json"
    csv_file = project_root / "data_notary.csv"
    
    # Check if JSON file exists
    if not json_file.exists():
        print(f"Error: {json_file} not found")
        sys.exit(1)
    
    # Convert JSON to CSV
    convert_json_to_csv(str(json_file), str(csv_file))


if __name__ == "__main__":
    main()
