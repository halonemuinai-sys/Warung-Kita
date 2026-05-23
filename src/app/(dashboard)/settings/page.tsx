"use client";

import { useState, useEffect } from "react";
import { 
  Store, 
  Users, 
  Database, 
  ShieldAlert, 
  Save,
  KeyRound
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [storeName, setStoreName] = useState("Warung Kita");
  const [storePhone, setStorePhone] = useState("081234567890");
  const [storeAddress, setStoreAddress] = useState("Jl. Kebon Raya No. 42, Jakarta");
  const [activeSettingsTab, setActiveSettingsTab] = useState<"PROFILE" | "USERS" | "DATABASE">("PROFILE");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-700 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pengaturan Aplikasi</h1>
        <p className="text-slate-500 text-xs mt-1 font-medium">Konfigurasi profil warung, kelola staff kasir, dan pantau status koneksi database.</p>
      </div>

      {/* Layout Grid */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Navigation Sidebar Settings */}
        <div className="w-full md:w-60 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0 shrink-0">
          {[
            { key: "PROFILE", label: "Profil Warung", icon: Store },
            { key: "USERS", label: "Staff & Pengguna", icon: Users },
            { key: "DATABASE", label: "Koneksi Database", icon: Database },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSettingsTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveSettingsTab(item.key as any)}
                className={cn(
                  "flex items-center gap-3 px-4.5 py-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer w-full text-left border",
                  isActive
                    ? "bg-blue-50 text-blue-700 border-blue-200/60 shadow-sm"
                    : "bg-white border-slate-200/60 text-slate-500 hover:text-slate-800 hover:bg-slate-50/80 hover:border-slate-300"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0 transition-transform", isActive ? "scale-110 text-blue-600" : "text-slate-400")} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Content Box Settings */}
        <div className="flex-1 w-full bg-white border border-slate-200/80 rounded-[22px] p-6.5 shadow-sm hover:shadow-md transition-shadow duration-300">
          {activeSettingsTab === "PROFILE" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Profil Warung Kita</h3>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Informasi ini akan dicetak pada kepala struk transaksi belanja pelanggan.</p>
              </div>

              <div className="space-y-4 max-w-xl">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Nama Warung</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Nomor Telepon</label>
                  <input
                    type="text"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Alamat Lengkap</label>
                  <textarea
                    value={storeAddress}
                    rows={3}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm resize-none"
                  />
                </div>
              </div>

              <button className="group relative flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 overflow-hidden cursor-pointer">
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <Save className="h-4 w-4" /> 
                Simpan Perubahan
              </button>
            </div>
          )}

          {activeSettingsTab === "USERS" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Staff &amp; Hak Akses</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Kelola akun kasir dan administrator sistem warung.</p>
                </div>
                <button className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10.5px] rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-95">
                  + Tambah Staff
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { name: "Owner Prisma", email: "owner@warungkita.com", role: "Administrator", roleColor: "bg-blue-50 text-blue-700 border-blue-100/60" },
                  { name: "Siti Rahma", email: "siti@warungkita.com", role: "Kasir / Cashier", roleColor: "bg-emerald-50 text-emerald-700 border-emerald-100" },
                ].map((user, i) => (
                  <div key={i} className="group flex justify-between items-center p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 hover:border-slate-400 rounded-xl transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center font-extrabold text-slate-600 text-xs shadow-sm">
                        {user.name.split(" ").map(w => w[0]).join("")}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{user.name}</h4>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "px-2.5 py-0.5 border rounded-lg text-[9px] font-extrabold tracking-wide uppercase",
                        user.roleColor
                      )}>
                        {user.role}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-slate-800 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all cursor-pointer active:scale-90">
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSettingsTab === "DATABASE" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Konfigurasi Database</h3>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Pantau status koneksi database aplikasi ke Supabase Cloud.</p>
              </div>

              <div className="space-y-4">
                {/* Supabase offline */}
                <div className="p-4 bg-white border border-slate-200/80 rounded-[18px] flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                      <Database className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Supabase Cloud</h4>
                      <p className="text-[9.5px] text-slate-500 font-medium mt-0.5">Vercel Deployment • Belum Terkoneksi</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-extrabold border border-slate-200">
                    <ShieldAlert className="h-3 w-3" /> Offline (Demo Mode)
                  </span>
                </div>
              </div>

              {/* Callout box */}
              <div className="p-4.5 bg-blue-50/50 border border-blue-100/80 rounded-[18px] flex gap-3 items-start">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
                  💡
                </div>
                <div>
                  <h5 className="text-[11.5px] font-bold text-blue-800">Info Migrasi Supabase &amp; Vercel</h5>
                  <p className="text-[10px] text-blue-700/80 leading-relaxed font-semibold mt-1">
                    Ketika Anda siap untuk mempublikasikan (deploy) ke Vercel, Anda hanya perlu membuat database PostgreSQL baru di dashboard Supabase. Selanjutnya, masukkan string koneksi Supabase Anda ke variabel <code className="bg-blue-100/60 px-1 py-0.5 rounded font-mono text-[9px] text-blue-900">DATABASE_URL</code> di file <code className="bg-blue-100/60 px-1 py-0.5 rounded font-mono text-[9px] text-blue-900">.env</code> lalu jalankan migrasi prisma.
                  </p>
                </div>
              </div>

              {/* Reset Data Section */}
              <div className="p-5 border border-rose-200 bg-rose-50/30 rounded-[22px] space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                    ⚠️ Reset Data &amp; Cache Aplikasi
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold mt-1.5">
                    Jika Anda masih melihat warna ungu/pink lama, atau ingin membersihkan semua data cache browser local storage dan mengembalikan semua produk &amp; kategori ke default, gunakan tombol di bawah ini. Semua custom produk dan riwayat transaksi akan dihapus.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm("Apakah Anda yakin ingin menghapus semua data (produk, kategori, transaksi, hutang) dan merestart aplikasi dengan data bawaan yang bersih? Tindakan ini akan mengosongkan cache local storage di browser Anda.")) {
                      localStorage.clear();
                      window.location.href = "/";
                    }
                  }}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-2"
                >
                  🧹 Hapus Semua Data &amp; Reset Aplikasi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
