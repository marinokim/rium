import sys
import os
import ssl
sys.path.append(os.path.join(os.getcwd(), 'pylib'))

import pg8000.native

def verify_5432():
    # Credentials matching what I told the user to use
    
    # URL Encoded password? pg8000 expects the RAW password if passed as kwarg.
    # If passed in connection string it expects encoded. 
    # Here we are testing the network connectivity first.
    
    user = "postgres.nblwbluowksskuuvaxmu"
    password = "gmlrhks0528" 
    host = "aws-1-ap-south-1.pooler.supabase.com"
    port = 5432
    database = "postgres"

    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    print(f"Connecting to {host}:{port}...")
    try:
        con = pg8000.native.Connection(
            user=user,
            password=password,
            host=host,
            port=port,
            database=database,
            ssl_context=ssl_context
        )
        
        print("✅ Connected to Port 5432 successfully!")
        
        # Test a query
        res = con.run("SELECT version()")
        print(f"DB Version: {res[0][0]}")
        
        con.close()

    except Exception as e:
        print(f"❌ Connection Failed to 5432: {e}")

if __name__ == "__main__":
    verify_5432()
