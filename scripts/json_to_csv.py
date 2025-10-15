#!/usr/bin/env python3
"""
JSON to CSV Converter

Converts notary data from JSON format to CSV format.
Handles badges array by converting to pipe-separated string.
"""

import json
import csv
import sys
import os
from pathlib import Path


def convert_badges_to_string(badges):
    """Convert badges array to pipe-separated string."""
    if not badges or len(badges) == 0:
        return ""
    return "|".join(str(badge) for badge in badges)


def json_to_csv(input_file, output_file):
    """
    Convert JSON file to CSV format.
    
    Args:
        input_file (str): Path to input JSON file
        output_file (str): Path to output CSV file
    """
    try:
        # Read JSON data
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not isinstance(data, list):
            raise ValueError("JSON file must contain an array of objects")
        
        if len(data) == 0:
            print("Warning: JSON file is empty")
            return
        
        # Get field names from first record
        fieldnames = list(data[0].keys())
        
        # Ensure consistent field order
        ordered_fields = ['name', 'title', 'company', 'city', 'state', 'phone', 'email', 'image_url', 'badges']
        fieldnames = [field for field in ordered_fields if field in fieldnames]
        
        # Write CSV data
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            
            # Write header
            writer.writeheader()
            
            # Write data rows
            for record in data:
                # Create a copy of the record to modify
                csv_record = {}
                
                for field in fieldnames:
                    value = record.get(field)
                    
                    # Handle badges array conversion
                    if field == 'badges':
                        csv_record[field] = convert_badges_to_string(value)
                    else:
                        # Handle null values
                        csv_record[field] = value if value is not None else ""
                
                writer.writerow(csv_record)
        
        print(f"Successfully converted {len(data)} records from {input_file} to {output_file}")
        
    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in file '{input_file}': {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


def main():
    """Main function with command line argument support."""
    # Default paths
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    default_input = project_root / "data" / "data_notary.json"
    default_output = project_root / "data" / "data_notary.csv"
    
    # Parse command line arguments
    if len(sys.argv) == 1:
        # Use default paths
        input_file = str(default_input)
        output_file = str(default_output)
    elif len(sys.argv) == 3:
        # Use provided paths
        input_file = sys.argv[1]
        output_file = sys.argv[2]
    else:
        print("Usage: python json_to_csv.py [input_file] [output_file]")
        print(f"Default: python json_to_csv.py {default_input} {default_output}")
        sys.exit(1)
    
    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' does not exist")
        sys.exit(1)
    
    # Create output directory if it doesn't exist
    output_dir = os.path.dirname(output_file)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Convert JSON to CSV
    json_to_csv(input_file, output_file)


if __name__ == "__main__":
    main()