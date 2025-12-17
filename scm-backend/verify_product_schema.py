import pg8000.native
import ssl

def check_product_schema():
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
        
        # Check Product Table Columns
        print("\n--- Checking Product Table Columns ---")
        columns = con.run("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Product'")
        
        column_map = {col[0]: col[1] for col in columns}
        print(f"Found {len(column_map)} columns.")

        # Check for specific columns used in getProducts
        if 'isAvailable' in column_map: # Note: Prisma maps camelCase to snake_case usually? OR checks exact name?
            # In schema.prisma allowed @map. Let's see if the DB has it.
            # Usually strict DBs use snake_case like is_available.
            # But the previous python script used "name" and "color" which are lowercase.
            # Let's check for 'isAvailable', 'is_available'
            print("Found 'isAvailable' column (exact match).")
        elif 'is_available' in column_map:
            print("Found 'is_available' column.")
        else:
            print("MISSING 'isAvailable' (or is_available) column!")

        if 'categoryId' in column_map:
            print("Found 'categoryId' column.")
        elif 'category_id' in column_map:
             print("Found 'category_id' column.")
        else:
            print("MISSING 'categoryId' column!")

        con.close()

    except Exception as e:
        print(f"Connection Failed: {e}")

if __name__ == "__main__":
    check_product_schema()
