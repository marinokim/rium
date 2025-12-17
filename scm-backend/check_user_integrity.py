import pg8000.native
import ssl

def check_user_integrity():
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
        
        # Check User Table Columns
        print("\n--- Checking User Table Columns ---")
        cols = con.run("SELECT column_name FROM information_schema.columns WHERE table_name = 'User'")
        user_cols = [c[0] for c in cols]
        print(f"User columns: {user_cols}")

        if 'company' not in user_cols:
             print("MISSING 'company' column in User table!")
        
        # Check Quote -> User Orphans
        print("\n--- Checking Quote -> User Foreign Keys ---")
        orphans = con.run("""
            SELECT q.id, q."userId" 
            FROM "Quote" q 
            LEFT JOIN "User" u ON q."userId" = u.id 
            WHERE u.id IS NULL
        """)
        
        if len(orphans) > 0:
            print(f"FOUND {len(orphans)} ORPHAN QUOTES (User mismatch)!")
            for o in orphans:
                print(f" - QuoteID: {o[0]}, UserID: {o[1]}")
        else:
            print("No orphan Quotes (User integrity OK).")

        con.close()

    except Exception as e:
        print(f"Connection Failed: {e}")

if __name__ == "__main__":
    check_user_integrity()
