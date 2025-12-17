import sys
import os
import ssl
sys.path.append(os.path.join(os.getcwd(), 'pylib'))

import pg8000.native

def init_schema():
    # Credentials
    user = "postgres.nblwbluowksskuuvaxmu"
    password = "gmlrhks0528&*"
    host = "aws-1-ap-south-1.pooler.supabase.com"
    port = 6543
    database = "postgres"

    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    print(f"Connecting to {host}...")
    con = pg8000.native.Connection(
        user=user,
        password=password,
        host=host,
        port=port,
        database=database,
        ssl_context=ssl_context
    )

    print("Connected. creating schema...")

    # SQL Statements
    statements = [
        # Enums
        "CREATE TYPE \"Role\" AS ENUM ('ADMIN', 'PARTNER')",
        "CREATE TYPE \"QuoteStatus\" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')",
        
        # Category
        """CREATE TABLE "Category" (
            "id" SERIAL PRIMARY KEY,
            "name" TEXT NOT NULL,
            "slug" TEXT NOT NULL
        )""",
        "CREATE UNIQUE INDEX \"Category_slug_key\" ON \"Category\"(\"slug\")",

        # User
        """CREATE TABLE "User" (
            "id" SERIAL PRIMARY KEY,
            "email" TEXT NOT NULL,
            "password" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "company" TEXT,
            "role" "Role" NOT NULL DEFAULT 'PARTNER',
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            "isApproved" BOOLEAN NOT NULL DEFAULT false
        )""",
        "CREATE UNIQUE INDEX \"User_email_key\" ON \"User\"(\"email\")",

        # Product
        """CREATE TABLE "Product" (
            "id" SERIAL PRIMARY KEY,
            "name" TEXT NOT NULL,
            "description" TEXT,
            "price" DOUBLE PRECISION NOT NULL,
            "categoryId" INTEGER NOT NULL REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
            "imageUrl" TEXT,
            "isAvailable" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL
        )""",

        # Cart
        """CREATE TABLE "Cart" (
            "id" SERIAL PRIMARY KEY,
            "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
            "productId" INTEGER NOT NULL REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
            "quantity" INTEGER NOT NULL,
            "option" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL
        )""",
        "CREATE UNIQUE INDEX \"Cart_userId_productId_option_key\" ON \"Cart\"(\"userId\", \"productId\", \"option\")",

        # Quote
        """CREATE TABLE "Quote" (
            "id" SERIAL PRIMARY KEY,
            "quoteNumber" TEXT NOT NULL,
            "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
            "status" "QuoteStatus" NOT NULL DEFAULT 'PENDING',
            "totalAmount" DOUBLE PRECISION NOT NULL,
            "validUntil" TIMESTAMP(3),
            "message" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL
        )""",
        "CREATE UNIQUE INDEX \"Quote_quoteNumber_key\" ON \"Quote\"(\"quoteNumber\")",

        # QuoteItem
        """CREATE TABLE "QuoteItem" (
            "id" SERIAL PRIMARY KEY,
            "quoteId" INTEGER NOT NULL REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
            "productId" INTEGER NOT NULL REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
            "quantity" INTEGER NOT NULL,
            "price" DOUBLE PRECISION NOT NULL
        )"""
    ]

    for sql in statements:
        try:
            print(f"Executing: {sql[:50]}...")
            con.run(sql)
        except Exception as e:
            print(f"Error: {e}")
            # Continue? Maybe Enums exist
            if "already exists" in str(e):
                print("Skipping (already exists)")
            else:
                # Critical error
                print("Stopping.")
                break

    print("Schema initialization complete.")
    
    # Verify
    tables = con.run("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    print("Tables created:", [r[0] for r in tables])
    con.close()

if __name__ == "__main__":
    init_schema()
