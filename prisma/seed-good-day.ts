import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const goodDayVariants = [
  // Varian Reguler (3-in-1)
  { sku: 'GD-CAPPUCCINO', name: 'Good Day Cappuccino', description: 'Kopi instan cappuccino dengan tambahan cokelat granule' },
  { sku: 'GD-MOCACINNO', name: 'Good Day Mocacinno', description: 'Kopi instan rasa mocacinno manis cokelat kopi' },
  { sku: 'GD-VANILLA-LATTE', name: 'Good Day Vanilla Latte', description: 'Kopi instan rasa vanilla latte yang lembut dan harum' },
  { sku: 'GD-CHOCOCINNO', name: 'Good Day Chococinno', description: 'Kopi instan rasa cokelat kopi chococinno' },
  { sku: 'GD-CARIBBEAN-NUT', name: 'Good Day Caribbean Nut', description: 'Kopi instan dengan rasa gurih kacang Karibia' },
  { sku: 'GD-COOLIN', name: 'Good Day Coolin Coffee', description: 'Kopi instan dengan sensasi rasa dingin mint yang segar' },
  { sku: 'GD-ROCKSALT-CARAMEL', name: 'Good Day Rock Salt Caramello', description: 'Kopi instan rasa karamel asin gurih manis' },
  { sku: 'GD-ORIGINAL', name: 'Good Day Original', description: 'Kopi instan rasa kopi original manis dan krimer' },

  // Varian Freeze (Larut Air Dingin)
  { sku: 'GDF-COOKIES-CREAM', name: 'Good Day Freeze Cookies n Cream', description: 'Kopi instan dingin rasa kukis krim manis' },
  { sku: 'GDF-HAZELNUT', name: 'Good Day Freeze Hazelnut Macchiato', description: 'Kopi instan dingin rasa hazelnut macchiato gurih' },
  { sku: 'GDF-CHOC-ORANGE', name: 'Good Day Freeze Choc Orange', description: 'Kopi instan dingin perpaduan rasa cokelat dan jeruk segar' },
  { sku: 'GDF-MOCAFRIO', name: 'Good Day Freeze Mocafrio', description: 'Kopi instan dingin rasa mocafrio yang mantap' },

  // Varian Duet
  { sku: 'GDD-MOCA-CHOCO', name: 'Good Day Duet Moca Choco', description: 'Kopi instan kombinasi moca dan choco dalam satu sachet' },
  { sku: 'GDD-MOCA-CARAMEL', name: 'Good Day Duet Moca Caramel', description: 'Kopi instan kombinasi moca dan karamel manis' }
];

async function main() {
  console.log('Memulai seeding varian Kopi Good Day...');

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

  // 2. Masukkan produk Kopi Good Day
  let count = 0;
  for (const variant of goodDayVariants) {
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
          costPrice: 1500,
          sellPrice: 2500,
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
          costPrice: 1500,
          sellPrice: 2500,
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

  console.log(`Selesai! Berhasil memproses ${count} varian Kopi Good Day.`);
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
