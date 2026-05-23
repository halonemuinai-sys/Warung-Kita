"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  UserPlus,
  X,
  Check,
  ChevronRight,
  Trash2
} from "lucide-react";
import { useHideAmounts } from "@/lib/hide-amounts";
import { cn } from "@/lib/utils";

const mockDebts = [
  { id: "1", name: "Bu Joko", phone: "08123456789", totalDebt: 120000, remaining: 50000, status: "PARTIAL", lastPayment: "2026-05-20" },
  { id: "2", name: "Pak RT Slamet", phone: "08987654321", totalDebt: 156000, remaining: 156000, status: "UNPAID", lastPayment: "-" },
  { id: "3", name: "Mbak Sri", phone: "08561122334", totalDebt: 45000, remaining: 0, status: "PAID", lastPayment: "2026-05-22" },
  { id: "4", name: "Mas Doni", phone: "08778899001", totalDebt: 85000, remaining: 35000, status: "PARTIAL", lastPayment: "2026-05-18" },
];

export default function DebtsPage() {
  const { hidden } = useHideAmounts();
  const [debts, setDebts] = useState<any[]>(mockDebts);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal States
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState<any>(null);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<number>(0);

  // New Customer Form States
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custInitialDebt, setCustInitialDebt] = useState<number>(0);

  useEffect(() => {
    const savedDebts = localStorage.getItem("warung_debts");
    if (savedDebts) {
      try {
        setDebts(JSON.parse(savedDebts));
      } catch (e) {
        console.error(e);
      }
    } else {
      localStorage.setItem("warung_debts", JSON.stringify(mockDebts));
    }
  }, []);

  const filteredDebts = debts.filter((d) => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalOutstanding = debts.reduce((sum, d) => sum + d.remaining, 0);
  const unpaidCount = debts.filter((d) => d.remaining > 0).length;
  const totalPaid = debts.reduce((sum, d) => sum + (d.totalDebt - d.remaining), 0);

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt) return;

    if (payAmount <= 0 || payAmount > selectedDebt.remaining) {
      alert("Jumlah pembayaran tidak valid.");
      return;
    }

    const updatedDebts = debts.map((d) => {
      if (d.id === selectedDebt.id) {
        const nextRemaining = d.remaining - payAmount;
        const now = new Date();
        const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        return {
          ...d,
          remaining: nextRemaining,
          status: nextRemaining === 0 ? "PAID" as const : "PARTIAL" as const,
          lastPayment: todayString
        };
      }
      return d;
    });

    setDebts(updatedDebts);
    localStorage.setItem("warung_debts", JSON.stringify(updatedDebts));
    setIsPayOpen(false);
    setSelectedDebt(null);
  };

  const handleSaveNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;

    const now = new Date();
    const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const newCust = {
      id: String(Date.now()),
      name: custName,
      phone: custPhone,
      totalDebt: custInitialDebt || 0,
      remaining: custInitialDebt || 0,
      status: (custInitialDebt || 0) > 0 ? "UNPAID" as const : "PAID" as const,
      lastPayment: (custInitialDebt || 0) > 0 ? todayString : "-"
    };

    const updatedDebts = [...debts, newCust];
    setDebts(updatedDebts);
    localStorage.setItem("warung_debts", JSON.stringify(updatedDebts));

    // Reset Form
    setCustName("");
    setCustPhone("");
    setCustInitialDebt(0);
    setIsNewCustomerOpen(false);
  };

  const handleDeleteDebt = (id: string, name: string) => {
    const debtObj = debts.find((d) => d.id === id);
    if (!debtObj) return;
    setDebtToDelete(debtObj);
    setIsDeleteOpen(true);
  };

  const executeDeleteDebt = () => {
    if (!debtToDelete) return;
    const id = debtToDelete.id;
    setIsDeleteOpen(false);
    setDeletingId(id);

    setTimeout(() => {
      const updatedDebts = debts.filter((d) => d.id !== id);
      setDebts(updatedDebts);
      localStorage.setItem("warung_debts", JSON.stringify(updatedDebts));
      setDeletingId(null);
      setDebtToDelete(null);
    }, 600);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      <style>{`
        @keyframes fadeOutCollapseTd {
          0% {
            padding-top: 14px;
            padding-bottom: 14px;
            opacity: 1;
            transform: scale(1) translateX(0);
            background-color: rgba(254, 242, 242, 0.4);
            filter: blur(0);
          }
          20% {
            padding-top: 14px;
            padding-bottom: 14px;
            opacity: 1;
            transform: scale(1.01);
            background-color: rgba(239, 68, 68, 0.15);
            filter: blur(0);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.95) translateX(30px);
            background-color: rgba(239, 68, 68, 0.2);
            filter: blur(2px);
          }
          100% {
            padding-top: 0;
            padding-bottom: 0;
            opacity: 0;
            height: 0;
            line-height: 0;
            font-size: 0;
            transform: scale(0.8) translateX(-100px);
            filter: blur(12px);
            background-color: rgba(239, 68, 68, 0);
          }
        }
        .row-deleting td {
          animation: fadeOutCollapseTd 600ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
          overflow: hidden;
          pointer-events: none;
        }
      `}</style>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Buku Kasbon (Hutang Pelanggan)</h1>
          <p className="text-slate-500 text-xs mt-1 font-medium">Pantau hutang belanja pelanggan warung, catat cicilan pembayaran, dan kelola kasbon lunas.</p>
        </div>
        
        <button 
          onClick={() => setIsNewCustomerOpen(true)}
          className="group relative flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 overflow-hidden cursor-pointer"
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          <UserPlus className="h-4 w-4 transition-transform group-hover:scale-110 duration-350" /> 
          Daftar Pelanggan Baru
        </button>
      </div>

      {/* Grid Ringkasan Kasbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 chart-reveal">
        {/* Card 1: Total Piutang Aktif */}
        <div className="group relative bg-white border border-slate-200/80 rounded-[22px] p-5 shadow-sm hover:shadow-md hover:border-rose-300 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-50/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          </div>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total Piutang Aktif</span>
              <h3 className="text-xl font-black text-rose-600 mt-1.5 tracking-tight">
                {hidden ? "Rp ••••••" : `Rp ${totalOutstanding.toLocaleString("id-ID")}`}
              </h3>
            </div>
            <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-xl text-rose-600 transition-transform group-hover:rotate-6 duration-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[9px] text-slate-400 font-medium relative z-10">Uang warung yang ada di pelanggan</p>
        </div>

        {/* Card 2: Jumlah Orang Berhutang */}
        <div className="group relative bg-white border border-slate-200/80 rounded-[22px] p-5 shadow-sm hover:shadow-md hover:border-amber-300 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-50/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          </div>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Jumlah Orang Berhutang</span>
              <h3 className="text-xl font-bold text-slate-800 mt-1.5">{unpaidCount} Orang</h3>
            </div>
            <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-xl text-amber-600 transition-transform group-hover:-rotate-6 duration-300">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[9px] text-slate-400 font-medium relative z-10">Pelanggan dengan kasbon belum lunas</p>
        </div>

        {/* Card 3: Terbayar Bulan Ini */}
        <div className="group relative bg-white border border-slate-200/80 rounded-[22px] p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          </div>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total Terbayar</span>
              <h3 className="text-xl font-bold text-slate-850 mt-1.5">
                {hidden ? "Rp ••••••" : `Rp ${totalPaid.toLocaleString("id-ID")}`}
              </h3>
            </div>
            <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl text-blue-600 transition-transform group-hover:rotate-12 duration-300">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[9px] text-slate-400 font-medium relative z-10">Total cicilan/pelunasan terbayar</p>
        </div>
      </div>

      {/* Daftar Piutang Pelanggan */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama pelanggan berhutang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
          />
        </div>

        {/* Table Container */}
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-55/40 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-4 px-5">Nama Pelanggan</th>
                  <th className="py-4 px-5">No. Telepon</th>
                  <th className="py-4 px-5 text-right">Total Hutang Awal</th>
                  <th className="py-4 px-5 text-right">Sisa Hutang</th>
                  <th className="py-4 px-5 text-center">Status</th>
                  <th className="py-4 px-5">Pembayaran Terakhir</th>
                  <th className="py-4 px-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-slate-600 divide-y divide-slate-100">
                {filteredDebts.length > 0 ? (
                  filteredDebts.map((d) => {
                    const hasOutstanding = d.remaining > 0;
                    return (
                      <tr 
                        key={d.id} 
                        className={cn(
                          "hover:bg-slate-50/60 transition-all duration-200 group",
                          deletingId === d.id && "row-deleting"
                        )}
                      >
                        {/* Name */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2.5">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm",
                              hasOutstanding 
                                ? "bg-rose-50 text-rose-600 border border-rose-100" 
                                : "bg-blue-50 text-blue-600 border border-blue-100"
                            )}>
                              {d.name.charAt(0)}
                            </div>
                            <span className="font-extrabold text-slate-800 text-[13px] group-hover:text-blue-600 transition-colors">
                              {d.name}
                            </span>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="py-3.5 px-5 text-slate-400 font-medium">{d.phone || "-"}</td>

                        {/* Total Debt */}
                        <td className="py-3.5 px-5 text-right font-medium text-slate-500">
                          {hidden ? "Rp ••••••" : `Rp ${d.totalDebt.toLocaleString("id-ID")}`}
                        </td>

                        {/* Remaining Debt */}
                        <td className={cn(
                          "py-3.5 px-5 text-right font-extrabold text-[13px]",
                          hasOutstanding ? "text-slate-900" : "text-emerald-600 font-bold"
                        )}>
                          {hasOutstanding 
                            ? (hidden ? "Rp ••••••" : `Rp ${d.remaining.toLocaleString("id-ID")}`) 
                            : "Lunas"
                          }
                        </td>

                        {/* Status Badges */}
                        <td className="py-3.5 px-5 text-center">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border uppercase tracking-wider",
                            d.status === "PAID" ? "bg-blue-50 text-blue-700 border-blue-100" :
                            d.status === "PARTIAL" ? "bg-amber-50 text-amber-700 border-amber-100 animate-pulse" :
                            "bg-rose-50 text-rose-700 border-rose-100"
                          )}>
                            {d.status === "PAID" ? "Lunas" : d.status === "PARTIAL" ? "Dicicil" : "Belum Bayar"}
                          </span>
                        </td>

                        {/* Last Payment */}
                        <td className="py-3.5 px-5 text-slate-500 font-semibold">{d.lastPayment}</td>

                        {/* Actions */}
                        <td className="py-3.5 px-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {hasOutstanding && (
                              <button 
                                onClick={() => {
                                  setSelectedDebt(d);
                                  setPayAmount(d.remaining);
                                  setIsPayOpen(true);
                                }}
                                className="group/btn flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg transition-all shadow-sm shadow-blue-500/10 cursor-pointer active:scale-95"
                              >
                                <DollarSign className="h-3 w-3 transition-transform group-hover/btn:scale-110" />
                                Bayar
                              </button>
                            )}
                            <button 
                              title="Detail Transaksi"
                              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer active:scale-90"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteDebt(d.id, d.name)}
                              title="Hapus Data Pelanggan"
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer active:scale-90"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Users className="h-10 w-10 text-slate-400 mx-auto mb-2 stroke-[1.5]" />
                      <p className="text-xs font-semibold">Tidak ada pelanggan dengan nama tersebut.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: BAYAR KASBON */}
      {isPayOpen && selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[24px] border border-slate-200/80 shadow-2xl p-6 relative overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Catat Pembayaran Kasbon</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">{selectedDebt.name}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsPayOpen(false);
                  setSelectedDebt(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSavePayment} className="py-4 space-y-4 text-xs">
              <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase block">Sisa Hutang Saat Ini</span>
                <span className="text-lg font-black text-rose-600">
                  Rp {selectedDebt.remaining.toLocaleString("id-ID")}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-extrabold tracking-wider uppercase">Jumlah Pembayaran (Rp)</label>
                <input
                  type="number"
                  min={100}
                  max={selectedDebt.remaining}
                  value={payAmount === 0 ? "" : payAmount}
                  onChange={(e) => setPayAmount(Math.min(selectedDebt.remaining, Math.max(0, parseInt(e.target.value) || 0)))}
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              {/* Quick buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPayAmount(selectedDebt.remaining)}
                  className="flex-1 py-1.5 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-50 cursor-pointer active:scale-95 transition-all"
                >
                  Bayar Lunas
                </button>
                {selectedDebt.remaining > 50000 && (
                  <button
                    type="button"
                    onClick={() => setPayAmount(50000)}
                    className="flex-1 py-1.5 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-50 cursor-pointer active:scale-95 transition-all"
                  >
                    Rp 50.000
                  </button>
                )}
                {selectedDebt.remaining > 100000 && (
                  <button
                    type="button"
                    onClick={() => setPayAmount(100000)}
                    className="flex-1 py-1.5 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-50 cursor-pointer active:scale-95 transition-all"
                  >
                    Rp 100.000
                  </button>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px] font-medium text-slate-500">
                <span>Sisa Hutang Baru:</span>
                <span className="font-extrabold text-slate-800">
                  Rp {(selectedDebt.remaining - payAmount).toLocaleString("id-ID")}
                </span>
              </div>

              {/* Footer */}
              <div className="pt-4 flex gap-2 justify-end">
                <button 
                  type="button"
                  onClick={() => {
                    setIsPayOpen(false);
                    setSelectedDebt(null);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/10 hover:shadow-blue-500/25 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DAFTAR PELANGGAN BARU */}
      {isNewCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[24px] border border-slate-200/80 shadow-2xl p-6 relative overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Daftar Pelanggan Baru</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Tambah buku catatan kasbon untuk pelanggan.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsNewCustomerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveNewCustomer} className="py-4 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-extrabold tracking-wider uppercase">Nama Lengkap</label>
                <input
                  type="text"
                  placeholder="Contoh: Pak Budi"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-extrabold tracking-wider uppercase">No. Telepon (WhatsApp)</label>
                <input
                  type="text"
                  placeholder="Contoh: 0812xxxxxxxx"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-extrabold tracking-wider uppercase">Saldo Hutang Awal (Jika ada)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={custInitialDebt === 0 ? "" : custInitialDebt}
                  onChange={(e) => setCustInitialDebt(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-600 shadow-sm font-bold"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 flex gap-2 justify-end">
                <button 
                  type="button"
                  onClick={() => setIsNewCustomerOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/10 hover:shadow-blue-500/25 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS KASBON */}
      {isDeleteOpen && debtToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[24px] border border-slate-200/80 shadow-2xl p-6 relative overflow-hidden flex flex-col animate-in scale-in duration-300">
            {/* Soft background glow */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
            
            {/* Header / Warning Icon */}
            <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100 shrink-0">
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-2xl mb-3 animate-bounce">
                <Trash2 className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">Hapus Data Pelanggan?</h3>
              <p className="text-[11px] text-slate-400 mt-1 font-medium px-4">
                Tindakan ini akan menghapus semua riwayat kasbon secara permanen dari database lokal warung.
              </p>
            </div>

            {/* Content / Info Card */}
            <div className="py-4 space-y-3.5 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Nama Pelanggan</span>
                  <span className="font-extrabold text-slate-800 text-[13px]">{debtToDelete.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">No. Telepon</span>
                  <span className="font-semibold text-slate-600">{debtToDelete.phone || "-"}</span>
                </div>
                <div className="h-px bg-slate-200/60 my-1" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Sisa Hutang Aktif</span>
                  <span className={cn(
                    "font-black text-[13px]",
                    debtToDelete.remaining > 0 ? "text-rose-600 animate-pulse" : "text-emerald-600"
                  )}>
                    Rp {debtToDelete.remaining.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {debtToDelete.remaining > 0 && (
                <div className="flex gap-2 items-start p-3 bg-amber-50/60 border border-amber-100 text-amber-800 rounded-xl text-[10px] leading-relaxed">
                  <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="font-medium">
                    <strong className="font-extrabold">Perhatian:</strong> Pelanggan masih memiliki hutang berjalan sebesar <strong className="font-extrabold">Rp {debtToDelete.remaining.toLocaleString("id-ID")}</strong>. Apakah Anda yakin ingin mengikhlaskan/menghapus catatan ini?
                  </p>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex gap-3 justify-end shrink-0">
              <button 
                type="button"
                onClick={() => {
                  setIsDeleteOpen(false);
                  setDebtToDelete(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer text-center active:scale-95"
              >
                Batal
              </button>
              <button 
                type="button"
                onClick={executeDeleteDebt}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-500/10 hover:shadow-rose-500/25 transition-all cursor-pointer text-center active:scale-95"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
