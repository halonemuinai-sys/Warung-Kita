import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { key, data, userName } = await request.json();

    if (!key || !data) {
      return NextResponse.json({ error: "Key dan Data wajib diisi!" }, { status: 400 });
    }

    // Fallback user logic
    let dbUser = await prisma.user.findFirst({
      where: userName ? { name: { equals: userName.trim(), mode: 'insensitive' } } : undefined
    });
    if (!dbUser) {
      dbUser = await prisma.user.findFirst();
    }
    const defaultUserId = dbUser?.id || "default-user-id";

    // 1. Sync Categories
    if (key === "warung_categories") {
      for (const item of data) {
        await prisma.category.upsert({
          where: { id: item.id },
          update: {
            name: item.name,
            desc: item.desc || "",
            color: item.color || "from-blue-500 to-blue-700",
            icon: item.icon || "📦"
          },
          create: {
            id: item.id,
            name: item.name,
            desc: item.desc || "",
            color: item.color || "from-blue-500 to-blue-700",
            icon: item.icon || "📦"
          }
        });
      }
    }

    // 2. Sync Products
    else if (key === "warung_products") {
      for (const item of data) {
        // Find or create category by name
        let categoryId: string | null = null;
        if (item.category) {
          const category = await prisma.category.findFirst({
            where: { name: { equals: item.category.trim(), mode: 'insensitive' } }
          });
          if (category) {
            categoryId = category.id;
          } else {
            const newCategory = await prisma.category.create({
              data: {
                name: item.category.trim(),
                desc: "Kategori otomatis",
                color: "from-slate-500 to-slate-700",
                icon: "📦"
              }
            });
            categoryId = newCategory.id;
          }
        }

        await prisma.product.upsert({
          where: { id: item.id },
          update: {
            sku: item.sku || null,
            name: item.name,
            costPrice: item.costPrice,
            sellPrice: item.sellPrice,
            stock: item.stock,
            imageUrl: item.imageUrl || null,
            isProcessed: !!item.isProcessed,
            recipe: item.recipe || [],
            categoryId: categoryId
          },
          create: {
            id: item.id,
            sku: item.sku || null,
            name: item.name,
            costPrice: item.costPrice,
            sellPrice: item.sellPrice,
            stock: item.stock,
            imageUrl: item.imageUrl || null,
            isProcessed: !!item.isProcessed,
            recipe: item.recipe || [],
            categoryId: categoryId
          }
        });
      }
    }

    // 3. Sync Shifts
    else if (key === "warung_shifts") {
      for (const item of data) {
        await prisma.shift.upsert({
          where: { id: item.id },
          update: {
            cashierName: item.cashierName,
            openTime: item.openTime,
            closeTime: item.closeTime || null,
            initialCash: item.initialCash,
            cashSales: item.cashSales,
            nonCashSales: item.nonCashSales,
            debtSales: item.debtSales,
            expectedCash: item.expectedCash,
            actualCash: item.actualCash !== null ? item.actualCash : null,
            discrepancy: item.discrepancy,
            status: item.status
          },
          create: {
            id: item.id,
            cashierName: item.cashierName,
            openTime: item.openTime,
            closeTime: item.closeTime || null,
            initialCash: item.initialCash,
            cashSales: item.cashSales,
            nonCashSales: item.nonCashSales,
            debtSales: item.debtSales,
            expectedCash: item.expectedCash,
            actualCash: item.actualCash !== null ? item.actualCash : null,
            discrepancy: item.discrepancy,
            status: item.status
          }
        });
      }
    }

    // 4. Sync Transactions
    else if (key === "warung_transactions") {
      for (const item of data) {
        let paymentMethod: "CASH" | "QRIS" | "DEBT" = "CASH";
        if (item.method === "QRIS" || item.method === "Kartu") paymentMethod = "QRIS";
        else if (item.method === "Kasbon") paymentMethod = "DEBT";

        let customerId: string | null = null;
        if (item.customer && item.customer !== "Umum") {
          const customer = await prisma.customer.findFirst({
            where: { name: { equals: item.customer.trim(), mode: 'insensitive' } }
          });
          if (customer) {
            customerId = customer.id;
          } else {
            const newCustomer = await prisma.customer.create({
              data: {
                name: item.customer.trim(),
                phone: "",
                address: ""
              }
            });
            customerId = newCustomer.id;
          }
        }

        // Check if transaction exists
        const existingTx = await prisma.transaction.findUnique({
          where: { invoiceNumber: item.invoice }
        });

        const txData = {
          invoiceNumber: item.invoice,
          totalAmount: item.total,
          paymentMethod: paymentMethod,
          userId: defaultUserId,
          customerId: customerId,
          shiftId: item.shiftId || null,
          createdAt: new Date(item.date)
        };

        let txId: string;
        if (existingTx) {
          txId = existingTx.id;
          await prisma.transaction.update({
            where: { id: txId },
            data: txData
          });
          // Clear old items
          await prisma.transactionItem.deleteMany({
            where: { transactionId: txId }
          });
        } else {
          const newTx = await prisma.transaction.create({
            data: txData
          });
          txId = newTx.id;
        }

        // Insert new items
        for (const cartItem of item.items) {
          // Check if product exists in db, otherwise use fallback product
          const dbProd = await prisma.product.findUnique({
            where: { id: cartItem.id }
          });
          if (!dbProd) continue; // Skip if product doesn't exist

          await prisma.transactionItem.create({
            data: {
              transactionId: txId,
              productId: cartItem.id,
              quantity: cartItem.qty,
              price: cartItem.price,
              subtotal: cartItem.subtotal
            }
          });
        }
      }
    }

    // 5. Sync Debts
    else if (key === "warung_debts") {
      for (const item of data) {
        // Find corresponding transaction
        const tx = await prisma.transaction.findUnique({
          where: { invoiceNumber: item.invoice }
        });
        if (!tx) continue;

        let customerId: string;
        const customer = await prisma.customer.findFirst({
          where: { name: { equals: item.customer.trim(), mode: 'insensitive' } }
        });
        if (customer) {
          customerId = customer.id;
        } else {
          const newCustomer = await prisma.customer.create({
            data: {
              name: item.customer.trim()
            }
          });
          customerId = newCustomer.id;
        }

        const debtData = {
          transactionId: tx.id,
          customerId: customerId,
          amount: item.amount,
          remaining: item.remaining,
          isPaid: item.isPaid,
          dueDate: item.dueDate ? new Date(item.dueDate) : null,
          createdAt: new Date(item.date)
        };

        // Upsert Debt
        const existingDebt = await prisma.debt.findUnique({
          where: { transactionId: tx.id }
        });

        let debtId: string;
        if (existingDebt) {
          debtId = existingDebt.id;
          await prisma.debt.update({
            where: { id: debtId },
            data: debtData
          });
          // Delete old payments
          await prisma.debtPayment.deleteMany({
            where: { debtId: debtId }
          });
        } else {
          const newDebt = await prisma.debt.create({
            data: debtData
          });
          debtId = newDebt.id;
        }

        // Insert new payments
        if (item.payments && Array.isArray(item.payments)) {
          for (const payment of item.payments) {
            await prisma.debtPayment.create({
              data: {
                id: payment.id,
                debtId: debtId,
                amount: payment.amount,
                paymentDate: new Date(payment.date)
              }
            });
          }
        }
      }
    }

    // 6. Sync Expenses
    else if (key === "warung_expenses") {
      for (const item of data) {
        await prisma.expense.upsert({
          where: { id: item.id },
          update: {
            date: item.date,
            category: item.category,
            amount: item.amount,
            notes: item.notes || ""
          },
          create: {
            id: item.id,
            date: item.date,
            category: item.category,
            amount: item.amount,
            notes: item.notes || ""
          }
        });
      }
    }

    // 7. Sync Movements (Stock Movements)
    else if (key === "warung_movements") {
      for (const item of data) {
        // Verify product exists
        const dbProd = await prisma.product.findUnique({
          where: { id: item.productId }
        });
        if (!dbProd) continue;

        await prisma.stockMovement.upsert({
          where: { id: item.id },
          update: {
            productId: item.productId,
            type: item.type === "IN" ? "IN" : item.type === "OUT" ? "OUT" : "ADJUST",
            quantity: item.qty,
            description: item.desc || "",
            createdAt: new Date(item.date)
          },
          create: {
            id: item.id,
            productId: item.productId,
            type: item.type === "IN" ? "IN" : item.type === "OUT" ? "OUT" : "ADJUST",
            quantity: item.qty,
            description: item.desc || "",
            createdAt: new Date(item.date)
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Sync Push API Error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data ke database: " + error.message },
      { status: 500 }
    );
  }
}
