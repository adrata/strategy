#!/usr/bin/env python3
"""
Data Examination Script for TOP Engineering Plus Data Cleanup
Examines the structure and content of the three Excel files
"""

import pandas as pd
import json
from pathlib import Path

def examine_excel_file(file_path, sheet_name=None):
    """Examine an Excel file and return its structure"""
    print(f"\n{'='*60}")
    print(f"EXAMINING: {file_path}")
    print(f"{'='*60}")
    
    try:
        # Read Excel file
        if sheet_name:
            df = pd.read_excel(file_path, sheet_name=sheet_name)
        else:
            # Get all sheet names first
            xl_file = pd.ExcelFile(file_path)
            print(f"Available sheets: {xl_file.sheet_names}")
            
            # Read the first sheet by default
            df = pd.read_excel(file_path, sheet_name=xl_file.sheet_names[0])
            sheet_name = xl_file.sheet_names[0]
        
        print(f"Sheet: {sheet_name}")
        print(f"Shape: {df.shape} (rows, columns)")
        print(f"Columns: {list(df.columns)}")
        
        # Show data types
        print(f"\nData Types:")
        for col, dtype in df.dtypes.items():
            print(f"  {col}: {dtype}")
        
        # Show first few rows
        print(f"\nFirst 3 rows:")
        print(df.head(3).to_string())
        
        # Show sample data for key columns
        key_columns = ['name', 'email', 'company', 'title', 'phone', 'first_name', 'last_name', 'full_name']
        found_key_columns = [col for col in df.columns if any(key in col.lower() for key in key_columns)]
        
        if found_key_columns:
            print(f"\nSample data for key columns:")
            for col in found_key_columns[:5]:  # Show first 5 key columns
                non_null_count = df[col].notna().sum()
                print(f"  {col}: {non_null_count}/{len(df)} non-null values")
                if non_null_count > 0:
                    sample_values = df[col].dropna().head(3).tolist()
                    print(f"    Sample: {sample_values}")
        
        # Check for duplicates
        if 'email' in df.columns:
            email_duplicates = df['email'].duplicated().sum()
            print(f"\nEmail duplicates: {email_duplicates}")
        
        return df
        
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return None

def main():
    """Main function to examine all data files"""
    data_dir = Path(".")
    
    files_to_examine = [
        "Exported Capsule Contacts 2025-08-29.xlsx",
        "Physical Mailer Campaign 2025-08-29.xlsx", 
        "UTC All Regions 2023.xlsx"
    ]
    
    all_data = {}
    
    for file_name in files_to_examine:
        file_path = data_dir / file_name
        if file_path.exists():
            df = examine_excel_file(file_path)
            if df is not None:
                all_data[file_name] = {
                    'dataframe': df,
                    'columns': list(df.columns),
                    'shape': df.shape
                }
        else:
            print(f"File not found: {file_name}")
    
    # Summary comparison
    print(f"\n{'='*60}")
    print("SUMMARY COMPARISON")
    print(f"{'='*60}")
    
    for file_name, info in all_data.items():
        print(f"\n{file_name}:")
        print(f"  Rows: {info['shape'][0]}")
        print(f"  Columns: {info['shape'][1]}")
        print(f"  Key columns: {[col for col in info['columns'] if any(key in col.lower() for key in ['name', 'email', 'company', 'title', 'phone'])]}")

if __name__ == "__main__":
    main()
