import pg8000.native
import ssl

def migrate_schema():
    print("Connecting to Rium DB...")
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    con = pg8000.native.Connection(
        user="postgres.nblwbluowksskuuvaxmu",
        password="gmlrhks0528",
        host="aws-1-ap-south-1.pooler.supabase.com",
        port=5432,
        database="postgres",
        ssl_context=ssl_context
    )

    print("Connected! Starting migration to add Arontec fields...")

    # Dictionary of new columns: {column_name: data_type}
    new_columns = {
        "brand": "TEXT",
        "model_no": "TEXT",
        "consumer_price": "DOUBLE PRECISION DEFAULT 0",
        "supply_price": "DOUBLE PRECISION DEFAULT 0",
        "stock_quantity": "INTEGER DEFAULT 0",
        "quantity_per_carton": "INTEGER DEFAULT 1",
        "shipping_fee": "DOUBLE PRECISION DEFAULT 0",
        "shipping_fee_individual": "DOUBLE PRECISION DEFAULT 0",
        "shipping_fee_carton": "DOUBLE PRECISION DEFAULT 0",
        "manufacturer": "TEXT",
        "origin": "TEXT",
        "is_tax_free": "BOOLEAN DEFAULT false",
        "detail_url": "TEXT",
        "product_spec": "TEXT",
        "product_options": "TEXT",
        "remarks": "TEXT"
    }

    # Clean legacy columns if needed? No, just add new ones.
    # We treat 'price' as 'b2b_price' (selling price).

    for col, dtype in new_columns.items():
        try:
            # Check if column exists
            check_sql = f"SELECT column_name FROM information_schema.columns WHERE table_name='Product' AND column_name='{col}'"
            # Note: Prisma usually creates tables with capitalized names if model is capitalized? 
            # Let's check init script. usually it quotes them "Product" or uses lower case.
            # In init_rium_schema.py I used: 'CREATE TABLE "Product" ...'
            # So table name is "Product" (case sensitive).
            
            # The check query needs to handle case sensitivity if checking information_schema
            
            print(f"Adding column '{col}'...")
            con.run(f'ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "{col}" {dtype}')
            print(f"Column '{col}' added successfully.")
            
        except Exception as e:
            print(f"Error adding column {col}: {e}")

    print("Migration complete!")
    con.close()

if __name__ == "__main__":
    migrate_schema()
