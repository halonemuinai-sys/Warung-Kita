import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const tehSisriVariants = [
  { sku: 'TS-MELATI', name: 'Teh Sisri Melati', description: 'Teh instan rasa melati yang harum dan segar' },
  { sku: 'TS-MANIS', name: 'Teh Sisri Manis', description: 'Es teh manis instan rasa tradisional' },
  { sku: 'TS-GULABATU', name: 'Teh Sisri Gula Batu', description: 'Teh instan dengan sensasi manis gula batu' },
  { sku: 'TS-GULATEBU', name: 'Teh Sisri Gula Tebu', description: 'Teh instan manis dengan gula tebu alami' },
  { sku: 'TS-APEL', name: 'Teh Sisri Apel', description: 'Teh instan rasa buah apel segar' },
  { sku: 'TS-LEMON', name: 'Teh Sisri Lemon', description: 'Teh instan rasa lemon dengan keasaman segar' },
  { sku: 'TS-BLACKCURRANT', name: 'Teh Sisri Blackcurrant', description: 'Teh instan rasa buah blackcurrant harum' },
  { sku: 'TS-CINCAU', name: 'Teh Sisri Cincau', description: 'Teh instan rasa cincau tradisional yang menyejukkan' },
  { sku: 'TS-LEMONCOLA', name: 'Teh Sisri Lemon Cola', description: 'Kombinasi unik rasa teh lemon dan cola' },
  { sku: 'TS-MANGGA', name: 'Teh Sisri Mangga', description: 'Teh instan rasa buah mangga manis' },
  { sku: 'TS-EXTRACT', name: 'Teh Sisri Extract', description: 'Es teh instan rasa teh alami yang pekat' }
];

async function main() {
  console.log('Memulai seeding varian Teh Sisri...');

  // 1. Cari atau buat Kategori "Minuman"
  let category = await prisma.category.findFirst({
    where: { name: { equals: 'Minuman', mode: 'insensitive' } }
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Minuman',
        desc: 'Aneka minuman segar dan sachet',
        color: 'from-amber-400 to-orange-600',
        icon: '🍹'
      }
    });
    console.log(`Kategori "Minuman" baru dibuat dengan ID: ${category.id}`);
  } else {
    console.log(`Kategori "Minuman" ditemukan dengan ID: ${category.id}`);
  }

  // 2. Masukkan produk Teh Sisri
  let count = 0;
  for (const variant of tehSisriVariants) {
    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: variant.sku },
          { name: { equals: variant.name, mode: 'insensitive' } }
        ]
      }
    });

    if (existingProduct) {
      // Update
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          sku: variant.sku,
          name: variant.name,
          description: variant.description,
          costPrice: 500,
          sellPrice: 1500,
          categoryId: category.id,
          imageUrl: null,
          isProcessed: false
        }
      });
      console.log(`Produk diperbarui: ${variant.name} (${variant.sku})`);
    } else {
      // Create new
      await prisma.product.create({
        data: {
          sku: variant.sku,
          name: variant.name,
          description: variant.description,
          costPrice: 500,
          sellPrice: 1500,
          stock: 50, // default stock awal
          categoryId: category.id,
          imageUrl: null,
          isProcessed: false
        }
      });
      console.log(`Produk ditambahkan: ${variant.name} (${variant.sku})`);
    }
    count++;
  }

  console.log(`Selesai! Berhasil memproses ${count} varian Teh Sisri.`);
}

main()
  .catch((e) => {
    console.error('Gagal melakukan seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
