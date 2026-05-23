"use client";

import { useState, useEffect } from "react";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  Plus, 
  History, 
  PlusCircle, 
  Calendar,
  Layers,
  Sparkles,
  ClipboardList,
  X,
  Package,
  ShoppingBag,
  Info,
  TrendingDown as TrendDownIcon,
  TrendingUp as TrendUpIcon,
  ArrowRight,
  Check
} from "lucide-react";
import { useHideAmounts } from "@/lib/hide-amounts";
import { cn } from "@/lib/utils";
import { initialProducts } from "@/lib/initial-products";

const mockMovements = [
  { id: "MVT-4001", date: "2026-05-22 14:30", product: "Minyak Goreng Bimoli 1L", type: "IN", quantity: 24, description: "Restock Kulakan Agen" },
  { id: "MVT-4002", date: "2026-05-22 12:15", product: "Aqua Botol 600ml", type: "OUT", quantity: 3, description: "Rusak / Bocor" },
  { id: "MVT-4003", date: "2026-05-22 10:00", product: "Beras Raja Lele 5kg", type: "IN", quantity: 10, description: "Barang Masuk Agen" },
  { id: "MVT-4004", date: "2026-05-21 16:45", product: "Indomie Goreng", type: "ADJUST", quantity: -2, description: "Opname Stok Selisih" },
];

