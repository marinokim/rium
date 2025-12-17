import pg8000.native
import ssl

def check_nulls():
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
        
        # Check for NULLs in isAvailable
        print("\n--- Checking for NULL isAvailable ---")
        nulls = con.run('SELECT count(*) FROM "Product" WHERE "isAvailable" IS NULL')
        print(f"Products with NULL isAvailable: {nulls[0][0]}")

        if nulls[0][0] > 0:
            print("Fixing NULLs...")
            con.run('UPDATE "Product" SET "isAvailable" = true WHERE "isAvailable" IS NULL')
            print("Fixed.")

        con.close()

    except Exception as e:
        print(f"Connection Failed: {e}")

if __name__ == "__main__":
    check_nulls()
