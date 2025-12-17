import sys
import os
import ssl
import urllib.parse
sys.path.append(os.path.join(os.getcwd(), 'pylib'))

import pg8000.native

def verify_rium():
    # Credentials from .env (hardcoded here for verification script simplicity based on previous turn)
    # DATABASE_URL="postgresql://postgres.nblwbluowksskuuvaxmu:gmlrhks0528%26%2A@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    # DIRECT_URL="postgresql://postgres.nblwbluowksskuuvaxmu:gmlrhks0528%26%2A@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
    
    # We use DIRECT_URL for schema/verification to avoid pooler transaction mode issues if any
    # user = postgres.nblwbluowksskuuvaxmu
    # host = aws-1-ap-south-1.pooler.supabase.com
    # port = 5432
    # pass = gmlrhks0528&*
    # db = postgres
    
    # Retry pooler connection
    user = "postgres.nblwbluowksskuuvaxmu"
    password = "gmlrhks0528&*"
    host = "aws-1-ap-south-1.pooler.supabase.com"
    port = 6543
    database = "postgres"

    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    print(f"Connecting to {host} as {user}...")
    try:
        con = pg8000.native.Connection(
            user=user,
            password=password,
            host=host,
            port=port,
            database=database,
            ssl_context=ssl_context
        )
        
        # Check DB name and Tables
        db_name = con.run("SELECT current_database()")[0][0]
        print(f"Connected to Database: {db_name}")
        
        print("Checking tables...")
        # public tables
        tables = con.run("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        t_list = [r[0] for r in tables]
        print("Tables found:", t_list)
        
        if not t_list:
            print("Status: Database is EMPTY (Safe for Rium).")
        else:
            print("Status: Database contains tables.")
            if 'products' in t_list and 'categories' in t_list:
                 print("WARNING: This looks like Arontec DB! Check connection!")
            else:
                 print("Tables do not match Arontec structure exactly, but proceed with caution.")

        con.close()
        
    except Exception as e:
        print(f"Connection Failed: {e}")

if __name__ == "__main__":
    verify_rium()
