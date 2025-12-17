import pg8000.native
import ssl

def check_db_status():
    print("Connecting to Rium DB...")
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    try:
        con = pg8000.native.Connection(
            user="postgres.nblwbluowksskuuvaxmu",
            password="gmlrhks0528",
            host="aws-1-ap-south-1.pooler.supabase.com",
            port=5432,
            database="postgres",
            ssl_context=ssl_context
        )
        
        # 1. Check Category Table Columns
        print("\n--- Checking Category Table Columns ---")
        columns = con.run("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Category'")
        found_color = False
        for col in columns:
            print(f"Column: {col[0]}, Type: {col[1]}")
            if col[0] == 'color':
                found_color = True
        
        if found_color:
            print("SUCCESS: 'color' column found in Category table.")
        else:
            print("FAILURE: 'color' column MISSING in Category table behavior.")

        # 2. Try fetching Products (like GET /api/products)
        print("\n--- Testing Product Fetch ---")
        try:
            products = con.run("SELECT id, name FROM \"Product\" LIMIT 5")
            print(f"Successfully fetched {len(products)} products.")
        except Exception as e:
            print(f"Failed to fetch products: {e}")

        con.close()

    except Exception as e:
        print(f"Connection Failed: {e}")

if __name__ == "__main__":
    check_db_status()
