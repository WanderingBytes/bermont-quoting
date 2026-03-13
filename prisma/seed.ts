import 'dotenv/config';
import { hash } from 'bcryptjs';
import pg from 'pg';

async function main() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log('🌱 Seeding database...');

  try {
    // Create admin user
    const passwordHash = await hash('bermont2026', 12);
    await client.query(`
      INSERT INTO "users" (id, email, name, "passwordHash", role, active, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `, ['admin@bermontmaterials.com', 'Bermont Admin', passwordHash, 'ADMIN']);
    console.log('  ✅ Admin user created');

    // Seed materials catalog
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
      await client.query(`
        INSERT INTO "materials" (id, name, slug, "pricePerTon", location, category, description, "isActive", "createdAt", "updatedAt", unit)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, true, NOW(), NOW(), 'ton')
        ON CONFLICT (slug) DO UPDATE SET "pricePerTon" = EXCLUDED."pricePerTon"
      `, [mat.name, mat.slug, mat.pricePerTon, mat.location, mat.category, mat.description]);
    }
    console.log(`  ✅ ${materials.length} materials seeded`);

    console.log('🎉 Seed complete!');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error('Seed error:', e);
  process.exit(1);
});


