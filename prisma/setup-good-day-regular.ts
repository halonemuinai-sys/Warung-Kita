import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Memulai pengaturan Kopi Good Day Biasa & Es Kopi...');

  // 1. Cari Kategori "Minuman"
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
  }

  // 2. Ambil semua produk Good Day sachet (non-olahan, exclude Good Day Freeze)
  const sachetProducts = await prisma.product.findMany({
    where: {
      name: { startsWith: 'Good Day', mode: 'insensitive' },
      NOT: {
        name: { startsWith: 'Good Day Freeze', mode: 'insensitive' }
      },
      isProcessed: false
    }
  });

  console.log(`Ditemukan ${sachetProducts.length} produk Kopi Good Day biasa (sachet) di database.`);

  for (const sachet of sachetProducts) {
    // A. Update harga sachet (modal 1800, jual 2500)
    const updatedSachet = await prisma.product.update({
      where: { id: sachet.id },
      data: {
        costPrice: 1800,
        sellPrice: 2500
      }
    });
    console.log(`Update sachet: ${updatedSachet.name} -> Modal: Rp ${updatedSachet.costPrice}, Jual: Rp ${updatedSachet.sellPrice}`);

    // B. Tentukan nama & SKU untuk varian Es Kopi
    const escName = `Es Kopi ${sachet.name}`;
    const escSku = sachet.sku ? `ESC-${sachet.sku}` : `ESC-GD-${Date.now()}`;
    const escRecipe = [{ productId: sachet.id, quantity: 1 }];

    // C. Cari atau buat produk olahan Es Kopi
    const existingEsc = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: escSku },
          { name: { equals: escName, mode: 'insensitive' } }
        ]
      }
    });

    if (existingEsc) {
      await prisma.product.update({
        where: { id: existingEsc.id },
        data: {
          sku: escSku,
          name: escName,
          description: `Es kopi seduh dingin dari ${sachet.name}`,
          costPrice: 1800,
          sellPrice: 5000,
          isProcessed: true,
          recipe: escRecipe,
          categoryId: category.id
        }
      });
      console.log(`Update olahan: ${escName} (${escSku}) -> Jual: Rp 5000, Resep: 1x ${sachet.name}`);
    } else {
      await prisma.product.create({
        data: {
          sku: escSku,
          name: escName,
          description: `Es kopi seduh dingin dari ${sachet.name}`,
          costPrice: 1800,
          sellPrice: 5000,
          stock: 0, // stok dinamis dihitung di frontend berdasarkan bahan sachet
          isProcessed: true,
          recipe: escRecipe,
          categoryId: category.id
        }
      });
      console.log(`Tambah olahan: ${escName} (${escSku}) -> Jual: Rp 5000, Resep: 1x ${sachet.name}`);
    }
  }

  console.log('Semua data Kopi Good Day Biasa & Es Kopi telah dikonfigurasi!');
}

main()
  .catch((e) => {
    console.error('Terjadi kesalahan:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
