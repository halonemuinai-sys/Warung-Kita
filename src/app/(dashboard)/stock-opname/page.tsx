"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Search,
  ClipboardList,
  RefreshCw,
  ArrowRight,
  Check,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Layers,
  History,
  FileSpreadsheet,
  CheckCircle,
  HelpCircle,
  Play,
  Trash2,
  Plus,
  Minus,
  Barcode,
  XCircle,
  CheckSquare
} from "lucide-react";
import { useHideAmounts } from "@/lib/hide-amounts";
import { cn } from "@/lib/utils";
import { initialProducts } from "@/lib/initial-products";

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  imageUrl: string | null;
}

interface StockMovement {
  id: string;
  date: string;
  product: string;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  description: string;
}

interface OpnameSessionItem {
  productId: string;
  sku: string;
  name: string;
  category: string;
  costPrice: number;
  systemStock: number;
  physicalStock: number;
  reason: string;
  notes: string;
  isScanned: boolean;
}

const defaultMovements = [
  { id: "MVT-4001", date: "2026-05-22 14:30", product: "Minyak Goreng Bimoli 1L", type: "IN", quantity: 24, description: "Restock Kulakan Agen" },
  { id: "MVT-4002", date: "2026-05-22 12:15", product: "Aqua Botol 600ml", type: "OUT", quantity: 3, description: "Rusak / Bocor" },
  { id: "MVT-4003", date: "2026-05-22 10:00", product: "Beras Raja Lele 5kg", type: "IN", quantity: 10, description: "Barang Masuk Agen" },
  { id: "MVT-4004", date: "2026-05-21 16:45", product: "Indomie Goreng", type: "ADJUST", quantity: -2, description: "Opname Stok Selisih - Rusak digigit hama" },
];

