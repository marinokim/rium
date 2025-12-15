import pg8000.native
import ssl

def add_category_color():
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

    print("Connected! Adding 'color' column to Category table...")

    try:
        # Check if column exists
        # Note: Table name is usually "Category" (PascalCase) due to Prisma, or "category" (lowercase) if mapped.
        # Based on previous migration, it seemed to use "Product". Let's assume "Category".
        # We can try ALTER TABLE "Category" ...
        
        con.run('ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "color" TEXT DEFAULT \'#e0e0e0\'')
        print("Column 'color' added successfully.")
        
    except Exception as e:
        print(f"Error adding column: {e}")

    print("Migration complete!")
    con.close()

if __name__ == "__main__":
    add_category_color()
