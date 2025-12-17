import pg8000.native
import ssl

def check_orphans():
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
        
        # Check for products with invalid categoryId
        print("\n--- Checking for Orphan Products ---")
        orphans = con.run("""
            SELECT p.id, p."name", p."categoryId" 
            FROM "Product" p 
            LEFT JOIN "Category" c ON p."categoryId" = c.id 
            WHERE c.id IS NULL
        """)
        
        if len(orphans) > 0:
            print(f"FOUND {len(orphans)} ORPHAN PRODUCTS! (categoryId mismatch)")
            for o in orphans:
                print(f" - ID: {o[0]}, Name: {o[1]}, CategoryId: {o[2]}")
        else:
            print("No orphan products found. FK integrity looks good.")

        con.close()

    except Exception as e:
        print(f"Connection Failed: {e}")

if __name__ == "__main__":
    check_orphans()
