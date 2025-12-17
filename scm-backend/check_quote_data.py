import pg8000.native
import ssl

def check_quote_data():
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
        
        # Check Quote Statuses
        print("\n--- Checking Quote Statuses ---")
        statuses = con.run('SELECT status, count(*) FROM "Quote" GROUP BY status')
        print("Existing Statuses:")
        for s in statuses:
            print(f" - {s[0]}: {s[1]}")

        # Check for Invalid Statuses (vs Prisma Enum: PENDING, APPROVED, REJECTED, EXPIRED)
        valid_enum = ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']
        invalid_count = 0
        for s in statuses:
            if s[0] not in valid_enum:
                print(f"WARNING: Found invalid status '{s[0]}'!")
                invalid_count += 1
        
        if invalid_count == 0:
            print("All statuses match Prisma Enum.")
        else:
            print("MISMATCH DETECTED!")

        # Check QuoteItem Orphans
        print("\n--- Checking QuoteItem Foreign Keys ---")
        orphans = con.run("""
            SELECT qi.id, qi."productId" 
            FROM "QuoteItem" qi 
            LEFT JOIN "Product" p ON qi."productId" = p.id 
            WHERE p.id IS NULL
        """)
        if len(orphans) > 0:
            print(f"FOUND {len(orphans)} ORPHAN QUOTE ITEMS!")
            for o in orphans:
                print(f" - ItemID: {o[0]}, ProductID: {o[1]}")
        else:
            print("No orphan QuoteItems found.")

        con.close()

    except Exception as e:
        print(f"Connection Failed: {e}")

if __name__ == "__main__":
    check_quote_data()
