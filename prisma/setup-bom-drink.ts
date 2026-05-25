import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Memulai penyusunan BOM (Bahan Baku) Minuman...');

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
  }

  // 2. Buat atau Update Sedotan
  let straw = await prisma.product.findFirst({
    where: { sku: 'MAT-STRAW' }
  });
  if (!straw) {
    straw = await prisma.product.create({
      data: {
        sku: 'MAT-STRAW',
        name: 'Sedotan Plastik',
        description: 'Sedotan untuk minuman es',
        costPrice: 50,
        sellPrice: 0,
        stock: 500,
        isProcessed: false,
        categoryId: category.id
      }
    });
    console.log(`Bahan baku baru dibuat: ${straw.name} (SKU: ${straw.sku})`);
  } else {
    straw = await prisma.product.update({
      where: { id: straw.id },
      data: {
        costPrice: 50,
        stock: 500,
        categoryId: category.id
      }
    });
    console.log(`Bahan baku diperbarui: ${straw.name}`);
  }

  // 3. Buat atau Update Air Isi Ulang (Porsi)
  let water = await prisma.product.findFirst({
    where: { sku: 'MAT-WATER' }
  });
  if (!water) {
    water = await prisma.product.create({
      data: {
        sku: 'MAT-WATER',
        name: 'Air Isi Ulang (Porsi)',
        description: 'Air galon isi ulang (porsi 200ml)',
        costPrice: 80,
        sellPrice: 0,
        stock: 900, // setara 10 galon
        isProcessed: false,
        categoryId: category.id
      }
    });
    console.log(`Bahan baku baru dibuat: ${water.name} (SKU: ${water.sku})`);
  } else {
    water = await prisma.product.update({
      where: { id: water.id },
      data: {
        costPrice: 80,
        stock: 900,
        categoryId: category.id
      }
    });
    console.log(`Bahan baku diperbarui: ${water.name}`);
  }

  // 4. Dapatkan semua produk olahan minuman
  const processedProducts = await prisma.product.findMany({
    where: {
      isProcessed: true,
      categoryId: category.id
    }
  });

  console.log(`Ditemukan ${processedProducts.length} menu minuman olahan untuk dipasangkan BOM.`);

  for (const procProduct of processedProducts) {
    const currentRecipe = procProduct.recipe as any[];
    if (!currentRecipe || currentRecipe.length === 0) {
      console.log(`Peringatan: Menu ${procProduct.name} tidak memiliki resep awal, dilewati.`);
      continue;
    }

    // Ambil ID sachet dari resep awal (asumsi resep awal hanya berisi 1 sachet)
    const sachetId = currentRecipe[0].productId;
    const sachetProduct = await prisma.product.findUnique({
      where: { id: sachetId }
    });

    if (!sachetProduct) {
      console.log(`Peringatan: Sachet untuk ${procProduct.name} tidak ditemukan di database.`);
      continue;
    }

    // Susun BOM baru: Sachet + Sedotan + Air
    const newRecipe = [
      { productId: sachetProduct.id, quantity: 1 },
      { productId: straw.id, quantity: 1 },
      { productId: water.id, quantity: 1 }
    ];

    // Hitung modal baru: modal sachet + Rp 130
    const newCost = Number(sachetProduct.costPrice) + 130;

    await prisma.product.update({
      where: { id: procProduct.id },
      data: {
        costPrice: newCost,
        recipe: newRecipe
      }
    });

    console.log(`Update BOM: ${procProduct.name} -> Modal Baru: Rp ${newCost}, Resep: [${sachetProduct.name}, Sedotan, Air]`);
  }

  console.log('Semua resep minuman olahan (BOM) selesai diperbarui!');
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
