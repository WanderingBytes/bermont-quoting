import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { hash } from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const passwordHash = await hash('bermont2026', 12);
  await prisma.user.upsert({
    where: { email: 'admin@bermontmaterials.com' },
    update: {},
    create: {
      email: 'admin@bermontmaterials.com',
      name: 'Bermont Admin',
      passwordHash,
      role: 'admin',
    },
  });
  console.log('  ✅ Admin user created');

  // Seed materials catalog from recon data
  const materials = [
    { name: 'Fill Dirt (Alico)', slug: 'fill-dirt-alico', pricePerTon: 4.00, location: 'alico', category: 'fill', description: 'General purpose fill dirt from Alico site' },
    { name: 'Fill Dirt (Clarion)', slug: 'fill-dirt', pricePerTon: 5.00, location: 'clarion', category: 'fill', description: 'General purpose fill dirt from Clarion site' },
    { name: 'FDOT B02 Road Base', slug: 'fdot-b02-road-base', pricePerTon: 9.00, location: 'both', category: 'base', description: 'Florida DOT approved B02 road base material' },
    { name: 'Commercial Base', slug: 'commercial-base', pricePerTon: 7.50, location: 'both', category: 'base', description: 'Commercial-grade base material' },
    { name: 'Perc / Septic / Asphalt Sand', slug: 'perc-septic-asphalt-sand', pricePerTon: 8.00, location: 'both', category: 'sand', description: 'Percolation, septic, and asphalt sand' },
    { name: '250 Paver / Washed Shell Screening', slug: '250-paver-washed-shell-screening', pricePerTon: 12.00, location: 'both', category: 'shell', description: 'Fine washed shell screening for pavers' },
    { name: '131 Rock Screenings', slug: '131-rock-screenings', pricePerTon: 7.00, location: 'both', category: 'stone', description: 'Fine rock screenings' },
    { name: 'Small Washed Shell', slug: 'small-washed-shell', pricePerTon: 15.00, location: 'both', category: 'shell', description: 'Small-grade washed shell for driveways and landscaping' },
    { name: 'Medium Washed Shell', slug: 'medium-washed-shell', pricePerTon: 16.00, location: 'both', category: 'shell', description: 'Medium-grade washed shell for decorative use' },
    { name: 'Unwashed Commercial 89 Stone', slug: 'commercial-89-stone', pricePerTon: 18.00, location: 'both', category: 'stone', description: 'Unwashed #89 commercial stone aggregate' },
    { name: 'Unwashed Commercial 57 Stone', slug: 'commercial-57-stone', pricePerTon: 20.00, location: 'both', category: 'stone', description: 'Unwashed #57 commercial stone aggregate' },
    { name: 'Commercial Ballast Rock', slug: 'commercial-ballast-rock', pricePerTon: 25.00, location: 'both', category: 'stone', description: 'Heavy-duty ballast rock for rail and infrastructure' },
    { name: 'Rip Rap 3-6"', slug: 'rip-rap-3-6', pricePerTon: 30.50, location: 'both', category: 'rip-rap', description: '3 to 6 inch rip rap for erosion control' },
    { name: 'Rip Rap 6-12"', slug: 'rip-rap-6-12', pricePerTon: 32.50, location: 'both', category: 'rip-rap', description: '6 to 12 inch rip rap for seawalls and heavy erosion control' },
  ];

  for (const mat of materials) {
    await prisma.material.upsert({
      where: { slug: mat.slug },
      update: { pricePerTon: mat.pricePerTon },
      create: mat,
    });
  }
  console.log(`  ✅ ${materials.length} materials seeded`);

  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
