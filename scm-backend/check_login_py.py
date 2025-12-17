import sys
import os
import ssl
sys.path.append(os.path.join(os.getcwd(), 'pylib'))

import pg8000.native

def check_login():
    # Credentials from .env (hardcoded here for simplicity matching verified config)
    user = "postgres.nblwbluowksskuuvaxmu"
    password = "gmlrhks0528&*"
    host = "aws-1-ap-south-1.pooler.supabase.com"
    port = 6543
    database = "postgres"

    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    print(f"Connecting to {host}...")
    try:
        con = pg8000.native.Connection(
            user=user,
            password=password,
            host=host,
            port=port,
            database=database,
            ssl_context=ssl_context
        )
        
        email = 'admin@rium.co.kr'
        input_password = 'admin1234'
        
        print(f"Checking user: {email}")
        
        # 1. Fetch user
        res = con.run("SELECT id, password, role FROM \"User\" WHERE email = :email", email=email)
        
        if not res:
            print("❌ User not found!")
            return
            
        uid, stored_hash, role = res[0]
        print(f"✅ User found: ID={uid}, Role={role}")
        print(f"Stored Hash: {stored_hash}")
        
        # 2. Compare password using DB's pgcrypto if possible, or just trying to insert hash comparison?
        # Since we don't have bcrypt in python here, we can ask the DB to compare:
        # SELECT (password = crypt('plain', password)) AS match FROM "User" WHERE id = ...
        
        match_res = con.run(
            "SELECT (password = crypt(:input_pass, password)) as match FROM \"User\" WHERE id = :uid",
            input_pass=input_password, uid=uid
        )
        
        is_match = match_res[0][0]
        
        if is_match:
            print("✅ Password Match! Login verification successful.")
        else:
            print("❌ Password Mismatch via crypt() comparison.")
            print(f"Stored Hash: {stored_hash}")
            
        con.close()

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_login()
