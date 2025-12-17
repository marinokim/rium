import pg8000.native
import ssl

def check_quote_schema():
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
        
        # Check Quote Table
        print("\n--- Checking Quote Table ---")
        quotes = con.run("SELECT column_name FROM information_schema.columns WHERE table_name = 'Quote'")
        quote_cols = [c[0] for c in quotes]
        print(f"Quote columns: {quote_cols}")
        
        if 'createdAt' not in quote_cols and 'created_at' not in quote_cols:
             print("MISSING createdAt in Quote!") # Logic: orderBy depends on it
        
        # Check QuoteItem Table
        print("\n--- Checking QuoteItem Table ---")
        items = con.run("SELECT column_name FROM information_schema.columns WHERE table_name = 'QuoteItem'")
        item_cols = [c[0] for c in items]
        print(f"QuoteItem columns: {item_cols}")

        con.close()

    except Exception as e:
        print(f"Connection Failed: {e}")

if __name__ == "__main__":
    check_quote_schema()
