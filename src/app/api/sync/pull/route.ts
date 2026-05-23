import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Fetch Categories
    const dbCategories = await prisma.category.findMany();
    const categories = dbCategories.map(c => ({
      id: c.id,
      name: c.name,
      desc: c.desc || "",
      color: c.color || "from-blue-500 to-blue-700",
      icon: c.icon || "📦"
    }));

    // 2. Fetch Products
    const dbProducts = await prisma.product.findMany({
      include: { category: true }
    });
    const products = dbProducts.map(p => ({
      id: p.id,
      sku: p.sku || "",
      name: p.name,
      category: p.category?.name || "Lain-lain",
      costPrice: Number(p.costPrice),
      sellPrice: Number(p.sellPrice),
      stock: p.stock,
      imageUrl: p.imageUrl || null,
      isProcessed: p.isProcessed,
      recipe: p.recipe ? (p.recipe as any) : []
    }));

    // 3. Fetch Shifts
    const dbShifts = await prisma.shift.findMany({
      orderBy: { createdAt: "desc" }
    });
    const shifts = dbShifts.map(s => ({
      id: s.id,
      cashierName: s.cashierName,
      openTime: s.openTime,
      closeTime: s.closeTime || null,
      initialCash: Number(s.initialCash),
      cashSales: Number(s.cashSales),
      nonCashSales: Number(s.nonCashSales),
      debtSales: Number(s.debtSales),
      expectedCash: Number(s.expectedCash),
      actualCash: s.actualCash !== null ? Number(s.actualCash) : null,
      discrepancy: Number(s.discrepancy),
      status: s.status
    }));

    // 4. Fetch Transactions
    const dbTransactions = await prisma.transaction.findMany({
      include: {
        customer: true,
        items: {
          include: {
            product: {
              include: { category: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    const transactions = dbTransactions.map(tx => {
      const items = tx.items.map(item => {
        const costPrice = item.product ? Number(item.product.costPrice) : 0;
        const categoryName = item.product?.category?.name || "Lain-lain";
        return {
          id: item.productId,
          name: item.product?.name || "Produk Dihapus",
          qty: item.quantity,
          price: Number(item.price),
          subtotal: Number(item.subtotal),
          cost: costPrice,
          category: categoryName
        };
      });

      const total = Number(tx.totalAmount);
      const totalCost = items.reduce((sum, item) => sum + (item.cost * item.qty), 0);
      const profit = total - totalCost;

      let methodStr = "Tunai";
      if (tx.paymentMethod === "QRIS") methodStr = "QRIS";
      else if (tx.paymentMethod === "DEBT") methodStr = "Kasbon";
      else if (tx.paymentMethod === "CASH") methodStr = "Tunai"; // standard

      return {
        id: tx.invoiceNumber, // Use invoiceNumber as local ID
        date: tx.createdAt.toISOString(),
        invoice: tx.invoiceNumber,
        items,
        total,
        cost: totalCost,
        profit,
        method: methodStr,
        customer: tx.customer?.name || "Umum",
        shiftId: tx.shiftId || "",
        voided: false
      };
    });

    // 5. Fetch Debts
    const dbDebts = await prisma.debt.findMany({
      include: {
        customer: true,
        transaction: true,
        payments: true
      },
      orderBy: { createdAt: "desc" }
    });
    const debts = dbDebts.map(d => ({
      id: d.id,
      invoice: d.transaction.invoiceNumber,
      customer: d.customer.name,
      phone: d.customer.phone || "",
      amount: Number(d.amount),
      remaining: Number(d.remaining),
      date: d.createdAt.toISOString(),
      dueDate: d.dueDate ? d.dueDate.toISOString().split("T")[0] : null,
      isPaid: d.isPaid,
      payments: d.payments.map(p => ({
        id: p.id,
        amount: Number(p.amount),
        date: p.paymentDate.toISOString()
      }))
    }));

    // 6. Fetch Expenses
    const dbExpenses = await prisma.expense.findMany({
      orderBy: { createdAt: "desc" }
    });
    const expenses = dbExpenses.map(e => ({
      id: e.id,
      date: e.date,
      category: e.category,
      amount: Number(e.amount),
      notes: e.notes || ""
    }));

    // 7. Fetch Stock Movements
    const dbMovements = await prisma.stockMovement.findMany({
      include: { product: true },
      orderBy: { createdAt: "desc" }
    });
    const movements = dbMovements.map(m => ({
      id: m.id,
      productId: m.productId,
      productName: m.product?.name || "Produk Dihapus",
      type: m.type,
      qty: m.quantity,
      desc: m.description || "",
      date: m.createdAt.toISOString()
    }));

    return NextResponse.json({
      categories,
      products,
      shifts,
      transactions,
      debts,
      expenses,
      movements
    });
  } catch (error: any) {
    console.error("Sync Pull API Error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data dari database: " + error.message },
      { status: 500 }
    );
  }
}
