import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Memulai sinkronisasi master harga & BOM di database...');

  // 1. Cari Kategori "Minuman"
  const category = await prisma.category.findFirst({
    where: { name: { equals: 'Minuman', mode: 'insensitive' } }
  });
  if (!category) {
    throw new Error('Kategori "Minuman" tidak ditemukan!');
  }

  // 2. Siapkan Bahan Baku Tambahan (BOM)
  const straw = await prisma.product.findFirst({ where: { sku: 'MAT-STRAW' } });
  const water = await prisma.product.findFirst({ where: { sku: 'MAT-WATER' } });
  if (!straw || !water) {
    throw new Error('Bahan baku Sedotan/Air belum terdaftar! Silakan jalankan setup-bom-drink terlebih dahulu.');
  }

  const overheadCost = 130; // 50 (sedotan) + 80 (air)

  // 3. Ambil semua sachet Teh Sisri (non-olahan) dan update harganya (modal 350, jual 500)
  console.log('\n--- MENGUPDATE TEH SISRI SACHET & ES CEKEK ---');
  const sisriSachets = await prisma.product.findMany({
    where: { name: { startsWith: 'Teh Sisri', mode: 'insensitive' }, isProcessed: false }
  });
  for (const sachet of sisriSachets) {
    await prisma.product.update({
      where: { id: sachet.id },
      data: { costPrice: 350, sellPrice: 500 }
    });
    console.log(`Sachet: ${sachet.name} -> Modal: 350, Jual: 500`);

    // Update olahan Es Cekek
    const escName = `Es Cekek ${sachet.name}`;
    const escProduct = await prisma.product.findFirst({
      where: { name: { equals: escName, mode: 'insensitive' }, isProcessed: true }
    });
    if (escProduct) {
      await prisma.product.update({
        where: { id: escProduct.id },
        data: {
          costPrice: 350 + overheadCost, // 480
          sellPrice: 2000,
          recipe: [
            { productId: sachet.id, quantity: 1 },
            { productId: straw.id, quantity: 1 },
            { productId: water.id, quantity: 1 }
          ]
        }
      });
      console.log(`  Olahan: ${escName} -> Modal: 480, Jual: 2000`);
    }
  }

  // 4. Ambil semua sachet Good Day Freeze (non-olahan) dan update harganya (modal 2200, jual 3000)
  console.log('\n--- MENGUPDATE GOOD DAY FREEZE SACHET & ES KOPI ---');
  const freezeSachets = await prisma.product.findMany({
    where: { name: { startsWith: 'Good Day Freeze', mode: 'insensitive' }, isProcessed: false }
  });
  for (const sachet of freezeSachets) {
    await prisma.product.update({
      where: { id: sachet.id },
      data: { costPrice: 2200, sellPrice: 3000 }
    });
    console.log(`Sachet: ${sachet.name} -> Modal: 2200, Jual: 3000`);

    // Update olahan Es Kopi Freeze
    const escName = `Es Kopi ${sachet.name}`;
    const escProduct = await prisma.product.findFirst({
      where: { name: { equals: escName, mode: 'insensitive' }, isProcessed: true }
    });
    if (escProduct) {
      await prisma.product.update({
        where: { id: escProduct.id },
        data: {
          costPrice: 2200 + overheadCost, // 2330
          sellPrice: 5000,
          recipe: [
            { productId: sachet.id, quantity: 1 },
            { productId: straw.id, quantity: 1 },
            { productId: water.id, quantity: 1 }
          ]
        }
      });
      console.log(`  Olahan: ${escName} -> Modal: 2330, Jual: 5000`);
    }
  }

  // 5. Ambil semua sachet Good Day Biasa (non-olahan) dan update harganya (modal 1800, jual 2500)
  console.log('\n--- MENGUPDATE GOOD DAY BIASA SACHET & ES KOPI ---');
  const regularSachets = await prisma.product.findMany({
    where: {
      name: { startsWith: 'Good Day', mode: 'insensitive' },
      NOT: { name: { startsWith: 'Good Day Freeze', mode: 'insensitive' } },
      isProcessed: false
    }
  });
  for (const sachet of regularSachets) {
    await prisma.product.update({
      where: { id: sachet.id },
      data: { costPrice: 1800, sellPrice: 2500 }
    });
    console.log(`Sachet: ${sachet.name} -> Modal: 1800, Jual: 2500`);

    // Update olahan Es Kopi Biasa
    const escName = `Es Kopi ${sachet.name}`;
    const escProduct = await prisma.product.findFirst({
      where: { name: { equals: escName, mode: 'insensitive' }, isProcessed: true }
    });
    if (escProduct) {
      await prisma.product.update({
        where: { id: escProduct.id },
        data: {
          costPrice: 1800 + overheadCost, // 1930
          sellPrice: 5000,
          recipe: [
            { productId: sachet.id, quantity: 1 },
            { productId: straw.id, quantity: 1 },
            { productId: water.id, quantity: 1 }
          ]
        }
      });
      console.log(`  Olahan: ${escName} -> Modal: 1930, Jual: 5000`);
    }
  }

  console.log('\nSinkronisasi master selesai dengan sukses!');
}

main()
  .catch((e) => {
    console.error('Gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
