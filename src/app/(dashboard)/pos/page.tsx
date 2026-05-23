"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Menu,
  Calendar,
  User,
  Plus, 
  Minus, 
  X,
  ShoppingCart, 
  CreditCard, 
  QrCode,
  Banknote,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle2,
  RotateCcw,
  ScanLine,
  Utensils,
  CupSoda,
  Sparkles,
  Package,
  Diamond,
  Lock,
  ShoppingBag
} from "lucide-react";
import { useHideAmounts } from "@/lib/hide-amounts";
import { cn } from "@/lib/utils";
import { initialProducts, initialCategories } from "@/lib/initial-products";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

const getCategoryIcon = (category: string) => {
  const iconClass = "w-6 h-6 text-slate-400 stroke-[1.5] group-hover:text-blue-500 transition-colors duration-200";
  switch (category) {
    case "Makanan":
      return <Utensils className={iconClass} />;
    case "Minuman":
      return <CupSoda className={iconClass} />;
    case "Sembako":
      return <ShoppingBag className={iconClass} />;
    case "Kebersihan":
      return <Sparkles className={iconClass} />;
    default:
      return <Package className={iconClass} />;
  }
};

const getProductStock = (product: any, allProducts: any[]) => {
  if (!product) return 0;
  if (!product.isProcessed) return product.stock;
  if (!product.recipe || product.recipe.length === 0) return product.stock || 0;
  
  let minStock = Infinity;
  for (const ingredient of product.recipe) {
    const ingProduct = allProducts.find(p => p.id === ingredient.productId);
    if (!ingProduct) {
      minStock = 0;
      break;
    }
    const possibleServings = Math.floor(ingProduct.stock / ingredient.quantity);
    if (possibleServings < minStock) {
      minStock = possibleServings;
    }
  }
  return minStock === Infinity ? 0 : minStock;
};

