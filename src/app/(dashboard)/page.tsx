"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Users, 
  AlertTriangle,
  ArrowRight,
  DollarSign,
  RefreshCw,
  Target,
  ArrowUpRight,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { useHideAmounts } from "@/lib/hide-amounts";
import { cn } from "@/lib/utils";
import { initialProducts } from "@/lib/initial-products";

export default function DashboardPage() {
  const { hidden } = useHideAmounts();
  const [syncing, setSyncing] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [targetDaily, setTargetDaily] = useState(1500000);
  const [targetMonthly, setTargetMonthly] = useState(35000000);

  const handleSync = () => {
    setSyncing(true);
    const savedProducts = localStorage.getItem("warung_products");
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    const savedTxs = localStorage.getItem("warung_transactions");
    if (savedTxs) setTransactions(JSON.parse(savedTxs));
    const savedDebts = localStorage.getItem("warung_debts");
    if (savedDebts) setDebts(JSON.parse(savedDebts));

    const savedTargets = localStorage.getItem("warung_targets");
    if (savedTargets) {
      try {
        const parsed = JSON.parse(savedTargets);
        if (parsed.daily) setTargetDaily(parsed.daily);
        if (parsed.monthly) setTargetMonthly(parsed.monthly);
      } catch (e) {
        console.error(e);
      }
    }
    setTimeout(() => setSyncing(false), 500);
  };

  useEffect(() => {
    // Load products
    const savedProducts = localStorage.getItem("warung_products");
    if (savedProducts) {
      try {
        let parsed = JSON.parse(savedProducts);
        
        // Upgrade database to at least 50 products if length is under 40, while preserving custom ones
        if (parsed.length < 40) {
          const defaultIds = new Set(initialProducts.map(ip => ip.id));
          const customProducts = parsed.filter((p: any) => !defaultIds.has(p.id));
          parsed = [...initialProducts, ...customProducts];
          localStorage.setItem("warung_products", JSON.stringify(parsed));
        }
        setProducts(parsed);
      } catch (e) {
        console.error(e);
      }
    } else {
      localStorage.setItem("warung_products", JSON.stringify(initialProducts));
      setProducts(initialProducts);
    }

    // Load transactions
    const savedTxs = localStorage.getItem("warung_transactions");
    if (savedTxs) {
      try {
        setTransactions(JSON.parse(savedTxs));
      } catch (e) {
        console.error(e);
      }
    } else {
      const initialTransactions = [
        { id: "TX-9021", date: "22 Mei 2026 14:20", items: "Indomie Goreng (3x), Aqua Botol (1x)", total: 14000, cost: 10600, profit: 3400, method: "Tunai" },
        { id: "TX-9020", date: "22 Mei 2026 13:55", items: "Minyak Goreng Bimoli 1L (1x)", total: 18000, cost: 15500, profit: 2500, method: "QRIS" },
        { id: "TX-9019", date: "22 Mei 2026 12:40", items: "Beras Raja Lele 5kg (1x)", total: 72000, cost: 62000, profit: 10000, method: "Kasbon" },
        { id: "TX-9018", date: "21 Mei 2026 18:10", items: "Teh Pucuk Harum 350ml (2x), Mama Lemon (1x)", total: 14500, cost: 11500, profit: 3000, method: "Tunai" },
      ];
      localStorage.setItem("warung_transactions", JSON.stringify(initialTransactions));
      setTransactions(initialTransactions);
    }

    // Load debts
    const savedDebts = localStorage.getItem("warung_debts");
    if (savedDebts) {
      try {
        setDebts(JSON.parse(savedDebts));
      } catch (e) {
        console.error(e);
      }
    } else {
      const initialDebts = [
        { id: "1", name: "Bu Joko", phone: "08123456789", totalDebt: 120000, remaining: 50000, status: "PARTIAL", lastPayment: "2026-05-20" },
        { id: "2", name: "Pak RT Slamet", phone: "08987654321", totalDebt: 156000, remaining: 156000, status: "UNPAID", lastPayment: "-" },
        { id: "3", name: "Mbak Sri", phone: "08561122334", totalDebt: 45000, remaining: 0, status: "PAID", lastPayment: "2026-05-22" },
        { id: "4", name: "Mas Doni", phone: "08778899001", totalDebt: 85000, remaining: 35000, status: "PARTIAL", lastPayment: "2026-05-18" },
      ];
      localStorage.setItem("warung_debts", JSON.stringify(initialDebts));
      setDebts(initialDebts);
    }

    // Load Target Settings
    const savedTargets = localStorage.getItem("warung_targets");
    if (savedTargets) {
      try {
        const parsed = JSON.parse(savedTargets);
        if (parsed.daily) setTargetDaily(parsed.daily);
        if (parsed.monthly) setTargetMonthly(parsed.monthly);
      } catch (e) {
        console.error(e);
      }
    }

    const handleStorageChange = () => {
      const p = localStorage.getItem("warung_products");
      if (p) try { setProducts(JSON.parse(p)); } catch(e){}
      const t = localStorage.getItem("warung_transactions");
      if (t) try { setTransactions(JSON.parse(t)); } catch(e){}
      const d = localStorage.getItem("warung_debts");
      if (d) try { setDebts(JSON.parse(d)); } catch(e){}
      const tg = localStorage.getItem("warung_targets");
      if (tg) {
        try {
          const parsed = JSON.parse(tg);
          if (parsed.daily) setTargetDaily(parsed.daily);
          if (parsed.monthly) setTargetMonthly(parsed.monthly);
        } catch (e) {}
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Compute live metrics
  const lowStockProducts = products
    .filter((p) => p.stock <= 5)
    .map((p) => ({
      name: p.name,
      category: p.category,
      stock: p.stock,
      unit: "Pcs"
    }));

  const activeTransactions = transactions.filter(tx => !tx.voided);

  const recentTransactions = activeTransactions.slice(0, 4).map((tx) => ({
    id: tx.id,
    time: tx.date || tx.time || "Baru saja",
    items: tx.items,
    total: tx.total,
    method: tx.method
  }));

  const todayDateObj = new Date();
  const dayStr = String(todayDateObj.getDate());
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
  const monthStr = monthNames[todayDateObj.getMonth()];
  const yearStr = String(todayDateObj.getFullYear());

  const todayTransactions = activeTransactions.filter(tx => {
    if (!tx.date) return false;
    const lowerDate = tx.date.toLowerCase();
    return lowerDate.includes(dayStr.toLowerCase()) && 
           (lowerDate.includes(monthStr.toLowerCase()) || 
            lowerDate.includes("mei") || 
            lowerDate.includes(String(todayDateObj.getMonth() + 1)));
  });

  const todaySales = todayTransactions.reduce((sum, tx) => sum + tx.total, 0);
  const todayTxCount = todayTransactions.length;

  const displaySales = activeTransactions.length > 0 ? (todaySales > 0 ? todaySales : activeTransactions.reduce((sum, tx) => sum + tx.total, 0)) : 0;
  const displayTxCount = activeTransactions.length > 0 ? (todayTxCount > 0 ? todayTxCount : activeTransactions.length) : 0;

  const progressPercent = targetDaily > 0 ? Math.min(100, Math.round((displaySales / targetDaily) * 1000) / 10) : 0;
  const displaySalesRemaining = Math.max(0, targetDaily - displaySales);

  const activeDebtsCount = debts.filter(d => d.remaining > 0).length;
  const totalDebtsAmount = debts.reduce((sum, d) => sum + d.remaining, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ringkasan Warung</h1>
          <p className="text-slate-500 text-sm mt-0.5">Berikut ringkasan performa penjualan dan inventori hari ini.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-700">Hari Ini: {new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border shadow-sm transition-all cursor-pointer",
              syncing
                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-white border-slate-200 text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
            )}
          >
            <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* Row 1: Main High-Impact KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 chart-reveal">
        {/* Sales Card (Gradient Blue) */}
        <div className="group relative bg-gradient-to-br from-[#0F172A] via-[#1e293b] to-[#1E3A8A] rounded-[24px] p-6 text-white overflow-hidden shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:shadow-blue-900/40 transition-all duration-500 flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3 group-hover:bg-blue-400/20 transition-colors duration-700" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-blue-200" />
                </div>
                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Pendapatan Hari Ini</p>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-lg shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-white">LIVE</span>
              </div>
            </div>

            <h3 className="text-[2.25rem] font-black text-white tracking-tighter leading-none mb-1 transform group-hover:scale-[1.02] origin-left transition-transform duration-500">
              {hidden ? "Rp ••••••" : `Rp ${displaySales.toLocaleString("id-ID")}`}
            </h3>
            <p className="text-[11px] text-blue-200/70 font-semibold mb-6">
              Total omset kotor dari penjualan kasir hari ini.
            </p>

            {/* Achievement Bar */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[16px] p-4 mt-auto">
              <div className="flex items-end justify-between mb-2">
                <div>
                  <p className="text-[9px] font-black text-blue-200/80 uppercase tracking-widest mb-0.5">Pencapaian Target</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-white">{progressPercent}%</span>
                    <span className="text-[10px] text-blue-300 font-medium">dari Rp {targetDaily.toLocaleString("id-ID")} target</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-blue-200/80 uppercase tracking-widest mb-0.5">Sisa Target</p>
                  <p className="text-xs font-bold text-white">
                    {hidden ? "Rp ••••••" : `Rp ${displaySalesRemaining.toLocaleString("id-ID")}`}
                  </p>
                </div>
              </div>
              
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-blue-400 transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Target Card (White with Left Border Accent) */}
        <div className="group relative bg-white rounded-[24px] p-6 border border-slate-200 overflow-hidden shadow-lg shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/80 transition-all duration-500 flex flex-col justify-between">
          <div className="absolute left-0 top-6 bottom-6 w-1.5 bg-blue-600 rounded-r-full" />
          <div className="shine-overlay" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Bulanan Warung</p>
              </div>
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm">
                <Calendar className="w-3 h-3 text-blue-600" />
                <span className="text-[10px] font-bold text-slate-600">
                  {todayDateObj.toLocaleDateString("id-ID", { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            <h3 className="text-[2.25rem] font-black text-slate-900 tracking-tighter leading-none mb-1">
              {hidden ? "Rp ••••••" : `Rp ${targetMonthly.toLocaleString("id-ID")}`}
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold mb-5">
              Akumulasi target omset bulanan untuk mempertahankan laba optimal.
            </p>

            <div className="bg-slate-50 border border-slate-100 rounded-[12px] p-3 flex items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Rata-rata Harian</p>
                  <p className="text-xs font-black text-slate-900">
                    {hidden ? "Rp ••••••" : `Rp ${Math.round(targetMonthly / 30).toLocaleString("id-ID")} / Hari`}
                  </p>
                </div>
              </div>
              
              <div className="w-[1px] h-8 bg-slate-200" />

              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pertumbuhan</p>
                  <p className="text-xs font-black text-emerald-600">+14.2% MoM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Grid Secondary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Transactions */}
        <div className="group relative bg-white border border-slate-200 hover:border-blue-300 p-5 rounded-2xl hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1.5 transition-all duration-500 ease-out cursor-default">
          <div className="shine-overlay" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-[14px] bg-blue-50 text-blue-600 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Transaksi Hari Ini</p>
              <h3 className="text-lg font-black text-slate-900 leading-none mb-1">
                {hidden ? "•• Transaksi" : `${displayTxCount} Transaksi`}
              </h3>
              <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
                ↗ +4.2% <span className="text-slate-400 font-medium">vs kemarin</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Low Stock */}
        <div className="group relative bg-white border border-slate-200 hover:border-blue-300 p-5 rounded-2xl hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1.5 transition-all duration-500 ease-out cursor-default">
          <div className="shine-overlay" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-[14px] bg-amber-50 text-amber-600 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Peringatan Stok Menipis</p>
              <h3 className="text-lg font-black text-amber-600 leading-none mb-1">{lowStockProducts.length} Produk</h3>
              <span className="text-[10px] text-amber-500 font-semibold">Butuh kulakan segera</span>
            </div>
          </div>
        </div>

        {/* Card 3: Debt Customers */}
        <div className="group relative bg-white border border-slate-200 hover:border-blue-300 p-5 rounded-2xl hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1.5 transition-all duration-500 ease-out cursor-default sm:col-span-2 lg:col-span-1">
          <div className="shine-overlay" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-[14px] bg-rose-50 text-rose-600 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Buku Kasbon Pelanggan</p>
              <h3 className="text-lg font-black text-slate-900 leading-none mb-1">
                {hidden ? "• Orang" : `${activeDebtsCount} Orang Aktif`}
              </h3>
              <span className="text-[10px] text-rose-500 font-bold">
                {hidden ? "Total: Rp ••••••" : `Total: Rp ${totalDebtsAmount.toLocaleString("id-ID")}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Tables & Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Transactions Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Transaksi Terbaru</h3>
              <p className="text-xs text-slate-500 mt-0.5">Daftar checkout invoice kasir beberapa jam terakhir.</p>
            </div>
            <Link 
              href="/reports" 
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 transition-colors hover:translate-x-0.5 duration-200"
            >
              Lihat Laporan <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold">
                  <th className="p-3">ID Transaksi</th>
                  <th className="p-3">Waktu</th>
                  <th className="p-3">Jumlah Item</th>
                  <th className="p-3 text-right">Total Harga</th>
                  <th className="p-3 text-center">Metode</th>
                </tr>
              </thead>
              <tbody className="text-slate-600 divide-y divide-slate-100">
                {recentTransactions.map((tx, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="p-3 font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{tx.id}</td>
                    <td className="p-3 text-slate-400">{tx.time}</td>
                    <td className="p-3">{tx.items}</td>
                    <td className="p-3 text-right text-slate-900 font-bold">
                      {hidden ? "Rp ••••••" : `Rp ${tx.total.toLocaleString("id-ID")}`}
                    </td>
                    <td className="p-3 text-center">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[9px] font-bold border",
                        tx.method === "Tunai" ? "bg-blue-50 text-blue-600 border-blue-100" :
                        tx.method === "QRIS" ? "bg-sky-50 text-sky-600 border-sky-100" :
                        "bg-rose-50 text-rose-600 border-rose-100"
                      )}>
                        {tx.method}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Low Stock Alert Panels */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Kondisi Stok Barang</h3>
            <p className="text-xs text-slate-500 mb-6">Barang dagangan dengan stok menipis dan butuh di-restock.</p>

            <div className="space-y-3">
              {lowStockProducts.map((p, i) => (
                <div key={i} className="group flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-white hover:shadow-md transition-all duration-300">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{p.name}</h4>
                    <p className="text-[9px] text-slate-400 mt-0.5 uppercase font-bold tracking-wider">{p.category}</p>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "text-xs font-black px-2 py-0.5 rounded-lg",
                      p.stock <= 2 ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                    )}>
                      Sisa {p.stock}
                    </span>
                    <p className="text-[9px] text-slate-400 mt-1">{p.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/inventory"
            className="mt-6 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white font-bold text-xs transition-all duration-300 border border-slate-200 hover:shadow-lg hover:shadow-blue-500/10 active:scale-98 cursor-pointer"
          >
            Lakukan Restock / Kulakan
          </Link>
        </div>
      </div>
    </div>
  );
}
