"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/sidebar";
import { Menu, Diamond } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isPosPage = pathname === "/pos";
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    const loggedIn = localStorage.getItem("warung_logged_in");
    if (loggedIn !== "true") {
      router.push("/login");
    } else {
      const role = localStorage.getItem("warung_user_role");
      if (role === "Kasir" && pathname !== "/pos" && pathname !== "/debts") {
        router.push("/pos");
      } else {
        setCheckedAuth(true);
      }
    }
  }, [router, pathname]);

  // 2. Initial database pull and localStorage interceptor
  useEffect(() => {
    const loggedIn = localStorage.getItem("warung_logged_in");
    if (loggedIn !== "true") {
      setSyncing(false);
      return;
    }

    if (!checkedAuth) return;

    const syncData = async () => {
      try {
        const res = await fetch("/api/sync/pull");
        if (res.ok) {
          const data = await res.json();
          
          // Disable auto-populate checks in client page useEffect hooks
          localStorage.setItem("warung_sync_active", "true");

          // Save loaded database state into localStorage
          localStorage.setItem("warung_categories", JSON.stringify(data.categories || []));
          localStorage.setItem("warung_products", JSON.stringify(data.products || []));
          localStorage.setItem("warung_shifts", JSON.stringify(data.shifts || []));
          localStorage.setItem("warung_transactions", JSON.stringify(data.transactions || []));
          localStorage.setItem("warung_debts", JSON.stringify(data.debts || []));
          localStorage.setItem("warung_expenses", JSON.stringify(data.expenses || []));
          localStorage.setItem("warung_movements", JSON.stringify(data.movements || []));
        }
      } catch (err) {
        console.error("Gagal melakukan sinkronisasi database:", err);
      } finally {
        setSyncing(false);
      }
    };

    syncData();

    // Intercept localStorage writes to push updates back to database
    const originalSetItem = window.localStorage.setItem;
    window.localStorage.setItem = function (key, value) {
      originalSetItem.apply(this, arguments as any);

      const targetKeys = [
        "warung_categories",
        "warung_products",
        "warung_shifts",
        "warung_transactions",
        "warung_debts",
        "warung_expenses",
        "warung_movements"
      ];

      if (targetKeys.includes(key)) {
        const userName = localStorage.getItem("warung_user_name") || "";
        
        try {
          fetch("/api/sync/push", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              key,
              data: JSON.parse(value),
              userName
            })
          }).catch(err => console.error(`Gagal sync push untuk ${key}:`, err));
        } catch (e) {
          console.error(e);
        }
      }
    };

    return () => {
      window.localStorage.setItem = originalSetItem;
    };
  }, [checkedAuth]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsOpen(!mobile); // Default open on desktop, closed on mobile
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const handleOpenSidebar = () => setIsOpen(true);
    window.addEventListener("open-sidebar", handleOpenSidebar);

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("open-sidebar", handleOpenSidebar);
    };
  }, []);

  if (!checkedAuth || syncing) {
    const statusTitle = !checkedAuth ? "Menyelaraskan Sesi" : "Sinkronisasi Database";
    const statusDesc = !checkedAuth ? "Memverifikasi keamanan data lokal..." : "Menghubungkan data dengan Supabase Cloud...";
    return (
      <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col items-center justify-center gap-4">
        {/* Soft background glow */}
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
        
        {/* Pulsing identity icon */}
        <div className="bg-blue-600 p-4 rounded-2xl shadow-xl shadow-blue-500/20 animate-pulse">
          <Diamond className="w-8 h-8 text-white stroke-[2.5]" />
        </div>
        
        {/* Subtitle / Status */}
        <div className="flex flex-col items-center gap-1.5 mt-2">
          <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">{statusTitle}</h3>
          <p className="text-[10px] text-slate-400 font-medium">{statusDesc}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[40] transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar isOpen={isMobile ? true : isOpen} setIsOpen={setIsOpen} isMobile={isMobile} mobileOpen={isOpen} />

      {/* Main Content Area */}
      <main
        className={cn(
          "flex-1 min-h-screen transition-all duration-300 w-full max-w-full flex flex-col bg-slate-100",
          !isMobile ? (isOpen ? "md:ml-64" : "md:ml-20") : "ml-0"
        )}
      >
        {/* Topbar */}
        {!isPosPage && (
          <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 z-10 sticky top-0">
            <div className="flex items-center gap-3">
              {isMobile && (
                <button
                  onClick={() => setIsOpen(true)}
                  aria-label="Open Menu"
                  className="p-1.5 text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <h2 className="font-bold text-sm md:text-base text-slate-800 leading-none tracking-tight">
                Sistem Kasir &amp; Inventori
              </h2>
            </div>
          </header>
        )}

        {/* Dynamic Route Content */}
        <div className={cn("flex-1 overflow-y-auto", isPosPage ? "p-0" : (isMobile ? "p-4" : "p-6"))}>
          {children}
        </div>
      </main>
    </div>
  );
}
