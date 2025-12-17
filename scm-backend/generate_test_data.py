import pandas as pd
import os

# Paths
source_path = '/Users/lab/Desktop/Worktemp/arontec-scm/excel/aron_product_upload_consolidated.xlsx'
output_dir = '/Users/lab/Desktop/Worktemp/rium-homepage/test_data'
output_path = os.path.join(output_dir, 'test_products_100.xlsx')

# Ensure output dir
os.makedirs(output_dir, exist_ok=True)

try:
    # Read Excel
    print(f"Reading from {source_path}...")
    df = pd.read_excel(source_path)
    
    # Check rows
    total_rows = len(df)
    print(f"Total rows found: {total_rows}")
    
    # Slice top 100
    df_100 = df.head(100)
    
    # Save
    print(f"Saving top 100 rows to {output_path}...")
    df_100.to_excel(output_path, index=False)
    print("Done.")
    print(f"Created file: {output_path}")

except Exception as e:
    print(f"Error: {e}")