export default function InventoryPage() {
  const { hidden } = useHideAmounts();
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [movements, setMovements] = useState<any[]>(mockMovements);
  const [isRestockOpen, setIsRestockOpen] = useState(false);

  // Form states for Restock
  const [selectedProductId, setSelectedProductId] = useState("");
  const [purchaseMode, setPurchaseMode] = useState<"GROSIR" | "ECERAN">("GROSIR");
  const [jumlahKarton, setJumlahKarton] = useState<number>(1);
  const [isiPerKarton, setIsiPerKarton] = useState<number>(40);
  const [totalHargaGrosir, setTotalHargaGrosir] = useState<number>(100000);

  const [jumlahUnit, setJumlahUnit] = useState<number>(10);
  const [hargaBeliSatuan, setHargaBeliSatuan] = useState<number>(2500);

  const [supplier, setSupplier] = useState("Indogrosir");
  const [notes, setNotes] = useState("");

  // Sync state with LocalStorage
  useEffect(() => {
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
        const firstNonProcessed = parsed.find((p: any) => !p.isProcessed);
        if (firstNonProcessed) {
          setSelectedProductId(firstNonProcessed.id);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      localStorage.setItem("warung_products", JSON.stringify(initialProducts));
      setProducts(initialProducts);
      const firstNonProcessed = initialProducts.find((p: any) => !p.isProcessed);
      if (firstNonProcessed) {
        setSelectedProductId(firstNonProcessed.id);
      }
    }

    const savedMovements = localStorage.getItem("warung_movements");
    if (savedMovements) {
      try {
        setMovements(JSON.parse(savedMovements));
      } catch (e) {
        console.error(e);
      }
    } else {
      localStorage.setItem("warung_movements", JSON.stringify(mockMovements));
    }
  }, []);

  const nonProcessedProducts = products.filter((p: any) => !p.isProcessed);
  const selectedProduct = nonProcessedProducts.find(p => p.id === selectedProductId) || nonProcessedProducts[0] || products[0];
  const oldCogs = selectedProduct ? Number(selectedProduct.costPrice) : 0;

  // Live calculation of restock
  let calculatedUnits = 0;
  let calculatedCogs = 0;

  if (purchaseMode === "GROSIR") {
    calculatedUnits = (jumlahKarton || 0) * (isiPerKarton || 0);
    calculatedCogs = calculatedUnits > 0 ? (totalHargaGrosir || 0) / calculatedUnits : 0;
  } else {
    calculatedUnits = jumlahUnit || 0;
    calculatedCogs = hargaBeliSatuan || 0;
  }

  const cogsDiff = calculatedCogs - oldCogs;
  const cogsDiffPercent = oldCogs > 0 ? (cogsDiff / oldCogs) * 100 : 0;

  // Handle Save Restock
  const handleSaveRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    // Calculate final values
    const finalUnits = calculatedUnits;
    const finalCogs = calculatedCogs;

    // Update Product Stock and costPrice
    const updatedProducts = products.map((p) => {
      if (p.id === selectedProductId) {
        return {
          ...p,
          stock: p.stock + finalUnits,
          costPrice: finalCogs
        };
      }
      return p;
    });

    setProducts(updatedProducts);
    localStorage.setItem("warung_products", JSON.stringify(updatedProducts));

    // Log Stock Movement
    const formattedDate = new Date().toLocaleDateString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }) + " " + new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    const newMovementId = `MVT-${Math.floor(4005 + Math.random() * 1000)}`;
    const detailedDesc = purchaseMode === "GROSIR"
      ? `Restock ${supplier}: ${jumlahKarton} Karton @ ${isiPerKarton} Pcs (Total Harga Rp ${totalHargaGrosir.toLocaleString("id-ID")})`
      : `Restock ${supplier}: ${jumlahUnit} Pcs @ Rp ${hargaBeliSatuan.toLocaleString("id-ID")}/Pcs`;

    const newMovement = {
      id: newMovementId,
      date: formattedDate,
      product: selectedProduct.name,
      type: "IN",
      quantity: finalUnits,
      description: notes ? `${detailedDesc} - ${notes}` : detailedDesc
    };

    const updatedMovements = [newMovement, ...movements];
    setMovements(updatedMovements);
    localStorage.setItem("warung_movements", JSON.stringify(updatedMovements));

    // Reset Form
    setIsRestockOpen(false);
    setJumlahKarton(1);
    setIsiPerKarton(40);
    setTotalHargaGrosir(100000);
    setJumlahUnit(10);
    setHargaBeliSatuan(2500);
    setNotes("");
  };

  // Status counters
  const totalStockInThisMonth = movements
    .filter(m => m.type === "IN")
    .reduce((sum, m) => sum + m.quantity, 0);

  const totalStockOutThisMonth = movements
    .filter(m => m.type === "OUT")
    .reduce((sum, m) => sum + Math.abs(m.quantity), 0);

  const totalAdjustThisMonth = movements
    .filter(m => m.type === "ADJUST")
    .reduce((sum, m) => sum + m.quantity, 0);

  // Valuation of inventory
  const totalValuation = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventori & Stok</h1>
          <p className="text-slate-500 text-xs mt-1 font-medium">Pantau stok masuk (kulakan), stok keluar (rusak/kadaluarsa), dan lakukan opname fisik.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              const nonProcessed = products.filter((p: any) => !p.isProcessed);
              if (nonProcessed.length > 0 && (!selectedProductId || !nonProcessed.some(p => p.id === selectedProductId))) {
                setSelectedProductId(nonProcessed[0].id);
              }
              setIsRestockOpen(true);
            }}
            className="group flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 transition-all duration-200 shadow-sm cursor-pointer active:scale-95"
          >
            <PlusCircle className="h-4 w-4 text-white transition-transform group-hover:scale-110" />
            Catat Kulakan (Barang Masuk)
          </button>
        </div>
      </div>

      {/* Grid Status Stok Ringkas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 chart-reveal">
        {/* Card 1: Nilai Aset */}
        <div className="group relative bg-gradient-to-br from-blue-600 to-blue-700 border border-blue-500 rounded-[22px] p-5 shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none transform translate-x-1/4 -translate-y-1/4" />
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <span className="text-[10px] text-blue-100 font-extrabold uppercase tracking-wider">Estimasi Nilai Aset</span>
              <h3 className="text-xl font-black text-white mt-1.5 tracking-tight">
                {hidden ? "Rp ••••••" : `Rp ${totalValuation.toLocaleString("id-ID")}`}
              </h3>
            </div>
            <div className="bg-white/10 border border-white/20 p-2.5 rounded-xl text-white">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[9px] text-blue-100/70 font-semibold relative z-10">Total taksiran modal dari stok saat ini</p>
        </div>

        {/* Card 2: Stok Masuk */}
        <div className="group relative bg-white border border-slate-200/80 rounded-[22px] p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          </div>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Stok Masuk</span>
              <h3 className="text-xl font-bold text-slate-800 mt-1.5">{totalStockInThisMonth} Pcs</h3>
            </div>
            <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl text-blue-600 transition-transform group-hover:rotate-6 duration-300">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[9px] text-slate-400 font-medium relative z-10">Total barang masuk (kulakan)</p>
        </div>

        {/* Card 3: Stok Keluar */}
        <div className="group relative bg-white border border-slate-200/80 rounded-[22px] p-5 shadow-sm hover:shadow-md hover:border-rose-100 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-50/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          </div>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Stok Keluar / Rusak</span>
              <h3 className="text-xl font-bold text-slate-800 mt-1.5">{totalStockOutThisMonth} Pcs</h3>
            </div>
            <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-xl text-rose-600 transition-transform group-hover:-rotate-6 duration-300">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[9px] text-slate-400 font-medium relative z-10">Barang kadaluarsa / bocor / rusak</p>
        </div>

        {/* Card 4: Penyesuaian */}
        <div className="group relative bg-white border border-slate-200/80 rounded-[22px] p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Opname (Selisih Fisik)</span>
              <h3 className="text-xl font-bold text-slate-800 mt-1.5">{totalAdjustThisMonth} Pcs</h3>
            </div>
            <div className="bg-slate-100 border border-slate-200 p-2.5 rounded-xl text-slate-600 transition-transform group-hover:rotate-12 duration-300">
              <RefreshCw className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[9px] text-slate-400 font-medium relative z-10">Selisih audit fisik dengan sistem</p>
        </div>
      </div>

      {/* Tabel Riwayat Pergerakan Stok */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600">
            <ClipboardList className="h-4 w-4" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm">Log Pergerakan Stok Terbaru</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">ID Transaksi</th>
                <th className="py-3.5 px-4">Waktu</th>
                <th className="py-3.5 px-4">Nama Produk</th>
                <th className="py-3.5 px-4 text-center">Tipe</th>
                <th className="py-3.5 px-4 text-center">Jumlah</th>
                <th className="py-3.5 px-4">Keterangan / Detil Pembelian</th>
              </tr>
            </thead>
            <tbody className="text-slate-600 divide-y divide-slate-100">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-all duration-150 group">
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">
                      {m.id}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {m.date}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{m.product}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide uppercase border",
                      m.type === "IN" ? "bg-blue-50 text-blue-700 border-blue-100" :
                      m.type === "OUT" ? "bg-rose-50 text-rose-700 border-rose-100" :
                      "bg-slate-100 text-slate-700 border-slate-200"
                    )}>
                      {m.type === "IN" ? "Masuk" : m.type === "OUT" ? "Keluar" : "Opname"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-extrabold text-[13px]">
                    <span className={m.quantity > 0 ? "text-blue-600" : "text-rose-600"}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity} Pcs
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-medium leading-relaxed max-w-sm break-words">{m.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: INPUT KULAKAN (BARANG MASUK) */}
      {isRestockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[24px] border border-slate-200/80 shadow-2xl p-6 relative overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Catat Pembelian Kulakan (Restock)</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Input faktur grosir/satuan untuk menghitung Harga Modal (COGS).</p>
                </div>
              </div>
              <button 
                onClick={() => setIsRestockOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <form onSubmit={handleSaveRestock} className="py-4 space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              {/* Product Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Pilih Produk</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-blue-600 shadow-sm cursor-pointer"
                >
                  {nonProcessedProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok: {p.stock} | Modal: Rp {Number(p.costPrice).toLocaleString("id-ID")}/pcs)
                    </option>
                  ))}
                </select>
              </div>

              {/* Purchase Mode Segmented Control */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase block">Metode Pembelian</label>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200/50 w-full">
                  <button
                    type="button"
                    onClick={() => setPurchaseMode("GROSIR")}
                    className={cn(
                      "flex-1 py-2 text-center text-[10px] font-bold rounded-lg transition-all cursor-pointer",
                      purchaseMode === "GROSIR"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    📦 Grosir (Dus / Karton / Box)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPurchaseMode("ECERAN")}
                    className={cn(
                      "flex-1 py-2 text-center text-[10px] font-bold rounded-lg transition-all cursor-pointer",
                      purchaseMode === "ECERAN"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    🏷️ Eceran (Pcs / Satuan)
                  </button>
                </div>
              </div>

              {/* Purchase Fields */}
              {purchaseMode === "GROSIR" ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Jml Karton/Box</label>
                    <input
                      type="number"
                      min={1}
                      value={jumlahKarton === 0 ? "" : jumlahKarton}
                      onChange={(e) => setJumlahKarton(Math.max(1, parseInt(e.target.value) || 0))}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-blue-600 shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Isi per Karton</label>
                    <input
                      type="number"
                      min={1}
                      value={isiPerKarton === 0 ? "" : isiPerKarton}
                      onChange={(e) => setIsiPerKarton(Math.max(1, parseInt(e.target.value) || 0))}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-blue-600 shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Harga Total Dus</label>
                    <input
                      type="number"
                      min={100}
                      value={totalHargaGrosir === 0 ? "" : totalHargaGrosir}
                      onChange={(e) => setTotalHargaGrosir(Math.max(0, parseInt(e.target.value) || 0))}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-blue-600 shadow-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Jumlah (Pcs)</label>
                    <input
                      type="number"
                      min={1}
                      value={jumlahUnit === 0 ? "" : jumlahUnit}
                      onChange={(e) => setJumlahUnit(Math.max(1, parseInt(e.target.value) || 0))}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-blue-600 shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Harga Beli Satuan</label>
                    <input
                      type="number"
                      min={100}
                      value={hargaBeliSatuan === 0 ? "" : hargaBeliSatuan}
                      onChange={(e) => setHargaBeliSatuan(Math.max(0, parseInt(e.target.value) || 0))}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-blue-600 shadow-sm"
                    />
                  </div>
                </div>
              )}

              {/* Supplier & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Nama Supplier</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-blue-600 shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Keterangan / Catatan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Faktur #891"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-600 shadow-sm"
                  />
                </div>
              </div>

              {/* Calculation Preview Panel */}
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-3 shadow-inner">
                <div className="flex items-center gap-1.5 text-blue-800 font-extrabold text-[10.5px]">
                  <Info className="w-3.5 h-3.5" /> HASIL PERHITUNGAN MODAL (COGS)
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <div className="space-y-0.5">
                    <span className="text-[9.5px] text-slate-400 font-bold uppercase block">Total Masuk Stok</span>
                    <span className="font-extrabold text-slate-900 text-sm">{calculatedUnits} Pcs</span>
                  </div>
                  
                  <div className="space-y-0.5">
                    <span className="text-[9.5px] text-slate-400 font-bold uppercase block">Harga Modal Satuan Baru</span>
                    <span className="font-black text-blue-700 text-sm">
                      Rp {Math.round(calculatedCogs).toLocaleString("id-ID")}/pcs
                    </span>
                  </div>
                </div>

                {/* Variance comparison block */}
                <div className="pt-2 border-t border-blue-100/50 flex items-center justify-between">
                  <span className="text-[9.5px] text-slate-400 font-bold uppercase">Harga Modal Lama:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-500">Rp {Math.round(oldCogs).toLocaleString("id-ID")}</span>
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                    <span className="font-extrabold text-slate-900">Rp {Math.round(calculatedCogs).toLocaleString("id-ID")}</span>
                    
                    {/* Variance badge */}
                    {selectedProductId && (
                      cogsDiff < 0 ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded text-[8px] font-black flex items-center gap-0.5">
                          <TrendDownIcon className="w-2 h-2" /> Hemat Rp {Math.abs(Math.round(cogsDiff))} (-{Math.abs(cogsDiffPercent).toFixed(1)}%)
                        </span>
                      ) : cogsDiff > 0 ? (
                        <span className="bg-rose-50 text-rose-700 border border-rose-100 px-1.5 py-0.5 rounded text-[8px] font-black flex items-center gap-0.5">
                          <TrendUpIcon className="w-2 h-2" /> Naik Rp {Math.round(cogsDiff)} (+{cogsDiffPercent.toFixed(1)}%)
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded text-[8px] font-black">
                          Sama
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 shrink-0 flex gap-2 justify-end">
              <button 
                type="button"
                onClick={() => setIsRestockOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button 
                type="button"
                onClick={handleSaveRestock}
                className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/10 hover:shadow-blue-500/25 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Simpan Pembelian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
