"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Diamond, ShieldAlert, Key, User, ArrowRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to dashboard root
    const loggedIn = localStorage.getItem("warung_logged_in");
    if (loggedIn === "true") {
      router.push("/");
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Basic timeout to simulate a premium network response
    setTimeout(() => {
      const cleanUser = username.trim().toLowerCase();
      const cleanPass = password.trim();

      if (cleanUser === "admin" && cleanPass === "admin123") {
        localStorage.setItem("warung_logged_in", "true");
        localStorage.setItem("warung_user_name", "Aris Setiyono");
        localStorage.setItem("warung_user_role", "Owner");
        router.push("/");
      } else if (cleanUser === "kasir" && cleanPass === "kasir123") {
        localStorage.setItem("warung_logged_in", "true");
        localStorage.setItem("warung_user_name", "Kasir Utama");
        localStorage.setItem("warung_user_role", "Kasir");
        router.push("/");
      } else {
        setError("Username atau password salah!");
        setShake(true);
        setLoading(false);
        setTimeout(() => setShake(false), 500);
      }
    }, 850);
  };

  const handleQuickLogin = (role: "owner" | "kasir") => {
    setError("");
    setLoading(true);
    setTimeout(() => {
      if (role === "owner") {
        localStorage.setItem("warung_logged_in", "true");
        localStorage.setItem("warung_user_name", "Aris Setiyono");
        localStorage.setItem("warung_user_role", "Owner");
      } else {
        localStorage.setItem("warung_logged_in", "true");
        localStorage.setItem("warung_user_name", "Kasir Utama");
        localStorage.setItem("warung_user_role", "Kasir");
      }
      router.push("/");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100/50 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-slate-300/20 rounded-full blur-3xl pointer-events-none" />

      {/* Styled styles for shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>

      {/* Login Card Container */}
      <div 
        className={cn(
          "w-full max-w-[420px] backdrop-blur-md bg-white/85 border border-slate-200/50 shadow-2xl rounded-3xl p-8 relative z-10 transition-all duration-300",
          shake && "animate-shake border-rose-200 bg-rose-50/10"
        )}
      >
        {/* Brand/App Identity */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-blue-600 p-3.5 rounded-2xl shadow-xl shadow-blue-500/25 mb-4 animate-in zoom-in duration-500">
            <Diamond className="h-6 w-6 text-white stroke-[2]" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Warung Kita</h1>
          <p className="text-slate-500 text-xs mt-1 font-medium">Sistem Manajemen POS &amp; Inventori</p>
        </div>

        {/* Error Notification Banner */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-center gap-2.5 animate-in fade-in duration-300">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block pl-1">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm disabled:bg-slate-50/50 disabled:text-slate-400"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block pl-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm disabled:bg-slate-50/50 disabled:text-slate-400"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full relative flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:transform-none disabled:shadow-none cursor-pointer overflow-hidden mt-6"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Menghubungkan Sesi...</span>
              </div>
            ) : (
              <>
                <span>Masuk Ke Dashboard</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200/80" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
            <span className="bg-white/90 backdrop-blur-md px-3 text-slate-400">Atau Uji Cepat</span>
          </div>
        </div>

        {/* Quick Login Shortcuts */}
        <div className="grid grid-cols-2 gap-3.5">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickLogin("owner")}
            className="flex flex-col items-center justify-center p-3 border border-slate-200/80 rounded-2xl bg-slate-50 hover:bg-blue-50/40 hover:border-blue-200 transition-all duration-200 cursor-pointer active:scale-95 group"
          >
            <span className="text-[10px] font-black text-slate-800 group-hover:text-blue-600">Owner / Admin</span>
            <span className="text-[8px] font-bold text-slate-400 mt-0.5">Akses Penuh</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickLogin("kasir")}
            className="flex flex-col items-center justify-center p-3 border border-slate-200/80 rounded-2xl bg-slate-50 hover:bg-blue-50/40 hover:border-blue-200 transition-all duration-200 cursor-pointer active:scale-95 group"
          >
            <span className="text-[10px] font-black text-slate-800 group-hover:text-blue-600">Staff Kasir</span>
            <span className="text-[8px] font-bold text-slate-400 mt-0.5">Sesi POS Utama</span>
          </button>
        </div>

        {/* Footer Credit */}
        <p className="text-[10px] text-slate-400 text-center font-medium mt-8 leading-relaxed">
          Sistem POS Terlindungi lokal browser.
        </p>
      </div>
    </div>
  );
}