export default function StockOpnamePage() {
  const { hidden } = useHideAmounts();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  
  // Tab control for historical view vs. active view
  const [activeTab, setActiveTab] = useState<"session" | "history">("session");

  // Session-based states
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionItems, setSessionItems] = useState<OpnameSessionItem[]>([]);
  const [initialStockMode, setInitialStockMode] = useState<"SYSTEM" | "ZERO">("SYSTEM");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [categoriesList, setCategoriesList] = useState<string[]>(["Semua"]);

  // Scanner states
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scannedIdFlash, setScannedIdFlash] = useState<string | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync databases from localStorage
  useEffect(() => {
    // Load products
    const savedProducts = localStorage.getItem("warung_products");
    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
      } catch (e) {
        console.error(e);
      }
    } else {
      localStorage.setItem("warung_products", JSON.stringify(initialProducts));
      setProducts(initialProducts as Product[]);
    }

    // Load movements
    const savedMovements = localStorage.getItem("warung_movements");
    if (savedMovements) {
      try {
        setMovements(JSON.parse(savedMovements));
      } catch (e) {
        console.error(e);
      }
    } else {
      localStorage.setItem("warung_movements", JSON.stringify(defaultMovements));
      setMovements(defaultMovements as StockMovement[]);
    }

    // Extract categories
    const savedCats = localStorage.getItem("warung_categories");
    if (savedCats) {
      try {
        const parsed = JSON.parse(savedCats);
        const catNames = parsed.map((c: any) => c.name);
        setCategoriesList(["Semua", ...catNames]);
      } catch (e) {
        console.error(e);
      }
    } else {
      const catNames = Array.from(new Set(initialProducts.map((p) => p.category)));
      setCategoriesList(["Semua", ...catNames]);
    }
  }, []);

  // Autofocus scanner input during active session
  useEffect(() => {
    if (isSessionActive && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [isSessionActive]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Play scanning beep
  const playScannerBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(1300, audioCtx.currentTime); // 1300Hz high pitch beep
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);

      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.085);
      oscillator.stop(audioCtx.currentTime + 0.085);
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  };

  // Play success chime
  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      
      const playTone = (freq: number, start: number, duration: number) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime + start);
        oscillator.start(audioCtx.currentTime + start);
        gainNode.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + start + duration);
        oscillator.stop(audioCtx.currentTime + start + duration);
      };

      playTone(880, 0, 0.12); // A5 tone
      playTone(1320, 0.08, 0.2); // E6 tone
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  };

  // Session Handlers
  const startNewSession = () => {
    const items: OpnameSessionItem[] = products.map((p) => ({
      productId: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      costPrice: p.costPrice,
      systemStock: p.stock,
      physicalStock: initialStockMode === "SYSTEM" ? p.stock : 0,
      reason: "Salah Input",
      notes: "",
      isScanned: false
    }));
    setSessionItems(items);
    setIsSessionActive(true);
    triggerToast("Sesi Stock Opname Baru telah dimulai!");
  };

  const cancelSession = () => {
    if (confirm("Apakah Anda yakin ingin membatalkan sesi ini? Semua hitungan stok fisik saat ini akan dibuang.")) {
      setIsSessionActive(false);
      setSessionItems([]);
      setSearchQuery("");
      setBarcodeInput("");
    }
  };

  // Handle barcode scanner input
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanBarcode = barcodeInput.trim();
    if (!cleanBarcode) return;

    // Find the item matching this barcode
    const index = sessionItems.findIndex(
      (item) => item.sku && item.sku.toLowerCase() === cleanBarcode.toLowerCase()
    );

    if (index !== -1) {
      // Item found
      const updated = [...sessionItems];
      const item = updated[index];
      
      // Increment physical stock by 1
      item.physicalStock = item.physicalStock + 1;
      item.isScanned = true;

      setSessionItems(updated);
      playScannerBeep();

      // Trigger flash highlight
      setScannedIdFlash(item.productId);
      setTimeout(() => {
        setScannedIdFlash(null);
      }, 1000);

      // Find the row element in table and scroll to it
      const element = document.getElementById(`row-${item.productId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      triggerToast(`Dipindai: ${item.name} (Fisik: ${item.physicalStock} Pcs)`);
    } else {
      // Not found, check products DB
      const prod = products.find(p => p.sku && p.sku.toLowerCase() === cleanBarcode.toLowerCase());
      if (prod) {
        // Product exists in system, but was somehow missing from sessionItems. Let's add it.
        const newItem: OpnameSessionItem = {
          productId: prod.id,
          sku: prod.sku,
          name: prod.name,
          category: prod.category,
          costPrice: prod.costPrice,
          systemStock: prod.stock,
          physicalStock: 1,
          reason: "Salah Input",
          notes: "",
          isScanned: true
        };
        setSessionItems((prev) => [newItem, ...prev]);
        playScannerBeep();
        triggerToast(`Dipindai: ${prod.name} (Fisik: 1 Pcs)`);
      } else {
        alert(`Produk dengan SKU / Barcode "${cleanBarcode}" tidak ditemukan di database.`);
      }
    }
    setBarcodeInput("");
    // Keep focus
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  // Update specific item inputs manually
  const updatePhysicalQty = (productId: string, val: number) => {
    setSessionItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const qty = Math.max(0, val);
          return { ...item, physicalStock: qty, isScanned: true };
        }
        return item;
      })
    );
  };

  const updateReason = (productId: string, val: string) => {
    setSessionItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          return { ...item, reason: val };
        }
        return item;
      })
    );
  };

  const updateNotes = (productId: string, val: string) => {
    setSessionItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          return { ...item, notes: val };
        }
        return item;
      })
    );
  };

  // Commit session adjustments
  const commitSession = () => {
    // Filter out items with discrepancies
    const itemsWithDiscrepancy = sessionItems.filter(
      (item) => item.physicalStock !== item.systemStock
    );

    // Apply changes
    // 1. Update products system stock
    const updatedProducts = products.map((p) => {
      const sessionItem = sessionItems.find((si) => si.productId === p.id);
      if (sessionItem) {
        return { ...p, stock: sessionItem.physicalStock };
      }
      return p;
    });

    setProducts(updatedProducts);
    localStorage.setItem("warung_products", JSON.stringify(updatedProducts));

    // 2. Log movements
    const formattedDate = new Date().toLocaleDateString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }) + " " + new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    const newMovements: StockMovement[] = [];
    
    // Log items with discrepancies
    itemsWithDiscrepancy.forEach((item) => {
      const newMovementId = `MVT-ADJ-${Math.floor(5000 + Math.random() * 5000)}`;
      const discrepancy = item.physicalStock - item.systemStock;
      const desc = `Stock Opname: Fisik ${item.physicalStock} vs Sistem ${item.systemStock} (Selisih ${discrepancy > 0 ? "+" : ""}${discrepancy} Pcs). Alasan: ${item.reason}${item.notes ? ` - ${item.notes}` : ""}`;
      
      newMovements.push({
        id: newMovementId,
        date: formattedDate,
        product: item.name,
        type: "ADJUST",
        quantity: discrepancy,
        description: desc
      });
    });

    // Also log session metadata as a generic entry if there were no differences
    if (newMovements.length === 0) {
      const newMovementId = `MVT-ADJ-${Math.floor(5000 + Math.random() * 5000)}`;
      newMovements.push({
        id: newMovementId,
        date: formattedDate,
        product: "Sesi Audit Stock Opname",
        type: "ADJUST",
        quantity: 0,
        description: `Audit Stok Opname Selesai: Seluruh ${sessionItems.length} produk akurat (100% cocok).`
      });
    }

    const updatedMovements = [...newMovements, ...movements];
    setMovements(updatedMovements);
    localStorage.setItem("warung_movements", JSON.stringify(updatedMovements));

    // Cleanup session states
    setIsSessionActive(false);
    setSessionItems([]);
    setShowConfirmModal(false);
    setSearchQuery("");
    setBarcodeInput("");
    playSuccessChime();

    triggerToast(`Opname selesai! ${itemsWithDiscrepancy.length} barang disesuaikan, database ter-update.`);
  };

  // Metrics calculations for the dashboard
  const monthlyAdjustments = movements.filter((m) => m.type === "ADJUST");
  const totalAdjustmentsCount = monthlyAdjustments.length;
  const totalDiscrepancyUnits = monthlyAdjustments.reduce((sum, m) => sum + m.quantity, 0);

  // Financial impact calculation
  const totalFinancialImpact = monthlyAdjustments.reduce((sum, m) => {
    const prod = products.find((p) => p.name === m.product);
    const costPrice = prod ? prod.costPrice : 0;
    return sum + (m.quantity * costPrice);
  }, 0);

  // Stock Accuracy
  const productsWithDiscrepancies = new Set(
    monthlyAdjustments.filter((m) => m.quantity !== 0).map((m) => m.product)
  );
  const accuracyRate = products.length > 0 
    ? ((products.length - productsWithDiscrepancies.size) / products.length) * 100 
    : 100;

  // Filtered session items for display in table
  const filteredSessionItems = sessionItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "Semua" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate session live statistics
  const sessionDiscrepancyCount = sessionItems.filter(item => item.physicalStock !== item.systemStock).length;
  const sessionDiscrepancyUnits = sessionItems.reduce((sum, item) => sum + (item.physicalStock - item.systemStock), 0);
  const sessionFinancialDiscrepancy = sessionItems.reduce((sum, item) => {
    const diff = item.physicalStock - item.systemStock;
    return sum + (diff * item.costPrice);
  }, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[100] bg-slate-900 border border-slate-800 text-white rounded-xl shadow-2xl p-4 flex items-center gap-3 animate-bounce max-w-sm">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-bold">{toastMessage}</p>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Konfirmasi Terapkan Opname</h3>
                <p className="text-slate-500 text-[10px] font-medium">Tinjau ringkasan perbedaan sebelum memperbarui stok sistem.</p>
              </div>
            </div>
            
            <div className="p-6 space-y-4 max-h-[300px] overflow-y-auto">
              <div className="grid grid-cols-3 gap-2 text-center select-none">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <p className="text-[9px] text-slate-400 font-extrabold uppercase">Barang Selisih</p>
                  <p className="text-lg font-black text-slate-800 mt-1">{sessionDiscrepancyCount} Item</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <p className="text-[9px] text-slate-400 font-extrabold uppercase">Total Selisih</p>
                  <p className={cn("text-lg font-black mt-1", sessionDiscrepancyUnits >= 0 ? "text-emerald-600" : "text-rose-600")}>
                    {sessionDiscrepancyUnits > 0 ? "+" : ""}{sessionDiscrepancyUnits} Pcs
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <p className="text-[9px] text-slate-400 font-extrabold uppercase">Nilai Kerugian</p>
                  <p className={cn("text-lg font-black mt-1", sessionFinancialDiscrepancy >= 0 ? "text-slate-800" : "text-rose-600")}>
                    {sessionFinancialDiscrepancy < 0 ? "-" : ""}Rp {Math.abs(sessionFinancialDiscrepancy).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>

              {sessionDiscrepancyCount > 0 ? (
                <div className="border border-slate-200/60 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase border-b border-slate-100">
                        <th className="py-2 px-3">Nama Produk</th>
                        <th className="py-2 px-3 text-center">Sistem</th>
                        <th className="py-2 px-3 text-center">Fisik</th>
                        <th className="py-2 px-3 text-right">Selisih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px] font-semibold text-slate-700">
                      {sessionItems
                        .filter((item) => item.physicalStock !== item.systemStock)
                        .map((item) => {
                          const diff = item.physicalStock - item.systemStock;
                          return (
                            <tr key={item.productId} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 truncate max-w-[180px] font-bold">{item.name}</td>
                              <td className="py-2 px-3 text-center text-slate-400">{item.systemStock}</td>
                              <td className="py-2 px-3 text-center font-bold">{item.physicalStock}</td>
                              <td className={cn("py-2 px-3 text-right font-black", diff > 0 ? "text-emerald-600" : "text-rose-600")}>
                                {diff > 0 ? "+" : ""}{diff}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl text-center flex flex-col items-center gap-1.5">
                  <CheckCircle className="h-6 w-6 text-emerald-500" />
                  <p className="text-xs font-bold">Stok Fisik 100% Akurat!</p>
                  <p className="text-[10px] text-emerald-600">Seluruh stok fisik yang Anda hitung cocok dengan stok sistem.</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-white text-slate-600 text-xs font-bold transition-all cursor-pointer"
              >
                Kembali Edit
              </button>
              <button
                onClick={commitSession}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-500/10"
              >
                Terapkan &amp; Simpan Opname
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Stock Opname</h1>
          <p className="text-slate-500 text-xs mt-1 font-medium">Audit stok fisik barang dengan alur scanning modern untuk presisi manajemen inventori.</p>
        </div>
        
        {/* Tab Toggle */}
        <div className="flex bg-slate-200/60 p-1 rounded-xl w-fit border border-slate-300/40 select-none">
          <button
            onClick={() => setActiveTab("session")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer",
              activeTab === "session"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <span className="flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" />
              Sesi Opname
            </span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer",
              activeTab === "history"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <span className="flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" />
              Riwayat Opname
            </span>
          </button>
        </div>
      </div>

      {activeTab === "session" ? (
        /* Active Opname Screen */
        !isSessionActive ? (
          /* Start Screen */
          <div className="space-y-6">
            {/* Dashboard metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-start gap-4">
                <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl border border-blue-100">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total Penyesuaian</p>
                  <p className="text-xl font-black text-slate-900 mt-1">
                    {totalAdjustmentsCount} <span className="text-xs text-slate-500 font-bold">Kali</span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Bulan berjalan ini</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-start gap-4">
                <div className={cn(
                  "p-2.5 rounded-xl border",
                  totalDiscrepancyUnits >= 0 
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                    : "bg-rose-50 text-rose-600 border-rose-100"
                )}>
                  {totalDiscrepancyUnits >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Selisih Unit</p>
                  <p className={cn("text-xl font-black mt-1", totalDiscrepancyUnits >= 0 ? "text-emerald-600" : "text-rose-600")}>
                    {totalDiscrepancyUnits > 0 ? "+" : ""}{totalDiscrepancyUnits} <span className="text-xs font-bold text-slate-500">Pcs</span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Total selisih fisik vs sistem</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-start gap-4">
                <div className={cn(
                  "p-2.5 rounded-xl border",
                  totalFinancialImpact >= 0 
                    ? "bg-slate-50 text-slate-600 border-slate-100" 
                    : "bg-rose-50 text-rose-600 border-rose-100"
                )}>
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Dampak Nilai Beli</p>
                  <p className={cn("text-xl font-black mt-1", totalFinancialImpact >= 0 ? "text-slate-800" : "text-rose-600")}>
                    {hidden ? "Rp ******" : `${totalFinancialImpact < 0 ? "-" : ""}Rp ${Math.abs(totalFinancialImpact).toLocaleString("id-ID")}`}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Kerugian modal dari selisih</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-start gap-4">
                <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl border border-amber-100">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-black text-slate-900 mt-1">{accuracyRate.toFixed(1)}%</p>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Akurasi Produk</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Persentase stok barang akurat</p>
                </div>
              </div>
            </div>

            {/* Start Session Banner */}
            <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-8 text-center max-w-2xl mx-auto flex flex-col items-center gap-6">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-full text-blue-600">
                <ClipboardList className="h-10 w-10 stroke-[1.5]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">Mulai Sesi Stock Opname Baru</h3>
                <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
                  Buka formulir audit stok secara keseluruhan. Anda dapat menggunakan barcode scanner untuk menghitung barang secara instan, atau memasukkannya secara manual.
                </p>
              </div>

              {/* Selection for initialization mode */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/40 w-full max-w-sm space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-left">Inisialisasi Stok Fisik Awal</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <label className={cn(
                    "border rounded-xl p-3 flex flex-col items-start gap-1 cursor-pointer transition-all select-none",
                    initialStockMode === "SYSTEM" 
                      ? "bg-white border-blue-500 shadow-sm text-blue-700" 
                      : "bg-slate-100/50 border-slate-200 text-slate-500 hover:bg-slate-100"
                  )}>
                    <input
                      type="radio"
                      name="initialMode"
                      value="SYSTEM"
                      checked={initialStockMode === "SYSTEM"}
                      onChange={() => setInitialStockMode("SYSTEM")}
                      className="sr-only"
                    />
                    <span className="text-xs font-bold">Stok Sistem</span>
                    <span className="text-[8px] text-left leading-normal text-slate-400">Dimulai dari stok saat ini, tinggal scan penyesuaian.</span>
                  </label>

                  <label className={cn(
                    "border rounded-xl p-3 flex flex-col items-start gap-1 cursor-pointer transition-all select-none",
                    initialStockMode === "ZERO" 
                      ? "bg-white border-blue-500 shadow-sm text-blue-700" 
                      : "bg-slate-100/50 border-slate-200 text-slate-500 hover:bg-slate-100"
                  )}>
                    <input
                      type="radio"
                      name="initialMode"
                      value="ZERO"
                      checked={initialStockMode === "ZERO"}
                      onChange={() => setInitialStockMode("ZERO")}
                      className="sr-only"
                    />
                    <span className="text-xs font-bold">Mulai dari Nol (0)</span>
                    <span className="text-[8px] text-left leading-normal text-slate-400">Kosongkan semua stok fisik, hitung ulang semua dari nol.</span>
                  </label>
                </div>
              </div>

              <button
                onClick={startNewSession}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 cursor-pointer active:scale-95"
              >
                <Play className="h-4 w-4 fill-current" />
                Mulai Sesi Opname
              </button>
            </div>
          </div>
        ) : (
          /* Active Session Workspace */
          <div className="space-y-6">
            
            {/* Session Toolbar */}
            <div className="bg-white border border-slate-200/60 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm leading-none">Sesi Stock Opname Sedang Berjalan</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Audit aktif untuk {sessionItems.length} produk di sistem</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={cancelSession}
                  className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Batalkan Sesi
                </button>
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Check className="h-4 w-4 stroke-[2.5]" />
                  Simpan &amp; Terapkan Opname
                </button>
              </div>
            </div>

            {/* Persistent Scanner Input Container */}
            <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-4 text-white shadow-lg">
              <div className="bg-blue-900/50 p-3 rounded-full text-blue-400 shrink-0 border border-blue-500/20">
                <Barcode className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div className="flex-1 w-full text-center md:text-left space-y-1">
                <h4 className="font-bold text-sm">Mode Pindai Cepat Aktif</h4>
                <p className="text-[10px] text-slate-400 font-medium">Arahkan scanner atau masukkan barcode di bawah ini. Tekan Enter untuk menambahkan +1 unit stok fisik.</p>
              </div>
              
              <form onSubmit={handleBarcodeSubmit} className="relative w-full max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder="Scan barcode / input SKU di sini..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-xl py-2.5 pl-10 pr-20 text-xs font-mono font-bold text-white placeholder-slate-600 transition-all duration-200"
                />
                <button
                  type="submit"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] tracking-wider uppercase px-2.5 py-1 rounded-md transition-all cursor-pointer"
                >
                  Proses
                </button>
              </form>
            </div>

            {/* Session Audit Table Container */}
            <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              
              {/* Table search & category filter */}
              <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                <div className="relative flex-1 max-w-md group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-slate-700 transition-colors" />
                  <input
                    type="text"
                    placeholder="Saring daftar sesi berdasarkan nama atau barcode SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200/80 focus:border-slate-400 focus:bg-white rounded-lg py-1.5 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all font-medium"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {categoriesList.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "px-3 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer active:scale-95 border",
                        selectedCategory === cat
                          ? "bg-blue-600 border-transparent text-white font-bold shadow-sm"
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table view */}
              <div className="overflow-x-auto">
                {filteredSessionItems.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/30 text-[10px] font-black text-slate-400 uppercase tracking-wider select-none">
                        <th className="py-3 px-5">Nama Barang &amp; SKU</th>
                        <th className="py-3 px-5 text-center">Stok Sistem</th>
                        <th className="py-3 px-5 text-center" style={{ width: "160px" }}>Hitungan Stok Fisik</th>
                        <th className="py-3 px-5 text-center" style={{ width: "100px" }}>Selisih</th>
                        <th className="py-3 px-5" style={{ width: "160px" }}>Alasan Selisih</th>
                        <th className="py-3 px-5">Catatan Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredSessionItems.map((item) => {
                        const difference = item.physicalStock - item.systemStock;
                        const isFlash = scannedIdFlash === item.productId;
                        
                        return (
                          <tr
                            key={item.productId}
                            id={`row-${item.productId}`}
                            className={cn(
                              "transition-all duration-300",
                              isFlash 
                                ? "bg-blue-50/80 scale-[1.01] border-l-4 border-l-blue-500 font-bold" 
                                : item.isScanned 
                                ? "bg-emerald-50/20 hover:bg-emerald-50/30" 
                                : "hover:bg-slate-50/40"
                            )}
                          >
                            
                            {/* Product Info */}
                            <td className="py-3 px-5">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs select-none shrink-0 border",
                                  isFlash 
                                    ? "bg-blue-600 text-white border-transparent" 
                                    : item.isScanned 
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                                    : "bg-slate-50 text-slate-400 border-slate-100"
                                )}>
                                  {item.isScanned && !isFlash ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : item.name.charAt(0)}
                                </div>
                                <div className="overflow-hidden">
                                  <p className="font-bold text-slate-800 truncate">{item.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="font-mono text-[9px] text-slate-400">{item.sku || "N/A"}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-350" />
                                    <span className="text-[9px] text-slate-400 font-bold uppercase">{item.category}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* System Stock */}
                            <td className="py-3 px-5 text-center font-bold text-slate-600 text-sm">
                              {item.systemStock}
                            </td>

                            {/* Physical Stock counter input */}
                            <td className="py-3 px-5 text-center">
                              <div className="flex items-center justify-center gap-1.5 w-full max-w-[140px] mx-auto">
                                <button
                                  type="button"
                                  onClick={() => updatePhysicalQty(item.productId, item.physicalStock - 1)}
                                  className="w-7 h-7 bg-slate-100 border border-slate-200 hover:bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 transition-all cursor-pointer active:scale-90 select-none"
                                >
                                  <Minus className="w-3 h-3 stroke-[3]" />
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  value={item.physicalStock}
                                  onChange={(e) => {
                                    const parsed = parseInt(e.target.value, 10);
                                    updatePhysicalQty(item.productId, isNaN(parsed) ? 0 : parsed);
                                  }}
                                  className="w-12 bg-white border border-slate-250 rounded-lg py-1 text-center font-black text-slate-800 focus:outline-none focus:border-blue-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => updatePhysicalQty(item.productId, item.physicalStock + 1)}
                                  className="w-7 h-7 bg-slate-100 border border-slate-200 hover:bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 transition-all cursor-pointer active:scale-90 select-none"
                                >
                                  <Plus className="w-3 h-3 stroke-[3]" />
                                </button>
                              </div>
                            </td>

                            {/* Discrepancy Selisih */}
                            <td className="py-3 px-5 text-center">
                              <span className={cn(
                                "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-extrabold select-none border",
                                difference === 0 
                                  ? "bg-slate-100 text-slate-500 border-slate-200/60"
                                  : difference > 0
                                  ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                                  : "bg-rose-50 border-rose-100 text-rose-700"
                              )}>
                                {difference > 0 ? "+" : ""}{difference} Pcs
                              </span>
                            </td>

                            {/* Dropdown Reason */}
                            <td className="py-3 px-5">
                              <select
                                disabled={difference === 0}
                                value={item.reason}
                                onChange={(e) => updateReason(item.productId, e.target.value)}
                                className="w-full bg-white border border-slate-250 disabled:bg-slate-50 disabled:text-slate-350 disabled:border-slate-150 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500 text-[10px] font-bold"
                              >
                                <option value="Salah Input">Salah Input</option>
                                <option value="Barang Rusak">Barang Rusak</option>
                                <option value="Kadaluarsa">Kadaluarsa</option>
                                <option value="Barang Hilang">Barang Hilang</option>
                                <option value="Lainnya">Lainnya</option>
                              </select>
                            </td>

                            {/* Additional Notes */}
                            <td className="py-3 px-5">
                              <input
                                type="text"
                                placeholder="Tulis alasan..."
                                disabled={difference === 0}
                                value={item.notes}
                                onChange={(e) => updateNotes(item.productId, e.target.value)}
                                className="w-full bg-white border border-slate-250 disabled:bg-slate-50 disabled:placeholder-slate-200 disabled:border-slate-150 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500 font-medium"
                              />
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-10 text-center text-slate-450">
                    <HelpCircle className="h-10 w-10 mx-auto text-slate-300 stroke-[1.5] mb-2" />
                    <p className="text-xs font-semibold">Tidak ada produk yang cocok dengan pencarian di sesi opname ini.</p>
                  </div>
                )}
              </div>

            </div>

          </div>
        )
      ) : (
        /* History Log View */
        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Histori Opname &amp; Penyesuaian</h3>
            <span className="text-[10px] bg-blue-50 border border-blue-100 text-blue-600 font-bold px-2 py-0.5 rounded-md select-none">
              Buku Audit Mutasi
            </span>
          </div>

          <div className="overflow-x-auto">
            {monthlyAdjustments.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/30 text-[10px] font-black text-slate-400 uppercase tracking-wider select-none">
                    <th className="py-3 px-5" style={{ width: "150px" }}>Tanggal Audit</th>
                    <th className="py-3 px-5">Nama Barang</th>
                    <th className="py-3 px-5 text-center">Tipe Mutasi</th>
                    <th className="py-3 px-5 text-center" style={{ width: "120px" }}>Jumlah Penyesuaian</th>
                    <th className="py-3 px-5">Keterangan Penyesuaian</th>
                    <th className="py-3 px-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {monthlyAdjustments.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/40 transition-colors">
                      {/* Tanggal */}
                      <td className="py-3.5 px-5 font-mono text-[10px] text-slate-400">
                        {m.date}
                      </td>

                      {/* Produk */}
                      <td className="py-3.5 px-5 font-bold text-slate-800">
                        {m.product}
                      </td>

                      {/* Tipe */}
                      <td className="py-3.5 px-5 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-extrabold bg-blue-50 border border-blue-100 text-blue-700 select-none uppercase tracking-wide">
                          OPNAME
                        </span>
                      </td>

                      {/* Jumlah */}
                      <td className="py-3.5 px-5 text-center font-bold">
                        <span className={cn(
                          "font-black text-sm",
                          m.quantity === 0 
                            ? "text-slate-400"
                            : m.quantity > 0 
                            ? "text-emerald-600" 
                            : "text-rose-600"
                        )}>
                          {m.quantity > 0 ? "+" : ""}{m.quantity}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium ml-1">Pcs</span>
                      </td>

                      {/* Deskripsi */}
                      <td className="py-3.5 px-5 text-slate-500 font-medium text-xs leading-relaxed">
                        {m.description}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5 text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-0.5 select-none">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          Diterapkan
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-10 text-center text-slate-400">
                <History className="h-10 w-10 mx-auto text-slate-300 stroke-[1.5] mb-2" />
                <p className="text-xs font-semibold">Belum ada riwayat stock opname yang tercatat.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
