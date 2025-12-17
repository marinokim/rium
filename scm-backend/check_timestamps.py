import pg8000.native
import ssl

def check_timestamps():
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
        print("\n--- Checking Product Table Columns for Timestamps ---")
        columns = con.run("SELECT column_name FROM information_schema.columns WHERE table_name = 'Product'")
        col_names = [c[0] for c in columns]
        
        print(f"Columns found: {col_names}")

        if 'createdAt' in col_names or 'created_at' in col_names: # Prisma uses lowercase or camelCase depending on mapping
             # Prisma schema: createdAt DateTime @default(now())
             # If @map is missing, it expects "createdAt" column if casing is preserved, or "createdat" if not.
             # Postgres is case-insensitive unless quoted.
             # If I see "createdAt", it's quoted. If "createdat", it's unquoted.
             pass
        else:
             print("MISSING createdAt column!")

        has_created_at = 'createdAt' in col_names
        has_updated_at = 'updatedAt' in col_names

        if not has_created_at:
            print("Adding createdAt column...")
            con.run('ALTER TABLE "Product" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP')
            print("Added createdAt.")
        else:
             print("createdAt exists.")
             
        if not has_updated_at:
            print("Adding updatedAt column...")
            con.run('ALTER TABLE "Product" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP')  
            print("Added updatedAt.")
        else:
             print("updatedAt exists.")

        con.close()

    except Exception as e:
        print(f"Connection Failed: {e}")

if __name__ == "__main__":
    check_timestamps()
