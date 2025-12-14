import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seeding...');

    // 1. Create Admin User
    const adminEmail = 'admin@rium.co.kr';
    const adminPassword = await bcrypt.hash('admin1234', 10);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            password: adminPassword,
            name: 'RIUM Admin',
            company: 'RIUM Headquarters',
            role: 'ADMIN',
        },
    });

    console.log(`✅ Admin user created: ${admin.email} (Password: admin1234)`);

    // 2. Create Sample Partner User
    const partnerEmail = 'partner@store.com';
    const partnerPassword = await bcrypt.hash('partner1234', 10);

    const partner = await prisma.user.upsert({
        where: { email: partnerEmail },
        update: {},
        create: {
            email: partnerEmail,
            password: partnerPassword,
            name: 'Store Partner',
            company: 'Lotte Mart Jamsil',
            role: 'PARTNER',
        },
    });

    console.log(`✅ Partner user created: ${partner.email} (Password: partner1234)`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
