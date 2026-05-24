import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Memulai pengaturan Teh Sisri & Es Cekek...');

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

  // 2. Ambil semua produk Teh Sisri sachet (non-olahan)
  const sachetProducts = await prisma.product.findMany({
    where: {
      name: { startsWith: 'Teh Sisri', mode: 'insensitive' },
      isProcessed: false
    }
  });

  console.log(`Ditemukan ${sachetProducts.length} produk Teh Sisri sachet di database.`);

  for (const sachet of sachetProducts) {
    // A. Update harga sachet (modal 350, jual 500)
    const updatedSachet = await prisma.product.update({
      where: { id: sachet.id },
      data: {
        costPrice: 350,
        sellPrice: 500
      }
    });
    console.log(`Update sachet: ${updatedSachet.name} -> Modal: Rp ${updatedSachet.costPrice}, Jual: Rp ${updatedSachet.sellPrice}`);

    // B. Tentukan nama & SKU untuk varian Es Cekek
    const escName = `Es Cekek ${sachet.name}`;
    const escSku = sachet.sku ? `ESC-${sachet.sku.replace('TS-', '')}` : `ESC-${Date.now()}`;
    const escRecipe = [{ productId: sachet.id, quantity: 1 }];

    // C. Cari atau buat produk olahan Es Cekek
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
          description: `Es teh seduh cup/plastik dari ${sachet.name}`,
          costPrice: 350,
          sellPrice: 2000,
          isProcessed: true,
          recipe: escRecipe,
          categoryId: category.id
        }
      });
      console.log(`Update olahan: ${escName} (${escSku}) -> Jual: Rp 2000, Resep: 1x ${sachet.name}`);
    } else {
      await prisma.product.create({
        data: {
          sku: escSku,
          name: escName,
          description: `Es teh seduh cup/plastik dari ${sachet.name}`,
          costPrice: 350,
          sellPrice: 2000,
          stock: 0, // stok dinamis dihitung di frontend berdasarkan bahan sachet
          isProcessed: true,
          recipe: escRecipe,
          categoryId: category.id
        }
      });
      console.log(`Tambah olahan: ${escName} (${escSku}) -> Jual: Rp 2000, Resep: 1x ${sachet.name}`);
    }
  }

  console.log('Semua data Teh Sisri & Es Cekek telah dikonfigurasi!');
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
