import sys
import os
import ssl
import socket
sys.path.append(os.path.join(os.getcwd(), 'pylib'))

import pg8000.native

def verify_direct():
    user = "postgres"
    password = "gmlrhks0528"
    host = "db.nblwbluowksskuuvaxmu.supabase.co" # Standard direct host
    port = 5432
    database = "postgres"

    print(f"Resolving {host}...")
    try:
        # Check if IPv4 is available
        addr_info = socket.getaddrinfo(host, port, socket.AF_INET)
        ipv4 = addr_info[0][4][0]
        print(f"✅ Resolved to IPv4: {ipv4}")
        
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE

        print(f"Connecting to {host} (Direct IPv4)...")
        con = pg8000.native.Connection(
            user=user,
            password=password,
            host=host,
            port=port,
            database=database,
            ssl_context=ssl_context
        )
        print("✅ Connected to Direct Host successfully!")
        con.close()
        
    except socket.gaierror:
        print("❌ Could not resolve to IPv4 (Likely IPv6 Only)")
    except Exception as e:
        print(f"❌ Connection Failed: {e}")

if __name__ == "__main__":
    verify_direct()
