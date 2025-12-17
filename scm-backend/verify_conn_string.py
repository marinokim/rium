import sys
import os
import ssl
import urllib.parse
sys.path.append(os.path.join(os.getcwd(), 'pylib'))

import pg8000.native

def verify_string():
    # The string we gave the user
    conn_str = "postgresql://postgres.nblwbluowksskuuvaxmu:gmlrhks0528%26%2A@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
    
    # Parse it manually to mimic what a driver does
    # Remove prefix
    if conn_str.startswith("postgresql://"):
        conn_str = conn_str[len("postgresql://"):]
        
    # Split user:pass @ host:port / db
    try:
        auth_part, rest = conn_str.split("@")
        user_enc, pass_enc = auth_part.split(":")
        
        host_port, db_part = rest.split("/")
        host, port = host_port.split(":")
        database = db_part
        
        # Decode
        user = urllib.parse.unquote(user_enc)
        password = urllib.parse.unquote(pass_enc)
        
        print(f"Parsed User: {user}")
        print(f"Parsed Pass: {password}") # Should be gmlrhks0528&*
        print(f"Parsed Host: {host}")
        print(f"Parsed Port: {port}")
        print(f"Parsed DB: {database}")

        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE

        print(f"Connecting...")
        con = pg8000.native.Connection(
            user=user,
            password=password,
            host=host,
            port=int(port),
            database=database,
            ssl_context=ssl_context
        )
        print("✅ Connection Successful via Parsed String!")
        con.close()
        
    except Exception as e:
        print(f"❌ Verification Failed: {e}")

if __name__ == "__main__":
    verify_string()
