"use client";

import { useState, useEffect } from "react";
import { 
  Store, 
  Users, 
  Database, 
  ShieldAlert, 
  Save,
  KeyRound,
  Plus,
  X,
  Lock,
  Mail,
  ShieldCheck,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [storeName, setStoreName] = useState("Warung Kita");
  const [storePhone, setStorePhone] = useState("081234567890");
  const [storeAddress, setStoreAddress] = useState("Jl. Kebon Raya No. 42, Jakarta");
  const [activeSettingsTab, setActiveSettingsTab] = useState<"PROFILE" | "USERS" | "DATABASE">("PROFILE");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Supabase Database Connection Status
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  // Staff Management State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [submittingStaff, setSubmittingStaff] = useState(false);
  const [staffError, setStaffError] = useState("");
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CASHIER",
  });

  const fetchDbStatus = async () => {
    try {
      const res = await fetch("/api/db-status");
      const data = await res.json();
      setDbConnected(data.connected);
    } catch {
      setDbConnected(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error("Gagal mengambil data user:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchDbStatus();
    fetchUsers();
  }, []);

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError("");
    setSubmittingStaff(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staffForm),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan staff");
      }

      // Reset form, reload list, close modal
      setStaffForm({ name: "", email: "", password: "", role: "CASHIER" });
      await fetchUsers();
      setIsAddStaffOpen(false);
    } catch (err: any) {
      setStaffError(err.message || "Terjadi kesalahan!");
    } finally {
      setSubmittingStaff(false);
    }
  };

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
                <button 
                  onClick={() => setIsAddStaffOpen(true)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10.5px] rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-95 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Staff
                </button>
              </div>

              {loadingUsers ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-2">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-bold text-slate-500">Memuat data staff...</span>
                </div>
              ) : usersList.length === 0 ? (
                <div className="text-center p-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  <span className="text-xs font-bold text-slate-500">Belum ada staff terdaftar.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {usersList.map((user, i) => (
                    <div key={user.id || i} className="group flex justify-between items-center p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 hover:border-slate-400 rounded-xl transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center font-extrabold text-slate-600 text-xs shadow-sm">
                          {user.name ? user.name.split(" ").filter(Boolean).map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) : "U"}
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
              )}
            </div>
          )}

          {activeSettingsTab === "DATABASE" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Konfigurasi Database</h3>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Pantau status koneksi database aplikasi ke Supabase Cloud.</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white border border-slate-200/80 rounded-[18px] flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3.5">
                    <div className={cn(
                      "w-10 h-10 rounded-xl border flex items-center justify-center transition-colors",
                      dbConnected === true 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                        : dbConnected === false
                          ? "bg-rose-50 border-rose-200 text-rose-600"
                          : "bg-slate-50 border-slate-200 text-slate-400"
                    )}>
                      <Database className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Supabase Cloud</h4>
                      <p className="text-[9.5px] text-slate-500 font-medium mt-0.5">
                        {dbConnected === true 
                          ? "Koneksi Aktif • Terhubung dengan Benar" 
                          : dbConnected === false 
                            ? "Koneksi Terputus • Mode Demo Aktif" 
                            : "Menghubungkan ke Database..."}
                      </p>
                    </div>
                  </div>
                  {dbConnected === true ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full font-extrabold border border-emerald-200">
                      <ShieldCheck className="h-3.5 w-3.5" /> Online
                    </span>
                  ) : dbConnected === false ? (
                    <span className="flex items-center gap-1 text-[10px] text-rose-600 bg-rose-50 px-3 py-1 rounded-full font-extrabold border border-rose-200">
                      <ShieldAlert className="h-3.5 w-3.5" /> Offline (Demo Mode)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 px-3 py-1 rounded-full font-extrabold border border-slate-200">
                      Loading...
                    </span>
                  )}
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
                    Saat ini aplikasi Anda sudah terintegrasi penuh dengan Supabase. Koneksi di Vercel nanti akan otomatis berjalan online setelah Anda menambahkan variabel <code className="bg-blue-100/60 px-1 py-0.5 rounded font-mono text-[9px] text-blue-900">DATABASE_URL</code> dan <code className="bg-blue-100/60 px-1 py-0.5 rounded font-mono text-[9px] text-blue-900">DIRECT_URL</code> di pengaturan Vercel.
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

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-[24px] shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-300">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">Tambah Staff Baru</h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Daftarkan akun kasir atau admin baru ke database</p>
              </div>
              <button 
                onClick={() => setIsAddStaffOpen(false)}
                className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg transition-colors border border-transparent hover:border-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddStaffSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {staffError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-bold text-[11px] leading-tight">{staffError}</span>
                </div>
              )}

              {/* Name Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Masukkan nama staff"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Email / Username</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="contoh@warungkita.com"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Masukkan password akun"
                    value={staffForm.password}
                    onChange={(e) => setStaffForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Role Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Hak Akses / Role</label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm cursor-pointer"
                >
                  <option value="CASHIER">Kasir (Akses Terbatas ke POS & Kasbon)</option>
                  <option value="ADMIN">Administrator / Owner (Akses Penuh)</option>
                </select>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 hover:border-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  disabled={submittingStaff}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingStaff}
                  className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95 disabled:cursor-not-allowed"
                >
                  {submittingStaff ? "Menyimpan..." : "Tambah Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
