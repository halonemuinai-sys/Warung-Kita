"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ArrowDownUp,
  BookOpen,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  Diamond,
  Eye,
  EyeOff,
  Target,
  ClipboardCheck,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHideAmounts } from "@/lib/hide-amounts";

const menuGroups = [
  {
    title: "OVERVIEW",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Laporan", href: "/reports", icon: TrendingUp },
      { name: "Target Penjualan", href: "/targets", icon: Target },
    ],
  },
  {
    title: "TRANSAKSI",
    items: [
      { name: "Kasir (POS)", href: "/pos", icon: ShoppingCart, badge: "LIVE", badgeColor: "bg-emerald-500" },
      { name: "Buku Kasbon", href: "/debts", icon: BookOpen },
    ],
  },
  {
    title: "KATALOG & STOK",
    items: [
      { name: "Produk", href: "/products", icon: Package },
      { name: "Inventori & Stok", href: "/inventory", icon: ArrowDownUp },
      { name: "Stock Opname", href: "/stock-opname", icon: ClipboardCheck },
    ],
  },
  {
    title: "SISTEM",
    items: [
      { name: "Pengaturan", href: "/settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  isMobile?: boolean;
  mobileOpen?: boolean;
}

export default function Sidebar({ isOpen, setIsOpen, isMobile, mobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const { hidden, toggle } = useHideAmounts();
  const isActuallyOpen = isMobile ? true : isOpen;

  const [userName, setUserName] = useState("Admin Utama");
  const [userRole, setUserRole] = useState("Owner");

  useEffect(() => {
    const savedName = localStorage.getItem("warung_user_name");
    const savedRole = localStorage.getItem("warung_user_role");
    if (savedName) setUserName(savedName);
    if (savedRole) setUserRole(savedRole);
  }, []);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem("warung_logged_in");
    localStorage.removeItem("warung_user_name");
    localStorage.removeItem("warung_user_role");
    window.location.href = "/login";
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-white border-r border-slate-200 flex flex-col z-[50] shadow-2xl transition-all duration-300",
        isMobile ? (mobileOpen ? "translate-x-0 w-[280px]" : "-translate-x-full w-[280px]") : "translate-x-0",
        !isMobile && (isOpen ? "w-64" : "w-20")
      )}
    >
      {/* Brand Header */}
      <div className={cn("p-5 border-b border-slate-100 flex items-center relative", isActuallyOpen ? "justify-between" : "justify-center px-0")}>
        <div className={cn("flex items-center gap-3", !isActuallyOpen && "hidden")}>
          <div className="bg-blue-600 p-2 rounded-xl shrink-0 shadow-md shadow-blue-500/20">
            <Diamond className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-none text-slate-950">Warung Kita</h1>
            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-1 block">POS &amp; Inventory</span>
          </div>
        </div>

        {!isActuallyOpen && (
          <div className="bg-blue-600 p-2 rounded-xl shrink-0 shadow-md shadow-blue-500/20 mb-4 mt-2">
            <Diamond className="h-5 w-5 text-white" />
          </div>
        )}

        {/* Floating Sidebar Toggle Button (Desktop Only) */}
        {!isMobile && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute -right-3.5 top-6 bg-white border border-slate-200 rounded-full p-1.5 shadow-md hover:bg-slate-50 text-slate-500 hover:text-blue-600 transition-colors z-50 cursor-pointer"
          >
            {isOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto custom-scrollbar">
        {menuGroups.map(group => {
          const filteredItems = group.items.filter(item => {
            if (userRole === "Kasir") {
              return item.href === "/pos" || item.href === "/debts";
            }
            return true;
          });
          return { ...group, items: filteredItems };
        }).filter(group => group.items.length > 0).map((group) => (
          <div key={group.title} className="space-y-1">
            {isActuallyOpen ? (
              <p className="px-4 text-[9px] font-bold text-slate-400 mb-2 tracking-[0.15em] uppercase">
                {group.title}
              </p>
            ) : (
              <div className="w-8 border-t border-slate-200 mx-auto mb-3 mt-4" />
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      if (isMobile) setIsOpen(false);
                    }}
                    title={!isActuallyOpen ? item.name : undefined}
                    className={cn(
                      "flex items-center transition-all duration-200 group relative border border-transparent",
                      isActuallyOpen ? "justify-between px-4 py-2.5 rounded-xl" : "justify-center p-3 rounded-xl mx-2",
                      isActive
                        ? "bg-blue-50 text-blue-700 border-blue-100 shadow-sm"
                        : "text-slate-600 hover:text-rose-600 hover:bg-rose-50/60 hover:border-rose-100/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          "h-5 w-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6",
                          isActive ? "text-blue-600" : "text-slate-400 group-hover:text-rose-500"
                        )}
                      />
                      {isActuallyOpen && <span className="text-sm font-semibold tracking-tight">{item.name}</span>}
                    </div>
                    {isActuallyOpen && item.badge && !isActive && (
                      <span className={cn(
                        "text-[8px] font-black px-1.5 py-0.5 rounded-full text-white shrink-0 animate-pulse shadow-lg",
                        item.badgeColor
                      )}>
                        {item.badge}
                      </span>
                    )}
                    {isActuallyOpen && isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-400 opacity-60" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Info */}
      <div className={cn("border-t border-slate-200 bg-slate-50 space-y-3", isActuallyOpen ? "p-4" : "p-3 flex flex-col items-center")}>
        {/* Hide Amounts Toggle Button */}
        <button
          type="button"
          onClick={toggle}
          title={isActuallyOpen ? undefined : (hidden ? "Tampilkan Angka" : "Sembunyikan Angka")}
          className={cn(
            "flex items-center justify-center transition-all border cursor-pointer",
            isActuallyOpen ? "w-full gap-2 px-3 py-2 rounded-xl text-xs font-bold" : "w-10 h-10 rounded-xl",
            hidden
              ? "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
              : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"
          )}
        >
          {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {isActuallyOpen && (hidden ? "Angka Tersembunyi" : "Sembunyikan Angka")}
        </button>

        {/* User Card */}
        <div 
          onClick={!isActuallyOpen ? handleLogout : undefined}
          title={!isActuallyOpen ? "Keluar (Logout)" : undefined}
          className={cn(
            "flex items-center justify-between w-full p-2 rounded-xl bg-white border border-slate-200 transition-all duration-200", 
            !isActuallyOpen ? "justify-center p-1.5 cursor-pointer hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600" : "p-2"
          )}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-500/10 shrink-0">
              {getInitials(userName)}
            </div>
            {isActuallyOpen && (
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 truncate leading-none" title={userName}>{userName}</p>
                <p className="text-[9px] text-blue-600 font-black uppercase tracking-wider mt-1">{userRole}</p>
              </div>
            )}
          </div>
          {isActuallyOpen && (
            <button
              onClick={handleLogout}
              title="Keluar (Logout)"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors duration-200 cursor-pointer active:scale-90 shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
        {isActuallyOpen && (
          <p className="text-[9px] text-slate-400 text-center leading-relaxed">
            &copy; 2026 Warung Kita.<br />
            <span className="text-slate-400">Created By Aris Setiyono.</span>
          </p>
        )}
      </div>
    </aside>
  );
}
