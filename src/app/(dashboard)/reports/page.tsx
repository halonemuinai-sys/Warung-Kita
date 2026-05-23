"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Calendar, 
  Download, 
  FileSpreadsheet, 
  FileText,
  DollarSign,
  Briefcase,
  ArrowUpRight,
  Sparkles,
  Plus,
  X,
  Lock,
  Trash2
} from "lucide-react";
import { useHideAmounts } from "@/lib/hide-amounts";
import { cn } from "@/lib/utils";

const mockTransactionsReport = [
  { id: "TX-9021", date: "22 Mei 2026 14:20", items: "Indomie Goreng (3x), Aqua Botol (1x)", total: 14000, cost: 10600, profit: 3400, method: "Tunai" },
  { id: "TX-9020", date: "22 Mei 2026 13:55", items: "Minyak Goreng Bimoli 1L (1x)", total: 18000, cost: 15500, profit: 2500, method: "QRIS" },
  { id: "TX-9019", date: "22 Mei 2026 12:40", items: "Beras Raja Lele 5kg (1x)", total: 72000, cost: 62000, profit: 10000, method: "Kasbon" },
  { id: "TX-9018", date: "21 Mei 2026 18:10", items: "Teh Pucuk (2x), Mama Lemon (1x)", total: 14500, cost: 11500, profit: 3000, method: "Tunai" },
];

