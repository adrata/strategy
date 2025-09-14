#!/usr/bin/env python3
import pandas as pd
import os

def read_warm_bd_list():
    try:
        # Read the Excel file
        df = pd.read_excel('WARM B.D LIST.xlsx')
        
        print(f"Shape: {df.shape}")
        print(f"Columns: {list(df.columns)}")
        print("\nFirst few rows:")
        print(df.head(10))
        
        print("\nSample of all data:")
        print(df.to_string())
        
        # Save as CSV for easier viewing
        df.to_csv('warm_bd_list_raw.csv', index=False)
        print(f"\nSaved as CSV: warm_bd_list_raw.csv")
        
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        print("You may need to install openpyxl: pip install openpyxl")

if __name__ == "__main__":
    read_warm_bd_list() 