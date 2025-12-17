import sys
import os
import ssl
sys.path.append(os.path.join(os.getcwd(), 'pylib'))

import pg8000.native

def seed():
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
    try:
        con = pg8000.native.Connection(
            user=user,
            password=password,
            host=host,
            port=port,
            database=database,
            ssl_context=ssl_context
        )
        
        print("Connected.")
        
        # 1. Enable pgcrypto for hashing
        print("Enabling pgcrypto extension...")
        con.run("CREATE EXTENSION IF NOT EXISTS pgcrypto")

        # 2. Insert Users (Admin & Partner)
        print("Seeding Users...")
        # Note: We use crypt() for hashing to match bcrypt behavior expected by Node app
        # $2a$ is bcrypt.
        
        users_sql = """
        INSERT INTO "User" (email, password, name, company, role, "updatedAt", "isApproved")
        VALUES 
        ('admin@rium.co.kr', crypt('admin1234', gen_salt('bf')), 'RIUM Admin', 'RIUM Headquarters', 'ADMIN', NOW(), true),
        ('partner@store.com', crypt('partner1234', gen_salt('bf')), 'Store Partner', 'Lotte Mart Jamsil', 'PARTNER', NOW(), true)
        ON CONFLICT (email) DO NOTHING
        """
        con.run(users_sql)
        print("Users seeded.")
        
        # 3. Insert Categories
        print("Seeding Categories...")
        cats_sql = """
        INSERT INTO "Category" (id, name, slug) VALUES 
        (101, 'Consumer Electronics', 'electronics'),
        (102, 'Home & Living', 'living'),
        (103, 'Food & Beverage', 'food')
        ON CONFLICT (id) DO NOTHING
        """
        con.run(cats_sql)
        print("Categories seeded.")

        # 4. Insert Products
        print("Seeding Products...")
        prods_sql = """
        INSERT INTO "Product" (name, description, price, "categoryId", "imageUrl", "isAvailable", "updatedAt") 
        VALUES 
        ('Smart Air Conditioner', 'High efficiency AC', 1200000, 101, '', true, NOW()),
        ('Wireless Headphones', 'Noise cancelling', 89000, 101, '', true, NOW()),
        ('Organic Coffee Beans', '1kg bag', 15000, 103, '', true, NOW()),
        ('Office Chair', 'Ergonomic design', 150000, 102, '', true, NOW()),
        ('Gaming Monitor', '144Hz IPS Panel', 450000, 101, '', true, NOW())
        ON CONFLICT DO NOTHING
        """
        # Note: Product has no unique key constraints in standard schema usually except ID, 
        # but here we rely on serial ID. We just insert. 
        # To avoid dupes if run multiple times, we might check names? 
        # For simple seed, just insert is fine, or check existence.
        # Let's check existence by name to be cleaner.
        
        # Actually, let's just run it. If duplicates accumulate, it's just test data.
        con.run(prods_sql)
        print("Products seeded.")
        
        # 5. Insert Quote (Linked to Partner)
        # Fetch partner ID
        partner_res = con.run("SELECT id FROM \"User\" WHERE email = 'partner@store.com'")
        if partner_res:
            partner_id = partner_res[0][0]
            
            # Fetch products
            p_res = con.run("SELECT id, price FROM \"Product\" LIMIT 2")
            if len(p_res) >= 2:
                p1_id, p1_price = p_res[0]
                p2_id, p2_price = p_res[1]
                
                check_quote = con.run("SELECT id FROM \"Quote\" WHERE \"quoteNumber\" LIKE 'REQ-%'")
                if not check_quote:
                    print("Seeding Sample Quote...")
                    import datetime
                    qn = f"REQ-{datetime.datetime.now().strftime('%Y%m%d')}-001"
                    total = (p1_price * 2) + (p2_price * 5)
                    
                    # Insert Quote
                    # Retrieving ID via RETURNING is supported by run() if we fetch result
                    q_res = con.run(
                        """INSERT INTO "Quote" ("quoteNumber", "userId", "status", "totalAmount", "updatedAt")
                           VALUES (:qn, :uid, 'PENDING', :total, NOW())
                           RETURNING id""",
                        qn=qn, uid=partner_id, total=total
                    )
                    quote_id = q_res[0][0]
                    
                    # Insert Items
                    con.run("""INSERT INTO "QuoteItem" ("quoteId", "productId", "quantity", "price") VALUES (:qid, :pid, :qty, :pr)""",
                            qid=quote_id, pid=p1_id, qty=2, pr=p1_price)
                    con.run("""INSERT INTO "QuoteItem" ("quoteId", "productId", "quantity", "price") VALUES (:qid, :pid, :qty, :pr)""",
                            qid=quote_id, pid=p2_id, qty=5, pr=p2_price)
                    print("Sample Quote seeded.")
                else:
                    print("Sample Quote already exists.")

        con.close()
        print("Seeding complete.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    seed()