export default function ReportsPage() {
  const { hidden } = useHideAmounts();
  const [reports, setReports] = useState<any[]>(mockTransactionsReport);
  const [filterPeriod, setFilterPeriod] = useState("TODAY");

  // State variables for report tabs, expenses, and shifts
  const [activeTab, setActiveTab] = useState<"SALES" | "PL" | "SHIFTS">("SALES");
  const [expenses, setExpenses] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);

  // State variables for adding expense modal
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState("Listrik & Air");
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState("");
  const [expenseNotes, setExpenseNotes] = useState("");

  useEffect(() => {
    // Load transactions
    const savedTxs = localStorage.getItem("warung_transactions");
    if (savedTxs) {
      try {
        setReports(JSON.parse(savedTxs));
      } catch (e) {
        console.error(e);
      }
    } else {
      localStorage.setItem("warung_transactions", JSON.stringify(mockTransactionsReport));
    }

    // Load expenses
    const savedExpenses = localStorage.getItem("warung_expenses");
    if (savedExpenses) {
      try {
        setExpenses(JSON.parse(savedExpenses));
      } catch (e) {
        console.error(e);
      }
    } else {
      localStorage.setItem("warung_expenses", JSON.stringify([]));
    }

    // Load shifts
    const savedShifts = localStorage.getItem("warung_shifts");
    if (savedShifts) {
      try {
        setShifts(JSON.parse(savedShifts));
      } catch (e) {
        console.error(e);
      }
    } else {
      localStorage.setItem("warung_shifts", JSON.stringify([]));
    }

    // Initialize expense date to today
    const today = new Date();
    const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setExpenseDate(formattedToday);
  }, []);

  const parseIndoDate = (dateStr: string) => {
    try {
      if (!dateStr) return new Date();
      const months: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, jun: 5,
        jul: 6, agt: 7, sep: 8, okt: 9, nov: 10, des: 11,
        januari: 0, februari: 1, maret: 2, april: 3, juni: 5,
        juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11
      };
      
      const parts = dateStr.toLowerCase().split(" ");
      if (parts.length < 3) return new Date();
      const day = parseInt(parts[0]);
      const monthStr = parts[1];
      const year = parseInt(parts[2]);
      
      const month = months[monthStr] !== undefined ? months[monthStr] : new Date().getMonth();
      
      let hour = 0;
      let minute = 0;
      if (parts[3]) {
        const timeParts = parts[3].split(":");
        hour = parseInt(timeParts[0]) || 0;
        minute = parseInt(timeParts[1]) || 0;
      }
      
      return new Date(year, month, day, hour, minute);
    } catch (e) {
      return new Date();
    }
  };

  const now = new Date();
  const filteredReports = reports.filter((r) => {
    const rDate = parseIndoDate(r.date);
    if (filterPeriod === "TODAY") {
      return rDate.toDateString() === now.toDateString();
    }
    if (filterPeriod === "WEEK") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return rDate >= oneWeekAgo && rDate <= now;
    }
    if (filterPeriod === "MONTH") {
      return rDate.getMonth() === now.getMonth() && rDate.getFullYear() === now.getFullYear();
    }
    if (filterPeriod === "YEAR") {
      return rDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const nonVoidedReports = filteredReports.filter(r => !r.voided);
  const totalSales = nonVoidedReports.reduce((sum, r) => sum + r.total, 0);
  const totalCost = nonVoidedReports.reduce((sum, r) => sum + r.cost, 0);
  const totalProfit = nonVoidedReports.reduce((sum, r) => sum + r.profit, 0);
  const marginPercent = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : "0.0";

  const parseExpenseDate = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
      return new Date();
    } catch(e) {
      return new Date();
    }
  };

  const filteredExpenses = expenses.filter((e) => {
    const eDate = parseExpenseDate(e.date);
    if (filterPeriod === "TODAY") {
      return eDate.toDateString() === now.toDateString();
    }
    if (filterPeriod === "WEEK") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return eDate >= oneWeekAgo && eDate <= now;
    }
    if (filterPeriod === "MONTH") {
      return eDate.getMonth() === now.getMonth() && eDate.getFullYear() === now.getFullYear();
    }
    if (filterPeriod === "YEAR") {
      return eDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const filteredShifts = shifts.filter((s) => {
    const sDate = parseIndoDate(s.openTime);
    if (filterPeriod === "TODAY") {
      return sDate.toDateString() === now.toDateString();
    }
    if (filterPeriod === "WEEK") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return sDate >= oneWeekAgo && sDate <= now;
    }
    if (filterPeriod === "MONTH") {
      return sDate.getMonth() === now.getMonth() && sDate.getFullYear() === now.getFullYear();
    }
    if (filterPeriod === "YEAR") {
      return sDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // Calculate detailed P&L variables
  const cashSalesAmount = nonVoidedReports.filter(r => r.method === "Tunai").reduce((sum, r) => sum + r.total, 0);
  const qrisSalesAmount = nonVoidedReports.filter(r => r.method === "QRIS").reduce((sum, r) => sum + r.total, 0);
  const cardSalesAmount = nonVoidedReports.filter(r => r.method === "Kartu").reduce((sum, r) => sum + r.total, 0);
  const debtSalesAmount = nonVoidedReports.filter(r => r.method === "Kasbon").reduce((sum, r) => sum + r.total, 0);
  
  const totalRevenue = totalSales;
  const totalCOGS = totalCost;
  const grossProfit = totalRevenue - totalCOGS;

  const totalOpexExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const shiftCashShortage = filteredShifts.filter(s => s.discrepancy < 0).reduce((sum, s) => sum + Math.abs(s.discrepancy), 0);
  const shiftCashSurplus = filteredShifts.filter(s => s.discrepancy > 0).reduce((sum, s) => sum + s.discrepancy, 0);

  const totalOperationalExpenses = totalOpexExpenses + shiftCashShortage - shiftCashSurplus;
  const netProfit = grossProfit - totalOperationalExpenses;
  const netMarginPercent = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  // Expense Handlers
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmount <= 0) return;

    const newExpense = {
      id: `EXP-${Date.now()}`,
      date: expenseDate,
      category: expenseCategory,
      amount: expenseAmount,
      notes: expenseNotes.trim() || `${expenseCategory} warung`
    };

    const updatedExpenses = [newExpense, ...expenses];
    setExpenses(updatedExpenses);
    localStorage.setItem("warung_expenses", JSON.stringify(updatedExpenses));

    // Reset Form
    const today = new Date();
    const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setExpenseDate(formattedToday);
    setExpenseAmount(0);
    setExpenseNotes("");
    setIsAddExpenseOpen(false);
  };

  const handleDeleteExpense = (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus catatan pengeluaran ini?")) return;
    const updatedExpenses = expenses.filter(e => e.id !== id);
    setExpenses(updatedExpenses);
    localStorage.setItem("warung_expenses", JSON.stringify(updatedExpenses));
  };

  // Void/Cancel Transaction States & Handlers
  const [isVoidConfirmOpen, setIsVoidConfirmOpen] = useState(false);
  const [transactionToVoid, setTransactionToVoid] = useState<any | null>(null);

  const handleVoidClick = (tx: any) => {
    setTransactionToVoid(tx);
    setIsVoidConfirmOpen(true);
  };

  const handleVoidSubmit = () => {
    if (!transactionToVoid) return;
    const r = transactionToVoid;

    // 1. Mark transaction as voided in reports state and localStorage
    const updatedTxs = reports.map((tx: any) => {
      if (tx.id === r.id) {
        return { ...tx, voided: true };
      }
      return tx;
    });
    setReports(updatedTxs);
    localStorage.setItem("warung_transactions", JSON.stringify(updatedTxs));

    // 2. Restore stocks of products/ingredients
    const savedProducts = localStorage.getItem("warung_products");
    if (savedProducts) {
      try {
        const productsList = JSON.parse(savedProducts);
        
        // Build array of items to restore
        const itemsToRestore: any[] = [];
        if (r.itemsList && r.itemsList.length > 0) {
          r.itemsList.forEach((item: any) => {
            itemsToRestore.push({ id: item.id, name: item.name, quantity: item.quantity });
          });
        } else if (r.items) {
          // Fallback: parse description string
          r.items.split(", ").forEach((itemStr: string) => {
            const match = itemStr.match(/(.+)\s\((\d+)x\)/);
            if (match) {
              const name = match[1].trim();
              const qty = parseInt(match[2]);
              const foundProd = productsList.find((p: any) => p.name.toLowerCase() === name.toLowerCase());
              if (foundProd) {
                itemsToRestore.push({ id: foundProd.id, name: foundProd.name, quantity: qty });
              }
            }
          });
        }

        // Apply restoration
        const updatedProductsList = productsList.map((prod: any) => {
          let extraQty = 0;
          itemsToRestore.forEach((item: any) => {
            if (item.id === prod.id) {
              // Standard item restoration
              if (!prod.isProcessed) {
                extraQty += item.quantity;
              }
            }
            // Recipe ingredients restoration for processed products
            const targetProd = productsList.find((p: any) => p.id === item.id);
            if (targetProd && targetProd.isProcessed && targetProd.recipe) {
              targetProd.recipe.forEach((ingredient: any) => {
                if (ingredient.productId === prod.id) {
                  extraQty += ingredient.quantity * item.quantity;
                }
              });
            }
          });

          if (extraQty > 0) {
            return {
              ...prod,
              stock: prod.stock + extraQty
            };
          }
          return prod;
        });

        localStorage.setItem("warung_products", JSON.stringify(updatedProductsList));
      } catch (e) {
        console.error("Error restoring stock on void:", e);
      }
    }

    // 3. Record void in stock movements
    const savedMovements = localStorage.getItem("warung_movements");
    if (savedMovements) {
      try {
        const movementsList = JSON.parse(savedMovements);
        const mvtDate = new Date().toLocaleDateString("id-ID", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }) + " " + new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

        const newVoidMovements: any[] = [];
        
        // Extract items to list in movements
        const itemsToRestore: any[] = [];
        if (r.itemsList && r.itemsList.length > 0) {
          r.itemsList.forEach((item: any) => {
            itemsToRestore.push({ id: item.id, name: item.name, quantity: item.quantity });
          });
        } else if (r.items) {
          r.items.split(", ").forEach((itemStr: string) => {
            const match = itemStr.match(/(.+)\s\((\d+)x\)/);
            if (match) {
              const name = match[1].trim();
              const qty = parseInt(match[2]);
              itemsToRestore.push({ name: name, quantity: qty });
            }
          });
        }

        itemsToRestore.forEach((item: any, idx: number) => {
          newVoidMovements.push({
            id: `MVT-V-${Date.now()}-${idx}`,
            date: mvtDate,
            product: item.name,
            type: "IN",
            quantity: item.quantity,
            description: `Batal Transaksi (${r.id})`
          });
        });

        localStorage.setItem("warung_movements", JSON.stringify([...newVoidMovements, ...movementsList]));
      } catch (e) {
        console.error("Error recording void movements:", e);
      }
    }

    // 4. Update shift stats (adjust cashSales, nonCashSales, debtSales, expectedCash)
    const savedShifts = localStorage.getItem("warung_shifts");
    if (savedShifts) {
      try {
        const shiftsList = JSON.parse(savedShifts);
        const updatedShiftsList = shiftsList.map((s: any) => {
          if (s.id === r.shiftId) {
            const isCash = r.method === "Tunai";
            const isNonCash = r.method === "QRIS" || r.method === "Kartu";
            const isDebt = r.method === "Kasbon";

            const cashSalesDiff = isCash ? r.total : 0;
            const nonCashSalesDiff = isNonCash ? r.total : 0;
            const debtSalesDiff = isDebt ? r.total : 0;

            const newExpectedCash = s.expectedCash - cashSalesDiff;
            const newDiscrepancy = s.status === "CLOSED" ? s.actualCash - newExpectedCash : 0;

            return {
              ...s,
              cashSales: Math.max(0, s.cashSales - cashSalesDiff),
              nonCashSales: Math.max(0, s.nonCashSales - nonCashSalesDiff),
              debtSales: Math.max(0, s.debtSales - debtSalesDiff),
              expectedCash: Math.max(0, newExpectedCash),
              discrepancy: newDiscrepancy
            };
          }
          return s;
        });

        setShifts(updatedShiftsList);
        localStorage.setItem("warung_shifts", JSON.stringify(updatedShiftsList));

        // If the voided transaction belongs to the currently active open shift, update warung_active_shift as well
        const savedActiveShift = localStorage.getItem("warung_active_shift");
        if (savedActiveShift) {
          const activeShiftObj = JSON.parse(savedActiveShift);
          if (activeShiftObj.id === r.shiftId) {
            const matchedUpdatedShift = updatedShiftsList.find((s: any) => s.id === r.shiftId);
            if (matchedUpdatedShift) {
              localStorage.setItem("warung_active_shift", JSON.stringify(matchedUpdatedShift));
            }
          }
        }
      } catch (e) {
        console.error("Error updating shift stats on void:", e);
      }
    }

    // 5. Update customer debt if method was "Kasbon"
    if (r.method === "Kasbon" && r.customer && r.customer !== "Umum") {
      const savedDebts = localStorage.getItem("warung_debts");
      if (savedDebts) {
        try {
          const debtsList = JSON.parse(savedDebts);
          const matchedDebtIdx = debtsList.findIndex((d: any) => d.name.toLowerCase() === r.customer.toLowerCase());
          if (matchedDebtIdx > -1) {
            const d = debtsList[matchedDebtIdx];
            const newRemaining = Math.max(0, d.remaining - r.total);
            const newTotalDebt = Math.max(0, d.totalDebt - r.total);
            const newStatus = newRemaining === 0 ? "PAID" : d.status;

            debtsList[matchedDebtIdx] = {
              ...d,
              totalDebt: newTotalDebt,
              remaining: newRemaining,
              status: newStatus
            };

            localStorage.setItem("warung_debts", JSON.stringify(debtsList));
          }
        } catch (e) {
          console.error("Error adjusting customer debt on void:", e);
        }
      }
    }

    // Dispatch storage update to notify other components
    window.dispatchEvent(new Event("storage"));
    setIsVoidConfirmOpen(false);
    setTransactionToVoid(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Laporan Keuangan</h1>
          <p className="text-slate-500 text-xs mt-1 font-medium">Pantau total omset, pengeluaran modal, laba bersih P&L, dan kelola pertanggungjawaban kas shift.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "PL" && (
            <button 
              onClick={() => setIsAddExpenseOpen(true)}
              className="group flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer active:scale-95"
            >
              <Plus className="h-4 w-4 text-white" />
              Catat Biaya Operasional
            </button>
          )}
          <button 
            onClick={() => window.print()}
            className="group flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-700 transition-all duration-205 shadow-sm cursor-pointer active:scale-95"
          >
            <Download className="h-4 w-4 text-blue-600 transition-transform group-hover:translate-y-0.5" />
            Cetak Laporan
          </button>
        </div>
      </div>

      {/* Filter Periode & Tab (no-print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4 no-print">
        {/* Filter Periode */}
        <div className="flex gap-1.5 bg-slate-100/80 p-1 rounded-2xl w-fit border border-slate-200/50 shadow-inner">
          {[
            { key: "TODAY", label: "Hari Ini" },
            { key: "WEEK", label: "Minggu Ini" },
            { key: "MONTH", label: "Bulan Ini" },
            { key: "YEAR", label: "Tahun Ini" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setFilterPeriod(t.key)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-300 cursor-pointer",
                filterPeriod === t.key
                  ? "bg-white text-blue-600 shadow-sm border border-slate-200/40"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Selection */}
        <div className="flex gap-1 border-b border-transparent -mb-[17px]">
          {[
            { id: "SALES", label: "Penjualan & Transaksi" },
            { id: "PL", label: "Laba Rugi (P&L)" },
            { id: "SHIFTS", label: "Jurnal Shift Kasir" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "pb-3.5 px-3 text-xs font-extrabold transition-all border-b-2 cursor-pointer",
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT: SALES & TRANSACTIONS */}
      {activeTab === "SALES" && (
        <div className="space-y-6 no-print">
          {/* Grid Laba Rugi */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Omset Penjualan */}
            <div className="group relative bg-white border border-slate-200/80 rounded-[22px] p-5.5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between min-h-[130px]">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 z-0">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              </div>
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Omset Penjualan</span>
                  <h3 className="text-2xl font-black text-slate-900 mt-1.5 tracking-tight">
                    {hidden ? "Rp ••••••" : `Rp ${totalSales.toLocaleString("id-ID")}`}
                  </h3>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl text-blue-600 transition-transform group-hover:rotate-6 duration-300">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 text-[10px] text-slate-400 font-semibold relative z-10">
                Total uang masuk kotor dari kasir POS
              </div>
            </div>

            {/* Card 2: Pengeluaran Modal */}
            <div className="group relative bg-white border border-slate-200/80 rounded-[22px] p-5.5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between min-h-[130px]">
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Pengeluaran Modal (COGS)</span>
                  <h3 className="text-2xl font-black text-slate-800 mt-1.5 tracking-tight">
                    {hidden ? "Rp ••••••" : `Rp ${totalCost.toLocaleString("id-ID")}`}
                  </h3>
                </div>
                <div className="bg-slate-100 border border-slate-200/60 p-2.5 rounded-xl text-slate-500 transition-transform group-hover:-rotate-6 duration-300">
                  <Briefcase className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 text-[10px] text-slate-400 font-semibold relative z-10">
                Harga beli barang dari supplier
              </div>
            </div>

            {/* Card 3: Laba Bersih (Sebelum Biaya Ops) */}
            <div className="group relative bg-gradient-to-br from-blue-600 to-blue-800 border border-blue-500 rounded-[22px] p-5.5 shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between min-h-[130px]">
              <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none transform translate-x-1/4 -translate-y-1/4" />
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-blue-100 font-extrabold uppercase tracking-wider">Laba Kotor Penjualan</span>
                    <span className="bg-white/15 text-white border border-white/10 px-1.5 py-0.5 rounded text-[8px] font-black">
                      {marginPercent}% Marg.
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white mt-1.5 tracking-tight">
                    {hidden ? "Rp ••••••" : `Rp ${totalProfit.toLocaleString("id-ID")}`}
                  </h3>
                </div>
                <div className="bg-white/15 border border-white/10 p-2.5 rounded-xl text-white transition-transform group-hover:scale-110 duration-300">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-[10px] text-blue-100 font-bold relative z-10">
                <Sparkles className="h-3.5 w-3.5 text-blue-200" /> Keuntungan kotor penjualan produk
              </div>
            </div>
          </div>

          {/* Tabel Detail Transaksi */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600">
                <FileText className="h-4 w-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Riwayat Pembukuan Transaksi</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/40 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">ID Transaksi</th>
                    <th className="py-3.5 px-4">Tanggal / Waktu</th>
                    <th className="py-3.5 px-4">Barang Terjual</th>
                    <th className="py-3.5 px-4 text-right">Omset</th>
                    <th className="py-3.5 px-4 text-right">Modal (COGS)</th>
                    <th className="py-3.5 px-4 text-right">Laba Bersih</th>
                    <th className="py-3.5 px-4 text-center">Metode</th>
                    <th className="py-3.5 px-4 text-center no-print">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600 divide-y divide-slate-100">
                  {filteredReports.length > 0 ? (
                    filteredReports.map((r) => (
                      <tr key={r.id} className={cn("hover:bg-slate-50/50 transition-all duration-150 group", r.voided && "opacity-60 bg-rose-50/10")}>
                        <td className="py-3.5 px-4">
                          <span className={cn("font-mono text-[10.5px] font-bold px-2 py-1 rounded-md border", r.voided ? "text-slate-400 bg-slate-50 border-slate-200 line-through" : "text-slate-900 bg-slate-50 border-slate-200")}>
                            {r.id}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className={cn("flex items-center gap-1.5 font-semibold text-[11px]", r.voided ? "text-slate-400 line-through" : "text-slate-500")}>
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {r.date}
                          </div>
                        </td>
                        <td className={cn("py-3.5 px-4 font-bold truncate max-w-xs transition-colors", r.voided ? "text-slate-400 line-through" : "text-slate-800 group-hover:text-blue-600")}>{r.items}</td>
                        <td className={cn("py-3.5 px-4 text-right font-extrabold", r.voided ? "text-slate-400 line-through" : "text-slate-900")}>
                          {hidden ? "Rp ••••••" : `Rp ${r.total.toLocaleString("id-ID")}`}
                        </td>
                        <td className={cn("py-3.5 px-4 text-right font-medium", r.voided ? "text-slate-400 line-through" : "text-slate-500")}>
                          {hidden ? "Rp ••••••" : `Rp ${r.cost.toLocaleString("id-ID")}`}
                        </td>
                        <td className={cn("py-3.5 px-4 text-right font-extrabold", r.voided ? "text-slate-400 line-through" : "text-emerald-600")}>
                          {hidden ? "Rp ••••••" : `Rp ${r.profit.toLocaleString("id-ID")}`}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border uppercase tracking-wider",
                            r.voided ? "bg-slate-100 text-slate-400 border-slate-200" :
                            r.method === "Tunai" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                            r.method === "QRIS" ? "bg-blue-50 text-blue-700 border-blue-100" :
                            r.method === "Kartu" ? "bg-cyan-50 text-cyan-700 border-cyan-100" :
                            "bg-amber-50 text-amber-700 border-amber-100"
                          )}>
                            {r.voided ? "Void" : r.method}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center no-print">
                          {r.voided ? (
                            <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-100 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                              Voided
                            </span>
                          ) : (
                            <button
                              onClick={() => handleVoidClick(r)}
                              className="px-2.5 py-1 bg-white border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-[10.5px] font-extrabold text-slate-500 hover:text-rose-600 rounded-xl transition-all duration-200 active:scale-95 shadow-sm cursor-pointer"
                            >
                              Void
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Calendar className="h-10 w-10 text-slate-400 mx-auto mb-2 stroke-[1.5]" />
                        <p className="text-xs font-semibold">Tidak ada transaksi pada periode ini.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PROFIT & LOSS (P&L) STATEMENT */}
      {activeTab === "PL" && (
        <div id="print-area" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left/Center Block: P&L Statement Sheet */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[24px] p-8 shadow-sm print:border-none print:shadow-none">
            
            {/* Report Header */}
            <div className="text-center pb-6 border-b border-slate-200">
              <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">Laporan Laba Rugi Komprehensif</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">Warung Kita POS &amp; Inventory</p>
              <div className="inline-block bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[9.5px] font-extrabold uppercase mt-2.5 tracking-wider">
                Periode: {filterPeriod === "TODAY" ? "Hari Ini" : filterPeriod === "WEEK" ? "Minggu Ini" : filterPeriod === "MONTH" ? "Bulan Ini" : "Tahun Ini"}
              </div>
            </div>

            {/* P&L Line Items */}
            <div className="py-6 space-y-6 text-xs text-slate-700 font-medium">
              
              {/* Section 1: Revenue */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-slate-900 font-extrabold border-b border-slate-200/80 pb-2">
                  <span className="uppercase tracking-wider">1. Pendapatan Usaha</span>
                  <span>Rincian</span>
                </div>
                <div className="pl-4 flex justify-between items-center text-slate-500">
                  <span>Penjualan Kasir (Tunai)</span>
                  <span>Rp {cashSalesAmount.toLocaleString("id-ID")}</span>
                </div>
                <div className="pl-4 flex justify-between items-center text-slate-500">
                  <span>Penjualan Kasir (QRIS)</span>
                  <span>Rp {qrisSalesAmount.toLocaleString("id-ID")}</span>
                </div>
                <div className="pl-4 flex justify-between items-center text-slate-500">
                  <span>Penjualan Kasir (Kartu Bank)</span>
                  <span>Rp {cardSalesAmount.toLocaleString("id-ID")}</span>
                </div>
                <div className="pl-4 flex justify-between items-center text-slate-500">
                  <span>Penjualan Kasbon (Piutang Pelanggan)</span>
                  <span>Rp {debtSalesAmount.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-slate-900 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 mt-2">
                  <span>TOTAL PENDAPATAN KOTOR</span>
                  <span>Rp {totalRevenue.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Section 2: HPP */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-slate-900 font-extrabold border-b border-slate-200/80 pb-2">
                  <span className="uppercase tracking-wider">2. Harga Pokok Penjualan (HPP)</span>
                  <span>Nilai</span>
                </div>
                <div className="pl-4 flex justify-between items-center text-slate-500">
                  <span>Pengeluaran Modal (Belanja Aset Barang)</span>
                  <span>Rp {totalCOGS.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-slate-900 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 mt-2">
                  <span>TOTAL HANGUS MODAL (COGS)</span>
                  <span>Rp {totalCOGS.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Gross Profit Marker */}
              <div className="flex justify-between items-center font-extrabold text-[13px] text-slate-900 border-y border-slate-200 py-3 bg-slate-100/40 px-3 rounded-xl">
                <span>LABA KOTOR (Gross Profit)</span>
                <span>Rp {grossProfit.toLocaleString("id-ID")}</span>
              </div>

              {/* Section 3: Operational Expenses */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-slate-900 font-extrabold border-b border-slate-200/80 pb-2">
                  <span className="uppercase tracking-wider">3. Beban Operasional Usaha</span>
                  <span>Nilai</span>
                </div>
                <div className="pl-4 flex justify-between items-center text-slate-500">
                  <span>Beban Operasional Log Warung</span>
                  <span>Rp {totalOpexExpenses.toLocaleString("id-ID")}</span>
                </div>
                <div className="pl-4 flex justify-between items-center text-rose-600/90 font-medium">
                  <span>Selisih Rekonsiliasi Kas Laci (Minus / Hilang)</span>
                  <span>+ Rp {shiftCashShortage.toLocaleString("id-ID")}</span>
                </div>
                <div className="pl-4 flex justify-between items-center text-emerald-600 font-medium">
                  <span>Selisih Rekonsiliasi Kas Laci (Lebih / Keuntungan)</span>
                  <span>- Rp {shiftCashSurplus.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-slate-900 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 mt-2">
                  <span>TOTAL BIAYA OPERASIONAL &amp; LOSS</span>
                  <span>Rp {totalOperationalExpenses.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Final Net Profit */}
              <div className={cn(
                "flex justify-between items-center font-black text-sm p-4.5 rounded-[18px] text-white shadow-md transition-all",
                netProfit >= 0 ? "bg-gradient-to-r from-blue-600 to-blue-800 shadow-blue-500/10" : "bg-gradient-to-r from-rose-600 to-rose-700"
              )}>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  <div className="text-left">
                    <p className="text-[10px] text-blue-100/85 font-extrabold uppercase tracking-widest leading-none">Laba Bersih Akhir (P&amp;L)</p>
                    <p className="text-[9px] text-blue-200 mt-1 font-bold">{netMarginPercent}% Net Profit Margin</p>
                  </div>
                </div>
                <span className="text-lg">Rp {netProfit.toLocaleString("id-ID")}</span>
              </div>

            </div>
          </div>

          {/* Right Column: Operational Expenses logger list */}
          <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between min-h-[300px] no-print">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-amber-50 p-1.5 rounded-lg text-amber-600">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-xs">Biaya Operasional</h3>
                </div>
                <button
                  onClick={() => setIsAddExpenseOpen(true)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 border border-blue-100 rounded-lg text-[10px] font-black cursor-pointer active:scale-95 transition-all"
                >
                  + Tambah
                </button>
              </div>

              {/* List of expenses */}
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((exp) => (
                    <div key={exp.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs group hover:bg-slate-100/50 transition-all">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">{exp.category}</span>
                          <span className="text-[9px] text-slate-400 font-semibold">{exp.date}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">{exp.notes || "-"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800">Rp {exp.amount.toLocaleString("id-ID")}</span>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          title="Hapus Biaya"
                          className="text-slate-300 hover:text-rose-600 p-1 rounded hover:bg-white transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    <p className="text-xs font-semibold">Belum ada pengeluaran operasional.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed font-medium">
              Beban operasional di atas memotong laba kotor penjualan untuk menghasilkan laba bersih.
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CASHIER SHIFTS LOG */}
      {activeTab === "SHIFTS" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 no-print">
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-rose-50 p-1.5 rounded-lg text-rose-600">
              <Lock className="h-4 w-4" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">Jurnal Sejarah Shift &amp; Selisih Kasir</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/40 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Shift ID</th>
                  <th className="py-3.5 px-4">Nama Kasir</th>
                  <th className="py-3.5 px-4">Waktu Buka / Tutup</th>
                  <th className="py-3.5 px-4 text-right">Modal Awal</th>
                  <th className="py-3.5 px-4 text-right">Seharusnya (Tunai)</th>
                  <th className="py-3.5 px-4 text-right">Aktif Fisik</th>
                  <th className="py-3.5 px-4 text-center">Status Selisih</th>
                </tr>
              </thead>
              <tbody className="text-slate-600 divide-y divide-slate-100">
                {filteredShifts.length > 0 ? (
                  filteredShifts.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-all duration-150 group">
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[10.5px] font-bold text-slate-900 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">
                          {s.id.replace("SHIFT-", "")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{s.cashierName}</td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-500 font-semibold text-[10px]">
                          <div><span className="text-slate-400 font-medium">In:</span> {s.openTime}</div>
                          <div><span className="text-slate-400 font-medium">Out:</span> {s.closeTime || "Aktif"}</div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-500">
                        Rp {s.initialCash.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                        Rp {s.expectedCash.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                        {s.status === "OPEN" ? "-" : `Rp ${s.actualCash.toLocaleString("id-ID")}`}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {s.status === "OPEN" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border bg-blue-50 text-blue-700 border-blue-100 animate-pulse">
                            Aktif
                          </span>
                        ) : (
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border uppercase tracking-wider",
                            s.discrepancy === 0 ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                            s.discrepancy < 0 ? "bg-rose-50 text-rose-700 border-rose-100 animate-pulse" :
                            "bg-amber-50 text-amber-700 border-amber-100"
                          )}>
                            {s.discrepancy === 0 ? "Sesuai" :
                             s.discrepancy < 0 ? `Kurang (-Rp ${Math.abs(s.discrepancy).toLocaleString("id-ID")})` :
                             `Lebih (+Rp ${s.discrepancy.toLocaleString("id-ID")})`
                            }
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Lock className="h-10 w-10 text-slate-400 mx-auto mb-2 stroke-[1.5]" />
                      <p className="text-xs font-semibold">Tidak ada data shift kasir pada periode ini.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD EXPENSE */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 no-print">
          <div className="bg-white w-full max-w-sm rounded-[24px] border border-slate-200/80 shadow-2xl p-6 relative overflow-hidden flex flex-col animate-in scale-in duration-300">
            {/* Glow */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Catat Biaya Operasional</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Tambah beban biaya operasional warung.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddExpenseOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveExpense} className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block pl-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-blue-600 shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block pl-1">Kategori</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-blue-600 shadow-sm"
                  >
                    <option value="Operasional">Operasional</option>
                    <option value="Listrik">Listrik &amp; Air</option>
                    <option value="Gaji">Gaji Karyawan</option>
                    <option value="Sewa">Sewa Tempat</option>
                    <option value="Bahan Pembantu">Bahan Pembantu</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block pl-1">Nominal Biaya (Rp)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={expenseAmount === 0 ? "" : expenseAmount}
                  onChange={(e) => setExpenseAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="Contoh: 50000"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block pl-1">Keterangan / Detail</label>
                <input
                  type="text"
                  placeholder="Contoh: Bayar air PDAM Mei"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 flex gap-2 justify-end">
                <button 
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Simpan Biaya
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: CONFIRM VOID TRANSACTION */}
      {isVoidConfirmOpen && transactionToVoid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 no-print">
          <div className="bg-white w-full max-w-sm rounded-[24px] border border-slate-200/80 shadow-2xl p-6 relative overflow-hidden flex flex-col animate-in scale-in duration-300">
            {/* Glow */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 shrink-0">
              <div className="bg-rose-50 text-rose-600 p-2.5 rounded-xl">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Batalkan Transaksi</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Konfirmasi pembatalan transaksi kasir.</p>
              </div>
            </div>

            {/* Content */}
            <div className="py-5 space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 space-y-2.5">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                  <span>ID Transaksi</span>
                  <span className="font-mono text-slate-800 font-bold bg-white border border-slate-200 px-1.5 py-0.5 rounded">{transactionToVoid.id}</span>
                </div>
                <div className="border-t border-slate-200/50 pt-2.5 space-y-1.5">
                  <div className="text-slate-800 font-bold leading-relaxed">{transactionToVoid.items}</div>
                  <div className="flex justify-between text-[11px] text-slate-500 font-semibold pt-1">
                    <span>Metode Bayar:</span>
                    <span className="font-bold text-slate-700">{transactionToVoid.method}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                    <span>Pelanggan:</span>
                    <span className="font-bold text-slate-700">{transactionToVoid.customer || "Umum"}</span>
                  </div>
                </div>
                <div className="border-t border-slate-200/50 pt-2.5 flex justify-between items-baseline">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total Pembatalan</span>
                  <span className="text-base font-black text-rose-600">Rp {transactionToVoid.total.toLocaleString("id-ID")}</span>
                </div>
              </div>

              <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 text-[10.5px] text-rose-700 font-semibold leading-relaxed flex gap-2">
                <div className="shrink-0 text-rose-500">⚠️</div>
                <p>Tindakan ini akan mengembalikan stok produk/bahan resep ke gudang dan mengurangi omset penjualan shift terkait.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 flex gap-2 justify-end shrink-0">
              <button 
                onClick={() => {
                  setIsVoidConfirmOpen(false);
                  setTransactionToVoid(null);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95"
              >
                Batal
              </button>
              <button 
                onClick={handleVoidSubmit}
                className="px-4.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-500/10 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Batalkan Transaksi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