export default function POSPage() {
  const { hidden } = useHideAmounts();
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS" | "DEBT" | "CARD">("CASH");
  
  // Cash calculations states
  const [cashReceived, setCashReceived] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  // Discount states
  const [discountValue, setDiscountValue] = useState<string>("0");
  const [discountType, setDiscountType] = useState<"NOMINAL" | "PERCENT">("NOMINAL");
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [tempDiscountValue, setTempDiscountValue] = useState("");
  const [tempDiscountType, setTempDiscountType] = useState<"NOMINAL" | "PERCENT">("NOMINAL");

  // Draft state
  const [hasDraft, setHasDraft] = useState(false);

  // Clock state & Hydration mounting check
  const [time, setTime] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [userName, setUserName] = useState("Kasir Utama");
  const [userRole, setUserRole] = useState("Kasir");

  // Shift Management States
  const [activeShift, setActiveShift] = useState<any>(null);
  const [isOpeningShift, setIsOpeningShift] = useState(false);
  const [isClosingShift, setIsClosingShift] = useState(false);
  const [openShiftCashier, setOpenShiftCashier] = useState("");
  const [openShiftInitialCash, setOpenShiftInitialCash] = useState<number>(200000);
  const [closeShiftActualCash, setCloseShiftActualCash] = useState<string>("");

  useEffect(() => {
    setIsMounted(true);
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);

    // Initial draft check
    const savedDraft = localStorage.getItem("warung_pos_draft");
    setHasDraft(!!savedDraft);

    const savedName = localStorage.getItem("warung_user_name");
    const savedRole = localStorage.getItem("warung_user_role");
    if (savedName) {
      setUserName(savedName);
      setOpenShiftCashier(savedName);
    }
    if (savedRole) setUserRole(savedRole);

    const savedShift = localStorage.getItem("warung_active_shift");
    if (savedShift) {
      try {
        setActiveShift(JSON.parse(savedShift));
      } catch (e) {
        console.error(e);
      }
    }

    return () => {
      clearInterval(timer);
    };
  }, []);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleOpenShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const now = new Date();
    const formattedDate = now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }) + " " + now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    const newShift = {
      id: `SHIFT-${Date.now()}`,
      cashierName: openShiftCashier || userName || "Kasir Utama",
      openTime: formattedDate,
      closeTime: null,
      initialCash: openShiftInitialCash,
      cashSales: 0,
      nonCashSales: 0,
      debtSales: 0,
      expectedCash: openShiftInitialCash,
      actualCash: 0,
      discrepancy: 0,
      status: "OPEN" as const
    };

    localStorage.setItem("warung_active_shift", JSON.stringify(newShift));
    
    const savedShifts = localStorage.getItem("warung_shifts");
    let currentShifts = [];
    if (savedShifts) {
      try {
        currentShifts = JSON.parse(savedShifts);
      } catch (e) {
        console.error(e);
      }
    }
    localStorage.setItem("warung_shifts", JSON.stringify([newShift, ...currentShifts]));

    setActiveShift(newShift);
    setIsOpeningShift(false);
  };

  const handleCloseShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    const actual = parseFloat(closeShiftActualCash) || 0;
    const expected = activeShift.expectedCash;
    const discrepancy = actual - expected;

    const now = new Date();
    const formattedDate = now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }) + " " + now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    const closedShift = {
      ...activeShift,
      closeTime: formattedDate,
      actualCash: actual,
      discrepancy: discrepancy,
      status: "CLOSED" as const
    };

    const savedShifts = localStorage.getItem("warung_shifts");
    let currentShifts = [];
    if (savedShifts) {
      try {
        currentShifts = JSON.parse(savedShifts);
      } catch (e) {
        console.error(e);
      }
    }
    const updatedShifts = currentShifts.map((s: any) => s.id === activeShift.id ? closedShift : s);
    localStorage.setItem("warung_shifts", JSON.stringify(updatedShifts));

    localStorage.removeItem("warung_active_shift");
    
    setActiveShift(null);
    setIsClosingShift(false);
    setCart([]);
    setCashReceived("");
    setCustomerName("");
  };

  useEffect(() => {
    // Load products and trigger database upgrade if necessary
    const savedProducts = localStorage.getItem("warung_products");
    if (savedProducts) {
      try {
        let parsed = JSON.parse(savedProducts);
        const hasMieSedaap = parsed.some((p: any) => p.name === "Mie Sedaap Goreng");
        
        // Upgrade database to 55 products if length is under 55 or missing "Mie Sedaap Goreng"
        if (parsed.length < 55 || !hasMieSedaap) {
          const defaultIds = new Set(initialProducts.map(ip => ip.id));
          const customProducts = parsed.filter((p: any) => !defaultIds.has(p.id));
          parsed = [...initialProducts, ...customProducts];
          localStorage.setItem("warung_products", JSON.stringify(parsed));
        } else {
          let updated = false;
          parsed = parsed.map((p: any) => {
            const defaultProd = initialProducts.find(ip => ip.id === p.id);
            if (defaultProd && (!p.imageUrl || p.imageUrl === null)) {
              updated = true;
              return { ...p, imageUrl: defaultProd.imageUrl };
            }
            return p;
          });
          if (updated) {
            localStorage.setItem("warung_products", JSON.stringify(parsed));
          }
        }
        setProducts(parsed);
      } catch (e) {
        console.error(e);
      }
    } else {
      localStorage.setItem("warung_products", JSON.stringify(initialProducts));
      setProducts(initialProducts);
    }

    // Load categories
    const savedCats = localStorage.getItem("warung_categories");
    if (savedCats) {
      try {
        let parsed = JSON.parse(savedCats);
        let updated = false;
        parsed = parsed.map((cat: any) => {
          let color = cat.color || "from-blue-500 to-blue-700";
          if (/purple|pink|indigo|violet|fuchsia/i.test(color)) {
            updated = true;
            let cleanColor = color
              .replace(/purple/g, "sky")
              .replace(/pink/g, "blue")
              .replace(/indigo/g, "blue")
              .replace(/violet/g, "blue")
              .replace(/fuchsia/g, "teal");
            return { ...cat, color: cleanColor };
          }
          return cat;
        });
        if (updated) {
          localStorage.setItem("warung_categories", JSON.stringify(parsed));
        }
        setCategoriesList([{ name: "Semua" }, { name: "🍳 Olahan Dapur" }, ...parsed]);
      } catch (e) {
        console.error(e);
      }
    } else {
      setCategoriesList([{ name: "Semua" }, { name: "🍳 Olahan Dapur" }, ...initialCategories]);
    }
  }, []);

  // Global Keyboard Shortcuts Effect
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if the user is typing in standard inputs, but function keys are allowed
      const activeElement = document.activeElement;
      const isInputOrTextArea = activeElement && (
        activeElement.tagName === "INPUT" || 
        activeElement.tagName === "TEXTAREA" || 
        activeElement.getAttribute("contenteditable") === "true"
      );

      // Prevent default F-key behaviors inside the POS app to handle them customly
      if (e.key === "F1") {
        e.preventDefault();
        setSelectedCategory("Semua");
      }

      if (e.key === "F2") {
        e.preventDefault();
        setSelectedCategory("🍳 Olahan Dapur");
      }

      if (e.key === "F3") {
        e.preventDefault();
        const searchInput = document.querySelector("input[placeholder*='Cari nama barang']") as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }

      if (e.key === "F4") {
        e.preventDefault();
        setPaymentMethod((prev) => {
          if (prev === "CASH") return "QRIS";
          if (prev === "QRIS") return "CARD";
          return "CASH";
        });
      }

      if (e.key === "F9") {
        e.preventDefault();
        const payBtn = document.getElementById("proses-pembayaran-btn") as HTMLButtonElement;
        if (payBtn && !payBtn.disabled) {
          payBtn.click();
        }
      }

      if (e.key === "Escape") {
        // If search input is focused, blur it. Otherwise, clear query.
        const searchInput = document.querySelector("input[placeholder*='Cari nama barang']") as HTMLInputElement;
        if (document.activeElement === searchInput) {
          e.preventDefault();
          searchInput.blur();
        } else if (searchQuery) {
          e.preventDefault();
          setSearchQuery("");
        } else if (selectedCategory !== "Semua") {
          e.preventDefault();
          setSelectedCategory("Semua");
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [searchQuery, selectedCategory]);



  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Reset pagination when search query or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    
    let matchesCategory = false;
    if (selectedCategory === "Semua") {
      matchesCategory = true;
    } else if (selectedCategory === "🍳 Olahan Dapur") {
      matchesCategory = !!product.isProcessed || product.category === "Siap Saji" || product.category === "🍳 Olahan Dapur";
    } else {
      matchesCategory = product.category === selectedCategory;
    }
    
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getPageNumbers = () => {
    const list = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) list.push(i);
    } else {
      if (currentPage <= 3) {
        list.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        list.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        list.push(1, "...", currentPage, "...", totalPages);
      }
    }
    return list;
  };

  const addToCart = (product: any) => {
    let success = true;
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      const maxStock = getProductStock(product, products);
      if (existing) {
        if (existing.quantity >= maxStock) {
          alert(`Stok tidak mencukupi. Sisa stok: ${maxStock}`);
          success = false;
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        if (maxStock <= 0) {
          alert("Stok habis!");
          success = false;
          return prevCart;
        }
        return [...prevCart, { id: product.id, name: product.name, price: product.sellPrice, quantity: 1, category: product.category }];
      }
    });
    return success;
  };

  // Play synthesizer beep sound using Web Audio API
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
      oscillator.frequency.setValueAtTime(1300, audioCtx.currentTime); // High pitch beep (1300Hz)
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);

      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      oscillator.stop(audioCtx.currentTime + 0.08);
    } catch (error) {
      console.warn("Failed to play scanner beep:", error);
    }
  };

  // Keyboard Enter keypress / Scanner suffix handler
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const query = searchQuery.trim();
      if (!query) return;

      // First check if there's an exact SKU match
      const exactMatch = products.find(
        (p) => p.sku && p.sku.toLowerCase() === query.toLowerCase()
      );

      if (exactMatch) {
        const added = addToCart(exactMatch);
        if (added) {
          playScannerBeep();
        }
        setSearchQuery("");
        return;
      }

      // If no exact match, but filtered is exactly 1 item
      if (filteredProducts.length === 1) {
        const added = addToCart(filteredProducts[0]);
        if (added) {
          playScannerBeep();
        }
        setSearchQuery("");
      }
    }
  };

  // Smart Scanner Auto-Add Effect
  useEffect(() => {
    if (!searchQuery) return;

    const query = searchQuery.trim();
    // Check if query is an exact match for any product SKU
    const matchedProduct = products.find(
      (p) => p.sku && p.sku.toLowerCase() === query.toLowerCase()
    );

    if (matchedProduct) {
      const added = addToCart(matchedProduct);
      if (added) {
        playScannerBeep();
      }
      setSearchQuery("");
    }
  }, [searchQuery, products]);

  const decreaseQty = (id: string) => {
    const existing = cart.find((item) => item.id === id);
    if (existing && existing.quantity > 1) {
      setCart(cart.map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item)));
    } else {
      removeFromCart(id);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  // Draft handlers
  const saveDraft = () => {
    if (cart.length === 0) return;
    localStorage.setItem("warung_pos_draft", JSON.stringify(cart));
    setHasDraft(true);
    setCart([]);
    alert("Keranjang berhasil disimpan sebagai Draft!");
  };

  const loadDraft = () => {
    const savedDraft = localStorage.getItem("warung_pos_draft");
    if (savedDraft) {
      try {
        setCart(JSON.parse(savedDraft));
        localStorage.removeItem("warung_pos_draft");
        setHasDraft(false);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Calculations
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Discount calculation
  const parsedDiscountVal = parseFloat(discountValue) || 0;
  const discountAmount = discountType === "PERCENT"
    ? Math.floor((totalAmount * parsedDiscountVal) / 100)
    : parsedDiscountVal;
  const finalTotalAmount = Math.max(0, totalAmount - discountAmount);

  // Cash payment change calculation
  const numericCashReceived = parseFloat(cashReceived) || 0;
  const changeAmount = numericCashReceived - finalTotalAmount;

  const handleQuickCash = (amount: number) => {
    if (amount === 0) {
      setCashReceived(finalTotalAmount.toString());
    } else {
      setCashReceived(amount.toString());
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    if (!activeShift) {
      alert("Shift belum dibuka! Harap buka shift kasir terlebih dahulu.");
      return;
    }

    if (paymentMethod === "CASH" && numericCashReceived < finalTotalAmount) {
      alert("Pembayaran tunai kurang!");
      return;
    }

    if (paymentMethod === "DEBT" && !customerName.trim()) {
      alert("Harap masukkan nama pelanggan untuk pembayaran Kasbon.");
      return;
    }

    // Build a map of product ID to quantity to deduct
    const deductions: { [id: string]: number } = {};

    for (const item of cart) {
      const prod = products.find(p => p.id === item.id);
      if (!prod) continue;

      if (prod.isProcessed && prod.recipe && prod.recipe.length > 0) {
        // Deduct recipe ingredients
        for (const ingredient of prod.recipe) {
          const ingId = ingredient.productId;
          const ingQty = ingredient.quantity * item.quantity;
          deductions[ingId] = (deductions[ingId] || 0) + ingQty;
        }
      } else {
        // Deduct product itself (normal or processed with no recipe)
        deductions[prod.id] = (deductions[prod.id] || 0) + item.quantity;
      }
    }

    // Check if the accumulated deductions exceed available stocks
    for (const [id, qtyToDeduct] of Object.entries(deductions)) {
      const prod = products.find(p => p.id === id);
      if (prod) {
        const availableStock = prod.stock;
        if (availableStock < qtyToDeduct) {
          alert(`Stok bahan baku/produk "${prod.name}" tidak mencukupi. Dibutuhkan: ${qtyToDeduct}, Tersedia: ${availableStock}`);
          return;
        }
      }
    }

    // Deduct stock
    const updatedProducts = products.map((p) => {
      const qtyToDeduct = deductions[p.id] || 0;
      if (qtyToDeduct > 0) {
        return {
          ...p,
          stock: Math.max(0, p.stock - qtyToDeduct)
        };
      }
      return p;
    });

    setProducts(updatedProducts);
    localStorage.setItem("warung_products", JSON.stringify(updatedProducts));

    // Save stock movements
    const savedMovements = localStorage.getItem("warung_movements");
    let currentMovements = [];
    if (savedMovements) {
      try {
        currentMovements = JSON.parse(savedMovements);
      } catch (e) {
        console.error(e);
      }
    } else {
      currentMovements = [
        { id: "MVT-4001", date: "2026-05-22 14:30", product: "Minyak Goreng Bimoli 1L", type: "IN", quantity: 24, description: "Restock Kulakan Agen" },
        { id: "MVT-4002", date: "2026-05-22 12:15", product: "Aqua Botol 600ml", type: "OUT", quantity: 3, description: "Rusak / Bocor" },
        { id: "MVT-4003", date: "2026-05-22 10:00", product: "Beras Raja Lele 5kg", type: "IN", quantity: 10, description: "Barang Masuk Agen" },
        { id: "MVT-4004", date: "2026-05-21 16:45", product: "Indomie Goreng", type: "ADJUST", quantity: -2, description: "Opname Stok Selisih" },
      ];
    }

    const mvtDate = new Date().toLocaleDateString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }) + " " + new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    const newMovements: any[] = [];
    const txId = `TX-${Math.floor(9000 + Math.random() * 1000)}`;

    cart.forEach((item, idx) => {
      // 1. Movement for the sold item itself
      newMovements.push({
        id: `MVT-${Math.floor(5000 + Math.random() * 1000) + idx * 10}`,
        date: mvtDate,
        product: item.name,
        type: "OUT" as const,
        quantity: -item.quantity,
        description: `Penjualan Kasir (${paymentMethod === "CASH" ? "Tunai" : paymentMethod === "QRIS" ? "QRIS" : paymentMethod === "CARD" ? "Kartu Bank" : "Kasbon"})` + (paymentMethod === "DEBT" ? ` - Kasbon: ${customerName}` : "")
      });

      // 2. Movements for ingredients (if processed)
      const prod = products.find(p => p.id === item.id);
      if (prod && prod.isProcessed && prod.recipe && prod.recipe.length > 0) {
        prod.recipe.forEach((ingredient: any, ingIdx: number) => {
          const ingProd = products.find(p => p.id === ingredient.productId);
          const ingName = ingProd ? ingProd.name : `Bahan ID ${ingredient.productId}`;
          newMovements.push({
            id: `MVT-${Math.floor(5000 + Math.random() * 1000) + idx * 10 + ingIdx + 1}`,
            date: mvtDate,
            product: ingName,
            type: "OUT" as const,
            quantity: -(ingredient.quantity * item.quantity),
            description: `Bahan baku untuk ${item.name} (${txId})`
          });
        });
      }
    });

    localStorage.setItem("warung_movements", JSON.stringify([...newMovements, ...currentMovements]));

    // Profit and Cost Calculations
    let totalCost = 0;
    const itemsDescription = cart.map(item => {
      const prod = products.find(p => p.id === item.id);
      const cost = prod ? Number(prod.costPrice) : 0;
      totalCost += cost * item.quantity;
      return `${item.name} (${item.quantity}x)`;
    }).join(", ");

    const profit = finalTotalAmount - totalCost;

    const formattedDate = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }) + " " + new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    const newTx = {
      id: txId,
      date: formattedDate,
      items: itemsDescription,
      itemsList: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category
      })),
      total: finalTotalAmount,
      cost: totalCost,
      profit: profit,
      method: paymentMethod === "CASH" ? "Tunai" : paymentMethod === "QRIS" ? "QRIS" : paymentMethod === "CARD" ? "Kartu" : "Kasbon",
      customer: paymentMethod === "DEBT" ? customerName : "Umum",
      shiftId: activeShift.id,
      voided: false
    };

    const savedTxs = localStorage.getItem("warung_transactions");
    let currentTxs = [];
    if (savedTxs) {
      try {
        currentTxs = JSON.parse(savedTxs);
      } catch (e) {
        console.error(e);
      }
    }
    const updatedTxs = [newTx, ...currentTxs];
    localStorage.setItem("warung_transactions", JSON.stringify(updatedTxs));

    // Update active shift stats
    const updatedShift = {
      ...activeShift,
      cashSales: activeShift.cashSales + (paymentMethod === "CASH" ? finalTotalAmount : 0),
      nonCashSales: activeShift.nonCashSales + (paymentMethod === "QRIS" || paymentMethod === "CARD" ? finalTotalAmount : 0),
      debtSales: activeShift.debtSales + (paymentMethod === "DEBT" ? finalTotalAmount : 0),
      expectedCash: activeShift.expectedCash + (paymentMethod === "CASH" ? finalTotalAmount : 0),
    };
    
    localStorage.setItem("warung_active_shift", JSON.stringify(updatedShift));
    setActiveShift(updatedShift);

    const savedShifts = localStorage.getItem("warung_shifts");
    let currentShifts = [];
    if (savedShifts) {
      try {
        currentShifts = JSON.parse(savedShifts);
      } catch (e) {
        console.error(e);
      }
    }
    const updatedShifts = currentShifts.map((s: any) => s.id === updatedShift.id ? updatedShift : s);
    localStorage.setItem("warung_shifts", JSON.stringify(updatedShifts));

    // Handle debt ledger if Kasbon
    if (paymentMethod === "DEBT") {
      const savedDebts = localStorage.getItem("warung_debts");
      let currentDebts = [];
      if (savedDebts) {
        try {
          currentDebts = JSON.parse(savedDebts);
        } catch (e) {
          console.error(e);
        }
      } else {
        currentDebts = [
          { id: "1", name: "Bu Joko", phone: "08123456789", totalDebt: 120000, remaining: 50000, status: "PARTIAL", lastPayment: "2026-05-20" },
          { id: "2", name: "Pak RT Slamet", phone: "08987654321", totalDebt: 156000, remaining: 156000, status: "UNPAID", lastPayment: "-" },
          { id: "3", name: "Mbak Sri", phone: "08561122334", totalDebt: 45000, remaining: 0, status: "PAID", lastPayment: "2026-05-22" },
          { id: "4", name: "Mas Doni", phone: "08778899001", totalDebt: 85000, remaining: 35000, status: "PARTIAL", lastPayment: "2026-05-18" },
        ];
      }

      const existingDebtIdx = currentDebts.findIndex((d: any) => d.name.toLowerCase() === customerName.toLowerCase());
      const todayString = new Date().toLocaleDateString("id-ID", { year: "numeric", month: "2-digit", day: "2-digit" });

      if (existingDebtIdx > -1) {
        const d = currentDebts[existingDebtIdx];
        currentDebts[existingDebtIdx] = {
          ...d,
          totalDebt: d.totalDebt + finalTotalAmount,
          remaining: d.remaining + finalTotalAmount,
          status: "UNPAID",
          lastPayment: todayString
        };
      } else {
        const newDebt = {
          id: String(currentDebts.length + 1),
          name: customerName,
          phone: "",
          totalDebt: finalTotalAmount,
          remaining: finalTotalAmount,
          status: "UNPAID",
          lastPayment: todayString
        };
        currentDebts.push(newDebt);
      }
      localStorage.setItem("warung_debts", JSON.stringify(currentDebts));
    }

    const tx = {
      invoiceNumber: newTx.id,
      items: [...cart],
      subtotal: totalAmount,
      discount: discountAmount,
      total: finalTotalAmount,
      method: newTx.method,
      customer: newTx.customer,
      cashReceived: paymentMethod === "CASH" ? numericCashReceived : null,
      change: paymentMethod === "CASH" ? changeAmount : null,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    // Dispatch storage update
    window.dispatchEvent(new Event("storage"));

    setLastTransaction(tx);
    setShowReceipt(true);
    setCart([]);
    setCustomerName("");
    setCashReceived("");
    setDiscountValue("0");
    setDiscountType("NOMINAL");
  };

  // Clock formatters
  const formatDateString = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const formatTimeString = (date: Date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).replace(/\./g, ":");
  };

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] text-slate-800 overflow-hidden relative">
      
      {/* Clean POS Header */}
      <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 z-10">
        
        {/* Left Brand Details */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-sidebar"))}
            aria-label="Open Menu"
            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer block md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col">
            <h1 className="font-bold text-slate-900 text-sm tracking-tight">Point of Sale</h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Transaksi Baru</p>
          </div>
        </div>

        {/* Center Search Input */}
        <div className="relative w-full max-w-md group mx-4 hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-700 transition-colors" />
          <input
            type="text"
            placeholder="Cari nama barang atau barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full bg-slate-50 border border-slate-200/60 focus:border-slate-400 focus:bg-white rounded-lg py-1.5 pl-9 pr-22 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all duration-200 font-medium"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-auto">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50 transition-all cursor-pointer mr-0.5"
                title="Clear Search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <span className="text-[9px] bg-slate-200/80 text-slate-500 px-1 py-0.2 rounded font-mono font-bold leading-none select-none" title="Pintasan keyboard F3">
              F3
            </span>
            <div className="flex items-center gap-1 select-none cursor-help" title="Scanner Pintar Aktif">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <ScanLine className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Right Widgets */}
        <div className="flex items-center gap-4">
          
          {/* Clock Widget */}
          {isMounted && time && (
            <div className="hidden lg:flex items-center gap-2 text-slate-500 text-[11px] font-medium font-mono select-none bg-slate-50/60 px-3 py-1.5 rounded-lg border border-slate-100 animate-in fade-in duration-550">
              <span>{formatDateString(time)}</span>
              <span className="text-slate-300 font-light">|</span>
              <span className="font-bold text-slate-700">{formatTimeString(time)}</span>
            </div>
          )}

          {/* Active Shift Indicator & Close Button */}
          {activeShift && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1 text-rose-700 animate-in fade-in slide-in-from-right-3 duration-300">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span className="hidden sm:inline text-[9.5px] font-extrabold uppercase tracking-wider">Shift Aktif</span>
              <button
                onClick={() => {
                  setCloseShiftActualCash("");
                  setIsClosingShift(true);
                }}
                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-bold rounded cursor-pointer transition-all active:scale-95 shrink-0"
              >
                Tutup Shift
              </button>
            </div>
          )}

          {/* Profile User avatar */}
          <div className="flex items-center gap-2.5 pl-3.5 border-l border-slate-200/60">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0 select-none" title={userName}>
              {getInitials(userName)}
            </div>
            <div className="hidden md:flex flex-col text-left justify-center">
              <span className="font-bold text-slate-800 text-xs leading-none" title={userName}>{userName}</span>
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mt-1 block">
                {userRole === "Owner" ? "Owner / Admin" : "Staff Kasir"}
              </span>
            </div>
          </div>

        </div>

      </header>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Product Grid Area */}
        <div className="flex-1 flex flex-col p-5 overflow-hidden min-w-0">
          
          {/* Mobile search bar */}
          <div className="relative w-full group mb-3 block sm:hidden">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama barang atau barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-18 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500/10 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all cursor-pointer mr-0.5"
                  title="Clear Search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <div className="flex items-center gap-1 select-none">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <ScanLine className="h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Clean Category Selector Pills */}
          <div className="flex items-center gap-2 pb-4 shrink-0 overflow-x-auto select-none no-scrollbar">
            {categoriesList.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              const isOlahanDapur = cat.name === "🍳 Olahan Dapur";
              
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer active:scale-95 border flex items-center gap-1.5",
                    isOlahanDapur
                      ? isSelected
                        ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm border-transparent"
                        : "bg-amber-50 hover:bg-amber-100/80 text-amber-800 border-amber-200/50 hover:border-amber-300"
                      : isSelected
                        ? "bg-blue-600 text-white shadow-sm border-transparent"
                        : "bg-slate-100 hover:bg-slate-200/60 text-slate-600 hover:text-slate-800 border-transparent"
                  )}
                >
                  {cat.name}
                  {cat.name === "Semua" && (
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded font-mono font-bold leading-none transition-colors",
                      isSelected ? "bg-blue-700/60 text-blue-100" : "bg-slate-200 text-slate-500"
                    )}>
                      F1
                    </span>
                  )}
                  {isOlahanDapur && (
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded font-mono font-bold leading-none transition-colors",
                      isSelected ? "bg-amber-700/60 text-amber-100" : "bg-amber-200/80 text-amber-700"
                    )}>
                      F2
                    </span>
                  )}
                </button>
              );
            })}
            <button
              className="bg-slate-100 hover:bg-slate-200/60 rounded-full w-8 h-8 flex items-center justify-center font-bold text-slate-500 transition-colors shrink-0 cursor-pointer text-xs"
              title="Kategori Lainnya"
            >
              ...
            </button>
          </div>

          {/* Product Grid Area */}
          <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pr-1 mb-3.5 custom-scrollbar">
            
            {paginatedProducts.map((p) => {
              const currentStock = getProductStock(p, products);
              const isOutOfStock = currentStock <= 0;
              const isLowStock = currentStock > 0 && currentStock <= 10;
              
              const badgeStyle = isOutOfStock
                ? "bg-rose-50 text-rose-600"
                : isLowStock
                  ? "bg-amber-50 text-amber-600"
                  : "bg-slate-100/70 text-slate-500";

              return (
                <button
                  key={p.id}
                  onClick={() => !isOutOfStock && addToCart(p)}
                  disabled={isOutOfStock}
                  className={cn(
                    "group relative bg-white border border-slate-200/60 rounded-xl text-left flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:border-slate-300 hover:-translate-y-1 active:scale-[0.98] cursor-pointer overflow-hidden p-0 h-[245px]",
                    isOutOfStock && "opacity-55 grayscale cursor-not-allowed border-slate-200 shadow-none hover:shadow-none hover:border-slate-200 hover:-translate-y-0"
                  )}
                >
                  {/* Stock tag - minimal */}
                  <span className={cn(
                    "absolute top-2.5 right-2.5 text-[8.5px] font-bold px-2 py-0.5 rounded shadow-2xs z-10",
                    badgeStyle
                  )}>
                    {isOutOfStock ? "Habis" : `${currentStock} Pcs`}
                  </span>

                  {/* Clean Product Image Container - flush to top */}
                  <div className="w-full h-[120px] bg-slate-50/60 flex items-center justify-center shrink-0 relative overflow-hidden border-b border-slate-100/50 select-none">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="max-w-full max-h-full object-contain p-2 transform group-hover:scale-104 transition-transform duration-350"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-50/40">
                        {getCategoryIcon(p.category)}
                      </div>
                    )}
                  </div>

                  {/* Card Info Details */}
                  <div className="p-3 flex-1 flex flex-col justify-between w-full">
                    <div>
                      <div className="h-8 flex items-start overflow-hidden">
                        <h4 className="font-semibold text-slate-800 text-[11px] leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                          {p.name}
                        </h4>
                      </div>
                      <p className="text-[8.5px] text-slate-400 font-mono mt-1 leading-none font-medium">{p.sku || "-"}</p>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold text-slate-900 text-xs sm:text-[13px] tracking-tight">
                        {hidden ? "Rp ••••••" : `Rp ${p.sellPrice.toLocaleString("id-ID")}`}
                      </span>

                      {!isOutOfStock && (
                        <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center border border-transparent transition-all duration-200 shrink-0">
                          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 gap-2.5 bg-white border border-slate-100 rounded-xl">
                <span className="text-3xl">🔍</span>
                <p className="text-xs font-bold text-slate-500">Tidak ada produk ditemukan</p>
                <p className="text-[9.5px] text-slate-400 text-center max-w-[250px]">Coba cari dengan kata kunci lain atau kategori berbeda.</p>
              </div>
            )}

          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <footer className="flex items-center justify-between py-2.5 px-1 border-t border-slate-100 shrink-0 select-none">
              
              <span className="text-[10px] text-slate-400 font-semibold">
                Total {filteredProducts.length} produk
              </span>

              <div className="flex items-center gap-1.5">
                
                {/* Previous Button */}
                <button
                  onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((pageNum, idx) => {
                  if (pageNum === "...") {
                    return (
                      <span key={idx} className="w-8 h-8 flex items-center justify-center text-slate-400 text-[11px] select-none">
                        ...
                      </span>
                    );
                  }
                  
                  const isPageActive = currentPage === pageNum;
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(pageNum as number)}
                      className={cn(
                        "w-8 h-8 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center active:scale-95",
                        isPageActive
                          ? "bg-slate-950 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {/* Next Button */}
                <button
                  onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

              </div>

            </footer>
          )}

        </div>

        {/* Right Side: Shopping Cart Panel */}
        <div className="w-[380px] shrink-0 border-l border-slate-200 bg-white flex flex-col justify-between overflow-hidden h-full">
          
          {/* Cart Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-slate-700" />
              <div>
                <h3 className="font-bold text-slate-800 text-[13px] tracking-wide">Daftar Belanja</h3>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              {hasDraft && (
                <button
                  onClick={loadDraft}
                  className="text-[9.5px] bg-amber-50 text-amber-700 border border-amber-200/60 hover:bg-amber-100 px-2 py-0.5 rounded-lg font-bold cursor-pointer transition-colors active:scale-95"
                >
                  Muat Draft
                </button>
              )}
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                {totalQty} Item
              </span>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar bg-white">
            
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2.5 py-12 px-6">
                <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <ShoppingCart className="h-5 w-5 text-slate-400 stroke-[1.2]" />
                </div>
                <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">Keranjang Kosong</p>
                <p className="text-[9.5px] text-slate-400 text-center max-w-[185px]">Pilih barang di sebelah kiri untuk menambah pesanan belanja.</p>
              </div>
            ) : (
              cart.map((item) => {
                const productRef = products.find(p => p.id === item.id);
                const maxStock = productRef ? getProductStock(productRef, products) : 999;

                return (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors duration-150 group">
                    
                    {/* Item Thumbnail */}
                    <div className="w-10 h-10 bg-slate-50/80 border border-slate-200/50 rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative select-none">
                      {productRef?.imageUrl ? (
                        <img 
                          src={productRef.imageUrl} 
                          alt={item.name} 
                          className="w-full h-full object-contain p-1" 
                        />
                      ) : (
                        <div className="scale-75 opacity-75">
                          {getCategoryIcon(item.category)}
                        </div>
                      )}
                    </div>

                    {/* Product Details & Qty adjustments */}
                    <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                      <h4 className="text-[11.5px] font-semibold text-slate-800 truncate leading-snug">{item.name}</h4>
                      <div className="flex items-center justify-between mt-1">
                        
                        {/* Qty adjustments */}
                        <div className="flex items-center bg-slate-100/80 rounded-lg p-0.5 shrink-0">
                          <button 
                            onClick={() => decreaseQty(item.id)} 
                            className="text-slate-500 hover:text-slate-800 p-1 bg-white hover:bg-slate-50 rounded-md shadow-2xs border border-slate-200/40 cursor-pointer active:scale-95 transition-all"
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </button>
                          <span className="text-[10px] font-bold text-slate-700 w-6 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => item.quantity < maxStock && productRef && addToCart(productRef)}
                            disabled={item.quantity >= maxStock}
                            className="text-slate-500 hover:text-slate-800 p-1 bg-white hover:bg-slate-50 rounded-md shadow-2xs border border-slate-200/40 cursor-pointer active:scale-95 transition-all disabled:opacity-35 disabled:cursor-not-allowed"
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </button>
                        </div>

                        {/* Item Subtotal & Delete button */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {hidden ? "Rp •••••" : `Rp ${(item.price * item.quantity).toLocaleString("id-ID")}`}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer transition-colors"
                            title="Hapus"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                      </div>
                    </div>

                  </div>
                );
              })
            )}

          </div>

          {/* Cart Calculations Summary Footer */}
          <div className="p-4 border-t border-slate-100 bg-white space-y-3.5 shrink-0">
            
            {/* Subtotal & Discount rows */}
            <div className="space-y-1.5 text-[11px] font-semibold text-slate-500">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-semibold text-slate-700">
                  {hidden ? "Rp ••••••" : `Rp ${totalAmount.toLocaleString("id-ID")}`}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">Diskon</span>
                  {parsedDiscountVal > 0 ? (
                    <button
                      onClick={() => { setDiscountValue("0"); setDiscountType("NOMINAL"); }}
                      className="text-[9px] text-rose-500 hover:text-rose-700 flex items-center font-bold"
                    >
                      (Hapus)
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setTempDiscountValue("");
                        setTempDiscountType("NOMINAL");
                        setShowDiscountModal(true);
                      }}
                      className="text-[10px] text-blue-600 hover:underline font-bold flex items-center cursor-pointer transition-colors"
                    >
                      + Tambah
                    </button>
                  )}
                </div>
                <span className="font-semibold text-slate-700">
                  {discountAmount > 0 ? `-${hidden ? "Rp •••••" : `Rp ${discountAmount.toLocaleString("id-ID")}`}` : "Rp 0"}
                </span>
              </div>
            </div>

            {/* Total Row */}
            <div className="flex justify-between items-center pt-3 border-t border-dashed border-slate-200">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">TOTAL</span>
              <span className="text-lg font-extrabold text-slate-900 tracking-tight">
                {hidden ? "Rp ••••••" : `Rp ${finalTotalAmount.toLocaleString("id-ID")}`}
              </span>
            </div>

            {/* Payment Method selector */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold block tracking-wider uppercase">Metode Pembayaran</span>
                <span className="text-[9px] text-slate-400 font-mono font-bold bg-slate-50 px-1 py-0.2 rounded border border-slate-200/60 select-none" title="Fokus / Ganti dengan tombol F4">
                  F4 Ganti
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                
                {/* TUNAI Option */}
                <button
                  onClick={() => { setPaymentMethod("CASH"); setCustomerName(""); }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all duration-150 cursor-pointer text-xs font-semibold",
                    paymentMethod === "CASH"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <Banknote className="h-3.5 w-3.5" />
                  <span>Tunai</span>
                </button>

                {/* QRIS Option */}
                <button
                  onClick={() => { setPaymentMethod("QRIS"); setCustomerName(""); }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all duration-150 cursor-pointer text-xs font-semibold",
                    paymentMethod === "QRIS"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>QRIS</span>
                </button>

                {/* KARTU Option */}
                <button
                  onClick={() => { setPaymentMethod("CARD"); }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all duration-150 cursor-pointer text-xs font-semibold",
                    (paymentMethod === "CARD" || paymentMethod === "DEBT")
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Kartu</span>
                </button>

              </div>
            </div>

            {/* Sub-panels based on payments */}
            {paymentMethod === "CASH" && cart.length > 0 && (
              <div className="space-y-3 p-3 bg-slate-50 border border-slate-100 rounded-xl animate-in slide-in-from-top-2 duration-200">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] text-slate-500 font-bold tracking-wider uppercase">Uang Diterima (Cash)</label>
                  {cashReceived && (
                    <button 
                      onClick={() => setCashReceived("")} 
                      className="text-[9px] text-slate-500 hover:text-slate-600 flex items-center gap-0.5 font-semibold cursor-pointer"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Reset
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    placeholder="Masukkan nominal uang..."
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg py-2 px-8 text-xs text-slate-800 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 font-bold"
                  />
                </div>

                {/* Quick cash shortcuts */}
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => handleQuickCash(0)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 text-[10px] rounded-md border border-slate-200/60 active:scale-95 transition-all font-medium"
                  >
                    Pas
                  </button>
                  {[10000, 20000, 50000, 100000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => handleQuickCash(amt)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 text-[10px] rounded-md border border-slate-200/60 active:scale-95 transition-all font-medium"
                    >
                      Rp {amt.toLocaleString("id-ID")}
                    </button>
                  ))}
                </div>

                {/* Change return output */}
                {numericCashReceived > 0 && (
                  <div className={cn(
                    "p-2.5 rounded-lg border flex justify-between items-center text-xs font-bold transition-all duration-150",
                    changeAmount >= 0 
                      ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                      : "bg-rose-50 border-rose-100 text-rose-800"
                  )}>
                    <span>{changeAmount >= 0 ? "Uang Kembalian:" : "Kekurangan Bayar:"}</span>
                    <span className="font-extrabold">
                      {hidden ? "Rp •••••" : `Rp ${Math.abs(changeAmount).toLocaleString("id-ID")}`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {(paymentMethod === "CARD" || paymentMethod === "DEBT") && (
              <div className="space-y-3 p-3 bg-slate-50 border border-slate-100 rounded-xl animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDebtCheck"
                    checked={paymentMethod === "DEBT"}
                    onChange={(e) => {
                      setPaymentMethod(e.target.checked ? "DEBT" : "CARD");
                      if (!e.target.checked) setCustomerName("");
                    }}
                    className="w-3.5 h-3.5 text-slate-800 border-slate-400 rounded focus:ring-slate-500 cursor-pointer shrink-0"
                  />
                  <label htmlFor="isDebtCheck" className="text-[10px] text-slate-600 font-semibold select-none cursor-pointer">
                    Simpan sebagai Kasbon (Hutang Pelanggan)
                  </label>
                </div>

                {paymentMethod === "DEBT" ? (
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Nama Pelanggan</span>
                    <input
                      type="text"
                      placeholder="Masukkan nama pelanggan..."
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-slate-400 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 font-semibold"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-700">
                    <CreditCard className="w-4 h-4 shrink-0 text-slate-400" />
                    <span className="text-[10px] font-medium leading-normal">
                      Silakan gesek atau tap kartu pada mesin EDC bank yang tersedia.
                    </span>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === "QRIS" && cart.length > 0 && (
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex gap-2.5 items-center animate-in slide-in-from-top-2 duration-200">
                <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                  <QrCode className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-800 leading-none">Pembayaran QRIS</p>
                  <p className="text-[9.5px] text-slate-500 mt-1 font-medium leading-relaxed">Tampilkan kode QR dinamis di depan atau scan di struk belanja.</p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-100/60">
              <button
                id="proses-pembayaran-btn"
                onClick={handleCheckout}
                disabled={
                  cart.length === 0 || 
                  (paymentMethod === "CASH" && numericCashReceived < finalTotalAmount) || 
                  (paymentMethod === "DEBT" && !customerName.trim())
                }
                className={cn(
                  "w-full py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer",
                  cart.length > 0 && 
                  !(paymentMethod === "CASH" && numericCashReceived < finalTotalAmount) && 
                  !(paymentMethod === "DEBT" && !customerName.trim())
                    ? "bg-slate-950 hover:bg-slate-900 text-white active:scale-98"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                )}
              >
                <ShoppingCart className="w-4 h-4" /> Proses Pembayaran
                <span className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ml-1.5 transition-colors",
                  cart.length > 0 && 
                  !(paymentMethod === "CASH" && numericCashReceived < finalTotalAmount) && 
                  !(paymentMethod === "DEBT" && !customerName.trim())
                    ? "bg-slate-800 text-slate-300"
                    : "bg-slate-200 text-slate-400"
                )}>
                  F9
                </span>
              </button>

              <button
                onClick={saveDraft}
                disabled={cart.length === 0}
                className={cn(
                  "w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-150 border cursor-pointer active:scale-98",
                  cart.length > 0
                    ? "bg-white hover:bg-slate-50 border-slate-200 text-slate-800"
                    : "bg-white border-slate-100 text-slate-300 cursor-not-allowed"
                )}
              >
                <FileText className="w-4 h-4" /> Simpan sebagai Draft
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Discount modal configuration */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-xs z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl border border-slate-100 p-5 w-full max-w-[280px] shadow-xl animate-in zoom-in-95 duration-150 select-none">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">Atur Diskon</h4>
            
            <div className="space-y-3">
              {/* Toggle Rp / % */}
              <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 border border-slate-200/50 rounded-lg">
                <button
                  type="button"
                  onClick={() => setTempDiscountType("NOMINAL")}
                  className={cn(
                    "py-1 text-[10px] font-bold rounded cursor-pointer transition-all",
                    tempDiscountType === "NOMINAL" ? "bg-white text-slate-800 shadow-3xs" : "text-slate-600 hover:text-slate-800"
                  )}
                >
                  Nominal (Rp)
                </button>
                <button
                  type="button"
                  onClick={() => setTempDiscountType("PERCENT")}
                  className={cn(
                    "py-1 text-[10px] font-bold rounded pointer-events-auto cursor-pointer transition-all",
                    tempDiscountType === "PERCENT" ? "bg-white text-slate-800 shadow-3xs" : "text-slate-600 hover:text-slate-800"
                  )}
                >
                  Persentase (%)
                </button>
              </div>

              {/* Input box */}
              <div className="relative">
                {tempDiscountType === "NOMINAL" && (
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                )}
                <input
                  type="number"
                  placeholder={tempDiscountType === "NOMINAL" ? "0" : "0%"}
                  value={tempDiscountValue}
                  onChange={(e) => setTempDiscountValue(e.target.value)}
                  className={cn(
                    "w-full bg-[#F8FAFC] border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 font-bold",
                    tempDiscountType === "NOMINAL" && "pl-8"
                  )}
                />
                {tempDiscountType === "PERCENT" && (
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">%</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowDiscountModal(false)}
                className="py-2 text-[10px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setDiscountValue(tempDiscountValue || "0");
                  setDiscountType(tempDiscountType);
                  setShowDiscountModal(false);
                }}
                className="py-2 text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors shadow-2xs"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Success Modal Overlay (Thermal Receipt) */}
      {showReceipt && lastTransaction && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-3xs z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm overflow-visible animate-in zoom-in-95 duration-200">
            
            {/* The Wavy Top Cutout Thermal Receipt */}
            <div className="bg-white border-x border-slate-200 rounded-t-xl shadow-2xl relative pt-6 px-6">
              {/* Serrated top pattern */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-200 to-transparent flex overflow-hidden">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div key={i} className="w-2.5 h-2.5 bg-slate-950/5 rotate-45 transform origin-top-left -translate-y-1" />
                ))}
              </div>

              {/* Success Badge */}
              <div className="text-center space-y-2 pb-4 border-b border-dashed border-slate-200">
                <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="h-5 w-5 stroke-[2]" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm leading-none tracking-tight">Transaksi Berhasil</h3>
                <p className="text-[10px] text-slate-405 font-mono tracking-wider">{lastTransaction.invoiceNumber}</p>
              </div>

              {/* Receipt Content Body */}
              <div className="py-4 text-xs space-y-3 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Pembayaran:</span>
                  <span className="text-slate-900 font-bold">{lastTransaction.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pelanggan:</span>
                  <span className="text-slate-900 font-bold">{lastTransaction.customer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Waktu:</span>
                  <span className="text-slate-900 font-bold">{lastTransaction.time}</span>
                </div>

                {/* Items detailed */}
                <div className="border-t border-dashed border-slate-200 mt-4 pt-3 space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Rincian Belanja</span>
                  {lastTransaction.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-slate-600 text-[11px]">
                      <span className="truncate max-w-[190px]">
                        {item.name} <span className="text-[9.5px] text-slate-400">x{item.quantity}</span>
                      </span>
                      <span>Rp {(item.price * item.quantity).toLocaleString("id-ID")}</span>
                    </div>
                  ))}
                </div>

                {/* Subtotal & Discount info in receipt */}
                {lastTransaction.discount > 0 && (
                  <div className="border-t border-dashed border-slate-200 mt-3 pt-3 space-y-1.5 text-[11px] text-slate-500">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>Rp {lastTransaction.subtotal.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between text-rose-600">
                      <span>Diskon:</span>
                      <span>-Rp {lastTransaction.discount.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                )}

                {/* Cash payment specific metrics */}
                {lastTransaction.method === "Tunai" && (
                  <div className="border-t border-dashed border-slate-200 mt-3 pt-3 space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-500">
                      <span>Uang Diterima:</span>
                      <span>Rp {lastTransaction.cashReceived.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between text-slate-700 font-bold">
                      <span>Kembalian:</span>
                      <span>Rp {lastTransaction.change.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Wavy bottom cut with receipt totals */}
            <div className="bg-slate-50 border-x border-b border-slate-200 rounded-b-xl shadow-2xl relative p-6 space-y-5">
              
              {/* Receipt Total */}
              <div className="flex justify-between items-center text-sm font-mono border-t border-dashed border-slate-200 pt-3">
                <span className="font-bold text-slate-500 text-[10px]">TOTAL BELANJA:</span>
                <span className="font-extrabold text-slate-900 text-base leading-none">
                  Rp {lastTransaction.total.toLocaleString("id-ID")}
                </span>
              </div>

              {/* Bottom barcode simulation */}
              <div className="flex flex-col items-center justify-center space-y-1.5 pt-2">
                <div className="h-7 w-48 bg-slate-800 flex gap-0.5 justify-center overflow-hidden opacity-90 rounded">
                  {Array.from({ length: 44 }).map((_, i) => {
                    const width = (i % 3 === 0) ? "w-1.5" : (i % 2 === 0) ? "w-[1px]" : "w-0.5";
                    const isWhite = i % 5 === 0;
                    return (
                      <div 
                        key={i} 
                        className={cn(
                          "h-full shrink-0", 
                          isWhite ? "bg-transparent" : "bg-white", 
                          width
                        )} 
                      />
                    );
                  })}
                </div>
                <span className="text-[8.5px] text-slate-500 font-mono tracking-wider font-semibold">TERIMA KASIH TELAH BERBELANJA</span>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  onClick={() => setShowReceipt(false)}
                  className="py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 bg-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-3xs"
                >
                  Cetak Struk
                </button>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BUKA SHIFT OVERLAY */}
      {activeShift === null && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[28px] border border-slate-200/80 shadow-2xl p-6 relative overflow-hidden flex flex-col animate-in scale-in duration-300">
            {/* Background Glow */}
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />

            {/* Brand Logo / Identity */}
            <div className="flex flex-col items-center text-center pb-5 border-b border-slate-100 shrink-0">
              <div className="bg-blue-600 p-4 rounded-2xl shadow-xl shadow-blue-500/20 mb-4 animate-bounce">
                <Diamond className="w-6 h-6 text-white stroke-[2.5]" />
              </div>
              <h2 className="font-extrabold text-slate-900 text-base">Buka Laci Kas &amp; Shift</h2>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium px-2 leading-relaxed">
                Laci kasir terkunci. Harap tentukan nama kasir dan modal laci awal untuk melacak rekonsiliasi kas berjalan secara akurat.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleOpenShiftSubmit} className="py-4 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block pl-1">Nama Kasir</label>
                <input
                  type="text"
                  required
                  value={openShiftCashier}
                  onChange={(e) => setOpenShiftCashier(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block pl-1">Modal Kas/Laci Awal (Rp)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={openShiftInitialCash === 0 ? "" : openShiftInitialCash}
                  onChange={(e) => setOpenShiftInitialCash(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="Masukkan nominal, misal: 200000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-sm font-sans"
                />
                <span className="text-[9px] text-slate-400 font-medium block pl-1">Digunakan untuk uang kembalian transaksi pertama.</span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => window.location.href = "/"}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold rounded-xl transition-all cursor-pointer text-center active:scale-95"
                >
                  Ke Dashboard
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 transition-all cursor-pointer text-center active:scale-95"
                >
                  Mulai Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TUTUP SHIFT */}
      {isClosingShift && activeShift && (
        <div className="fixed inset-0 z-45 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[28px] border border-slate-200/80 shadow-2xl p-6 relative overflow-hidden flex flex-col animate-in scale-in duration-300">
            {/* Glow */}
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="bg-rose-50 text-rose-600 p-2 rounded-xl animate-pulse">
                  <Lock className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Tutup Shift &amp; Rekonsiliasi Kas</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">{activeShift.cashierName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsClosingShift(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Form */}
            <form onSubmit={handleCloseShiftSubmit} className="py-4 space-y-4 text-xs">
              {/* Shift Stats Card */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-medium">Buka Sejak</span>
                  <span className="font-semibold text-slate-700">{activeShift.openTime}</span>
                </div>
                <div className="h-px bg-slate-200/50 my-1" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Modal Awal Laci</span>
                  <span className="font-bold text-slate-800">Rp {activeShift.initialCash.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Penjualan Tunai (+)</span>
                  <span className="font-bold text-slate-800">Rp {activeShift.cashSales.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Penjualan Non-Tunai</span>
                  <span className="font-medium text-slate-500">Rp {activeShift.nonCashSales.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Penjualan Kasbon</span>
                  <span className="font-medium text-slate-500">Rp {activeShift.debtSales.toLocaleString("id-ID")}</span>
                </div>
                <div className="h-px bg-slate-200/50 my-1" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-900 font-extrabold">Uang Tunai Seharusnya</span>
                  <span className="text-xs font-black text-blue-600">Rp {activeShift.expectedCash.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Physical cash input */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block pl-1 font-sans">
                  Uang Tunai Fisik di Laci (Rp)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={closeShiftActualCash}
                  onChange={(e) => setCloseShiftActualCash(e.target.value)}
                  placeholder="Hitung uang kertas/logam fisik di laci kas"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-sm font-sans"
                />
              </div>

              {/* Discrepancy details */}
              {closeShiftActualCash !== "" && (
                <div className={cn(
                  "p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all font-sans",
                  (parseFloat(closeShiftActualCash) || 0) === activeShift.expectedCash
                    ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                    : (parseFloat(closeShiftActualCash) || 0) < activeShift.expectedCash
                      ? "bg-rose-50 border-rose-100 text-rose-800"
                      : "bg-amber-50 border-amber-100 text-amber-800"
                )}>
                  <span>Selisih Rekonsiliasi:</span>
                  <span className="font-extrabold font-sans">
                    {(parseFloat(closeShiftActualCash) || 0) === activeShift.expectedCash
                      ? "Kas Sesuai (Pas)"
                      : (parseFloat(closeShiftActualCash) || 0) < activeShift.expectedCash
                        ? `Kas Kurang (-Rp ${(activeShift.expectedCash - (parseFloat(closeShiftActualCash) || 0)).toLocaleString("id-ID")})`
                        : `Kas Lebih (+Rp ${((parseFloat(closeShiftActualCash) || 0) - activeShift.expectedCash).toLocaleString("id-ID")})`
                    }
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsClosingShift(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
                >
                  Ya, Tutup Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
