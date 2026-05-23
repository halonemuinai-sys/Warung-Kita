"use client";

import { useState, useEffect } from "react";
import { 
  Target, 
  TrendingUp, 
  Calendar, 
  Save, 
  RefreshCw, 
  Flame, 
  Award, 
  HelpCircle, 
  CheckCircle2, 
  XCircle,
  AlertCircle
} from "lucide-react";
import { useHideAmounts } from "@/lib/hide-amounts";
import { cn } from "@/lib/utils";

const defaultTargets = {
  daily: 1500000,
  monthly: 35000000
};

export default function TargetsPage() {
  const { hidden } = useHideAmounts();
  const [syncing, setSyncing] = useState(false);
  const [targetDaily, setTargetDaily] = useState(defaultTargets.daily);
  const [targetMonthly, setTargetMonthly] = useState(defaultTargets.monthly);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Load data from localStorage
  const loadData = () => {
    // Targets
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

    // Transactions
    const savedTxs = localStorage.getItem("warung_transactions");
    if (savedTxs) {
      try {
        setTransactions(JSON.parse(savedTxs));
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSync = () => {
    setSyncing(true);
    loadData();
    setTimeout(() => setSyncing(false), 500);
  };

  const handleSaveTargets = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("warung_targets", JSON.stringify({
      daily: targetDaily,
      monthly: targetMonthly
    }));
    // Dispatch storage event to notify other components (like dashboard)
    window.dispatchEvent(new Event("storage"));
    setSaveStatus("Target penjualan berhasil diperbarui!");
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Helper date parsing (aligns with reports/page.tsx parsing)
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

  // Calculations
  const now = new Date();
  const todayDay = now.getDate();
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();
  const totalDaysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
  const remainingDays = Math.max(1, totalDaysInMonth - todayDay);

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const monthLabel = `${monthNames[currentMonthIdx]} ${currentYear}`;

  // Filter transactions for this month
  const monthlyTxs = transactions.filter(tx => {
    if (tx.voided) return false;
    const txDate = parseIndoDate(tx.date);
    return txDate.getMonth() === currentMonthIdx && txDate.getFullYear() === currentYear;
  });

  // Today's Sales
  const todaySales = monthlyTxs
    .filter(tx => parseIndoDate(tx.date).getDate() === todayDay)
    .reduce((sum, tx) => sum + tx.total, 0);

  // Total sales this month
  const monthlySales = monthlyTxs.reduce((sum, tx) => sum + tx.total, 0);

  // Daily target achievements calculation
  const dailySalesMap = new Map<number, number>();
  // Populate sales for each day of this month up to today
  for (let i = 1; i <= todayDay; i++) {
    dailySalesMap.set(i, 0);
  }
  monthlyTxs.forEach(tx => {
    const day = parseIndoDate(tx.date).getDate();
    if (day <= todayDay) {
      dailySalesMap.set(day, (dailySalesMap.get(day) || 0) + tx.total);
    }
  });

  // Calculate Streak
  let streak = 0;
  for (let d = todayDay; d >= 1; d--) {
    const daySales = dailySalesMap.get(d) || 0;
    if (daySales >= targetDaily) {
      streak++;
    } else if (d === todayDay && daySales === 0) {
      // If today has no sales yet, don't break the streak from yesterday immediately
      continue;
    } else {
      break;
    }
  }

  // Target metrics
  const dailyPercent = targetDaily > 0 ? Math.min(100, Math.round((todaySales / targetDaily) * 100)) : 0;
  const monthlyPercent = targetMonthly > 0 ? Math.min(100, Math.round((monthlySales / targetMonthly) * 100)) : 0;

  const remainingMonthlyTarget = Math.max(0, targetMonthly - monthlySales);
  const requiredDailyAverage = remainingMonthlyTarget / remainingDays;
  const actualDailyAverage = todayDay > 0 ? (monthlySales / todayDay) : 0;

  // SVG Radial Gauge Params
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (dailyPercent / 100) * circumference;

  // Performance status indicator
  const isOnTrack = actualDailyAverage >= (targetMonthly / totalDaysInMonth);

  return (
    <div className="space-y-6 max-w-6xl animate-in fade-in duration-700 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Target Penjualan</h1>
          <p className="text-slate-500 text-xs mt-1 font-medium">
            Monitor target omset harian dan bulanan secara visual, kelola pencapaian, serta analisis sisa target periode {monthLabel}.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border bg-white shadow-sm transition-all cursor-pointer",
              syncing
                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                : "border-slate-200 text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
            )}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", syncing && "animate-spin")} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Grid: Overview Visual & Input Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Visual Metrics & Progress Gauges */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Today & Monthly Target Overview */}
          <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <Award className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800">Visualisasi Capaian Target</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Daily Circle Gauge */}
              <div className="flex flex-col items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-200/50">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-4">Omset Hari Ini</span>
                
                <div className="relative w-36 h-36 flex items-center justify-center">
                  {/* Outer circle background */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r={radius}
                      className="stroke-slate-200 fill-none"
                      strokeWidth="10"
                    />
                    <circle
                      cx="72"
                      cy="72"
                      r={radius}
                      className={cn(
                        "fill-none transition-all duration-1000 ease-out",
                        dailyPercent >= 100 ? "stroke-emerald-500" : "stroke-blue-600"
                      )}
                      strokeWidth="10"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  {/* Inside Label */}
                  <div className="absolute text-center">
                    <span className="text-2xl font-black text-slate-800 tracking-tight">{dailyPercent}%</span>
                    <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wide mt-0.5">Tercapai</span>
                  </div>
                </div>

                <div className="mt-4 text-center space-y-1">
                  <p className="text-xs font-bold text-slate-800">
                    {hidden ? "Rp ••••••" : `Rp ${todaySales.toLocaleString("id-ID")}`}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Target: Rp {targetDaily.toLocaleString("id-ID")} / Hari
                  </p>
                </div>
              </div>

              {/* Monthly Progress Tracker */}
              <div className="flex flex-col justify-between h-full p-4 bg-slate-50/50 rounded-2xl border border-slate-200/50">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Target Bulanan ({monthLabel})</span>
                      <h3 className="text-lg font-black text-slate-800 mt-1">
                        {hidden ? "Rp ••••••" : `Rp ${monthlySales.toLocaleString("id-ID")}`}
                      </h3>
                    </div>
                    <span className={cn(
                      "px-2.5 py-0.5 text-[9px] font-extrabold rounded-full border tracking-wide uppercase",
                      monthlyPercent >= 100 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                        : "bg-blue-50 border-blue-200 text-blue-700"
                    )}>
                      {monthlyPercent}%
                    </span>
                  </div>

                  {/* Monthly Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-200/30">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-1000"
                        style={{ width: `${monthlyPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                      <span>Rp 0</span>
                      <span>Target: Rp {targetMonthly.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200/60 pt-3 mt-4 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">Sisa Target:</span>
                  <span className="font-extrabold text-slate-800">
                    {hidden ? "Rp ••••••" : `Rp ${remainingMonthlyTarget.toLocaleString("id-ID")}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Row: Smart Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Streak */}
            <div className="bg-white border border-slate-200/80 rounded-[22px] p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none transform translate-x-4 -translate-y-4" />
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Flame className="w-5 h-5 fill-amber-500/10" />
              </div>
              <div>
                <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider">Target Streak</span>
                <h4 className="text-base font-black text-slate-800 mt-0.5">{streak} Hari</h4>
                <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Beruntun capai target harian.</p>
              </div>
            </div>

            {/* Card 2: Required Daily Avg */}
            <div className="bg-white border border-slate-200/80 rounded-[22px] p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none transform translate-x-4 -translate-y-4" />
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider">Dibutuhkan / Hari</span>
                <h4 className="text-base font-black text-slate-800 mt-0.5">
                  {hidden ? "Rp ••••••" : `Rp ${Math.round(requiredDailyAverage).toLocaleString("id-ID")}`}
                </h4>
                <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Agar target bulanan tercapai.</p>
              </div>
            </div>

            {/* Card 3: Performance Status */}
            <div className="bg-white border border-slate-200/80 rounded-[22px] p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none transform translate-x-4 -translate-y-4" />
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                isOnTrack 
                  ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                  : "bg-amber-50 border-amber-100 text-amber-600"
              )}>
                {isOnTrack ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider">Status Performa</span>
                <h4 className={cn("text-sm font-black mt-0.5", isOnTrack ? "text-emerald-600" : "text-amber-600")}>
                  {isOnTrack ? "ON TRACK (AMAN)" : "BEHIND TARGET"}
                </h4>
                <p className="text-[9px] text-slate-500 font-semibold mt-0.5">
                  Rata-rata: Rp {Math.round(actualDailyAverage).toLocaleString("id-ID")}/hari.
                </p>
              </div>
            </div>
          </div>

          {/* Calendar List: Daily Target Achievements */}
          <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-800">Kalender Pencapaian Harian</h2>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">{monthLabel} (Hari 1 - {todayDay})</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              {Array.from({ length: todayDay }, (_, index) => {
                const dayNum = index + 1;
                const sales = dailySalesMap.get(dayNum) || 0;
                const isMet = sales >= targetDaily;

                return (
                  <div 
                    key={dayNum}
                    className={cn(
                      "p-3 border rounded-xl flex items-center justify-between transition-all duration-200 hover:shadow-sm",
                      isMet 
                        ? "bg-emerald-50/40 border-emerald-200/60 text-emerald-800" 
                        : sales > 0 
                          ? "bg-slate-50/80 border-slate-200 text-slate-700"
                          : "bg-slate-100/40 border-slate-200/60 text-slate-400"
                    )}
                  >
                    <div>
                      <span className="block text-[9.5px] font-bold text-slate-500 leading-none">Hari ke</span>
                      <span className="text-sm font-extrabold block mt-0.5">{dayNum}</span>
                      <span className="text-[8.5px] font-semibold block mt-1">
                        {hidden ? "Rp •••••" : `Rp ${sales.toLocaleString("id-ID")}`}
                      </span>
                    </div>
                    <div className="shrink-0 ml-1">
                      {isMet ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : sales > 0 ? (
                        <XCircle className="w-4 h-4 text-slate-400" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300" />
                      )}
                    </div>
                  </div>
                );
              }).reverse()}
            </div>
          </div>
        </div>

        {/* Right Column: Target Config & Recommendations */}
        <div className="space-y-6">
          {/* Card: Configuration Form */}
          <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-6">
              <Target className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800">Sesuaikan Target</h2>
            </div>

            {saveStatus && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-xs font-bold mb-4 animate-in fade-in duration-200">
                {saveStatus}
              </div>
            )}

            <form onSubmit={handleSaveTargets} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Target Harian (Rp)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={targetDaily}
                  onChange={(e) => setTargetDaily(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                />
                <p className="text-[9px] text-slate-400 font-semibold">Standar omset yang ingin dicapai setiap harinya.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Target Bulanan (Rp)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={targetMonthly}
                  onChange={(e) => setTargetMonthly(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                />
                <p className="text-[9px] text-slate-400 font-semibold">Tujuan penjualan kumulatif untuk bulan berjalan.</p>
              </div>

              <button
                type="submit"
                className="w-full group relative flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 overflow-hidden cursor-pointer"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <Save className="h-4 w-4 animate-pulse" />
                Simpan Target
              </button>
            </form>
          </div>

          {/* Card: Smart Advice / Tips */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-[24px] p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none transform translate-x-8 -translate-y-8" />
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center font-bold text-sm text-blue-200">
                  💡
                </div>
                <h3 className="text-xs font-bold text-blue-200 uppercase tracking-widest">Rekomendasi Toko</h3>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                {isOnTrack 
                  ? "Kerja bagus! Performa rata-rata penjualan Anda saat ini aman untuk menyentuh target bulanan. Pertahankan ketersediaan stok produk terlaris seperti Indomie Goreng dan Minyak Goreng Bimoli."
                  : `Omset rata-rata harian Anda (Rp ${Math.round(actualDailyAverage).toLocaleString("id-ID")}) masih di bawah target yang dibutuhkan (Rp ${Math.round(requiredDailyAverage).toLocaleString("id-ID")}). Cobalah lakukan promosi bundel produk sembako atau tawarkan pembayaran non-tunai QRIS untuk menarik pelanggan baru.`
                }
              </p>

              <div className="border-t border-white/10 pt-4 space-y-2.5 text-[11px] text-slate-400 font-semibold">
                <div className="flex justify-between">
                  <span>Sisa Hari Aktif:</span>
                  <span className="text-white">{remainingDays} hari lagi</span>
                </div>
                <div className="flex justify-between">
                  <span>Hari Capai Target:</span>
                  <span className="text-white">
                    {Array.from(dailySalesMap.values()).filter(val => val >= targetDaily).length} dari {todayDay} hari
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
