"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Filter,
  Package,
  Layers,
  Barcode,
  TrendingUp,
  AlertCircle,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  X,
  Upload,
  ArrowUpDown,
  SlidersHorizontal
} from "lucide-react";
import { useHideAmounts } from "@/lib/hide-amounts";
import { cn } from "@/lib/utils";
import { initialProducts, initialCategories } from "@/lib/initial-products";

const COLOR_PRESETS = [
  { value: "from-blue-500 to-blue-700", label: "Biru" },
  { value: "from-sky-500 to-blue-600", label: "Biru Muda" },
  { value: "from-emerald-500 to-teal-600", label: "Hijau" },
  { value: "from-amber-500 to-orange-600", label: "Kuning / Oranye" },
  { value: "from-slate-500 to-slate-700", label: "Abu-Abu / Slate" },
  { value: "from-rose-500 to-red-600", label: "Merah" },
];

const EMOJI_PRESETS = ["🌾", "🍜", "🥤", "🧼", "📦", "🍎", "🍬", "🧴", "👕", "🧸", "🔌", "📚", "🍳", "🥖"];

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

export default function ProductsPage() {
  const { hidden } = useHideAmounts();
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);

  // Modals States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Recipe states
  const [selectedRecipeIngredientId, setSelectedRecipeIngredientId] = useState("");
  const [selectedRecipeIngredientQty, setSelectedRecipeIngredientQty] = useState(1);

  // Form States
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    category: "",
    costPrice: 0,
    sellPrice: 0,
    stock: 0,
    imageUrl: "",
    isProcessed: false,
    recipe: [] as { productId: string; quantity: number }[]
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    desc: "",
    color: COLOR_PRESETS[0].value,
    icon: EMOJI_PRESETS[0]
  });

  const handleAddRecipeIngredient = () => {
    if (!selectedRecipeIngredientId) return;
    
    // Check if already in recipe
    if (productForm.recipe.some(r => r.productId === selectedRecipeIngredientId)) {
      alert("Bahan baku ini sudah terdaftar dalam resep!");
      return;
    }

    setProductForm(prev => ({
      ...prev,
      recipe: [...prev.recipe, { productId: selectedRecipeIngredientId, quantity: Number(selectedRecipeIngredientQty) || 1 }]
    }));
  };

  const handleRemoveRecipeIngredient = (productId: string) => {
    setProductForm(prev => ({
      ...prev,
      recipe: prev.recipe.filter(r => r.productId !== productId)
    }));
  };

  useEffect(() => {
    // Load Products
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

    // Load Categories
    const savedCategories = localStorage.getItem("warung_categories");
    if (savedCategories) {
      try {
        let parsed = JSON.parse(savedCategories);
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
        setCategoriesList(parsed);
      } catch (e) {
        console.error(e);
      }
    } else {
      setCategoriesList(initialCategories);
      localStorage.setItem("warung_categories", JSON.stringify(initialCategories));
    }
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "CATEGORIES">("ALL");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<"ALL" | "NORMAL" | "PROCESSED">("ALL");
  const [selectedStockFilter, setSelectedStockFilter] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">("ALL");
  const [sortBy, setSortBy] = useState<string>("name-asc");

  const filteredProducts = products
    .filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (p.sku && p.sku.includes(searchQuery)) ||
                            p.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategoryFilter === "ALL" || p.category === selectedCategoryFilter;
      
      const matchesType = selectedTypeFilter === "ALL" || 
                          (selectedTypeFilter === "NORMAL" && !p.isProcessed) ||
                          (selectedTypeFilter === "PROCESSED" && p.isProcessed);
      
      const currentStock = getProductStock(p, products);
      const matchesStock = selectedStockFilter === "ALL" ||
                           (selectedStockFilter === "IN_STOCK" && currentStock > 10) ||
                           (selectedStockFilter === "LOW_STOCK" && currentStock > 0 && currentStock <= 10) ||
                           (selectedStockFilter === "OUT_OF_STOCK" && currentStock === 0);
      
      return matchesSearch && matchesCategory && matchesType && matchesStock;
    })
    .sort((a, b) => {
      const stockA = getProductStock(a, products);
      const stockB = getProductStock(b, products);
      
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name);
      } else if (sortBy === "stock-asc") {
        return stockA - stockB;
      } else if (sortBy === "stock-desc") {
        return stockB - stockA;
      } else if (sortBy === "price-asc") {
        return Number(a.sellPrice) - Number(b.costPrice) - (Number(a.sellPrice) - Number(b.costPrice)); // default compare sellPrice
      } else if (sortBy === "price-desc") {
        return Number(b.sellPrice) - Number(a.sellPrice);
      }
      return 0;
    });

  // Since we also want to support sort by sell price lowest to highest correctly, let's fix the comparison:
  // price-asc: Number(a.sellPrice) - Number(b.sellPrice)
  // price-desc: Number(b.sellPrice) - Number(a.sellPrice)

  // Modal Product Handlers
  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      sku: "",
      category: categoriesList[0]?.name || "Lain-lain",
      costPrice: 0,
      sellPrice: 0,
      stock: 0,
      imageUrl: "",
      isProcessed: false,
      recipe: []
    });
    const ingOptions = products.filter(p => !p.isProcessed);
    setSelectedRecipeIngredientId(ingOptions[0]?.id || "");
    setSelectedRecipeIngredientQty(1);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      sku: product.sku || "",
      category: product.category,
      costPrice: product.costPrice,
      sellPrice: product.sellPrice,
      stock: product.stock,
      imageUrl: product.imageUrl || "",
      isProcessed: !!product.isProcessed,
      recipe: product.recipe || []
    });
    const ingOptions = products.filter(p => !p.isProcessed && p.id !== product.id);
    setSelectedRecipeIngredientId(ingOptions[0]?.id || "");
    setSelectedRecipeIngredientQty(1);
    setIsProductModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran gambar terlalu besar! Maksimal 2MB.");
      return;
    }

    try {
      setIsUploading(true);
      const { supabase } = await import("@/lib/supabase");

      // Generate unique name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // Upload file to product-images bucket
      const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setProductForm(prev => ({ ...prev, imageUrl: publicUrl }));
    } catch (error: any) {
      console.error("Error uploading image:", error);
      alert(`Gagal upload gambar ke Supabase: ${error.message || error}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) return;

    let updatedProducts = [...products];

    if (editingProduct) {
      updatedProducts = updatedProducts.map(p => 
        p.id === editingProduct.id 
          ? { 
              ...p, 
              name: productForm.name.trim(),
              sku: productForm.sku.trim() || null,
              category: productForm.category,
              costPrice: productForm.costPrice,
              sellPrice: productForm.sellPrice,
              stock: productForm.isProcessed ? 0 : productForm.stock,
              imageUrl: productForm.imageUrl || null,
              isProcessed: productForm.isProcessed,
              recipe: productForm.isProcessed ? productForm.recipe : []
            } 
          : p
      );
    } else {
      const nextId = (products.reduce((max, p) => Math.max(max, parseInt(p.id) || 0), 0) + 1).toString();
      const newProduct = {
        id: nextId,
        sku: productForm.sku.trim() || null,
        name: productForm.name.trim(),
        category: productForm.category,
        costPrice: productForm.costPrice,
        sellPrice: productForm.sellPrice,
        stock: productForm.isProcessed ? 0 : productForm.stock,
        imageUrl: productForm.imageUrl || null,
        isProcessed: productForm.isProcessed,
        recipe: productForm.isProcessed ? productForm.recipe : []
      };
      updatedProducts.push(newProduct);
    }

    setProducts(updatedProducts);
    localStorage.setItem("warung_products", JSON.stringify(updatedProducts));
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = (product: any) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus produk "${product.name}"?`)) {
      const updatedProducts = products.filter(p => p.id !== product.id);
      setProducts(updatedProducts);
      localStorage.setItem("warung_products", JSON.stringify(updatedProducts));
    }
  };

  // Modal Category Handlers
  const openAddCategoryModal = () => {
    setCategoryForm({
      name: "",
      desc: "",
      color: COLOR_PRESETS[0].value,
      icon: EMOJI_PRESETS[0]
    });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const catName = categoryForm.name.trim();
    if (!catName) return;

    if (categoriesList.some(cat => cat.name.toLowerCase() === catName.toLowerCase())) {
      alert("Kategori dengan nama tersebut sudah ada!");
      return;
    }

    const newCategory = {
      name: catName,
      icon: categoryForm.icon,
      color: categoryForm.color,
      desc: categoryForm.desc.trim() || "Kategori produk.",
      count: 0
    };

    const updatedCategories = [...categoriesList, newCategory];
    setCategoriesList(updatedCategories);
    localStorage.setItem("warung_categories", JSON.stringify(updatedCategories));

    // Automatically set category inside product form if open
    if (isProductModalOpen) {
      setProductForm(prev => ({ ...prev, category: catName }));
    }

    setIsCategoryModalOpen(false);
  };

  const handleDeleteCategory = (categoryName: string) => {
    if (categoryName === "Lain-lain") {
      alert("Kategori 'Lain-lain' tidak dapat dihapus karena merupakan kategori bawaan/cadangan.");
      return;
    }

    const affectedProductsCount = products.filter(p => p.category === categoryName).length;
    let confirmMsg = `Apakah Anda yakin ingin menghapus kategori "${categoryName}"?`;
    if (affectedProductsCount > 0) {
      confirmMsg += `\n\nSebanyak ${affectedProductsCount} produk dalam kategori ini akan otomatis dipindahkan ke kategori "Lain-lain".`;
    }

    if (window.confirm(confirmMsg)) {
      // Filter out deleted category
      let updatedCategories = categoriesList.filter(cat => cat.name !== categoryName);
      
      // Ensure "Lain-lain" fallback exists
      if (!updatedCategories.some(cat => cat.name === "Lain-lain")) {
        updatedCategories.push({
          name: "Lain-lain",
          icon: "📦",
          color: "from-slate-500 to-slate-700",
          desc: "Kategori umum untuk produk tanpa kategori khusus.",
          count: 0
        });
      }

      setCategoriesList(updatedCategories);
      localStorage.setItem("warung_categories", JSON.stringify(updatedCategories));

      // Move products to "Lain-lain"
      const updatedProducts = products.map(p => 
        p.category === categoryName 
          ? { ...p, category: "Lain-lain" } 
          : p
      );
      setProducts(updatedProducts);
      localStorage.setItem("warung_products", JSON.stringify(updatedProducts));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Produk</h1>
            <span className="bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
              {filteredProducts.length === products.length ? `${products.length} Items` : `${filteredProducts.length} dari ${products.length} Items`}
            </span>
          </div>
          <p className="text-slate-550 text-xs mt-1 font-medium">Kelola daftar produk, kategori, harga, profit, dan tingkat ketersediaan stok.</p>
        </div>
        
        <button 
          onClick={openAddProductModal}
          className="group relative flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 overflow-hidden cursor-pointer"
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          <Plus className="h-4 w-4 transition-transform group-hover:rotate-90 duration-300" /> 
          Tambah Produk Baru
        </button>
      </div>

      {/* Tabs Layout */}
      <div className="flex border border-slate-200 bg-slate-50/50 p-1 rounded-xl max-w-sm">
        <button 
          onClick={() => setActiveTab("ALL")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
            activeTab === "ALL" 
              ? "bg-white text-blue-600 shadow-sm border border-slate-200/50 font-extrabold" 
              : "text-slate-550 hover:text-slate-800"
          )}
        >
          <Package className="h-3.5 w-3.5" /> Semua Produk
        </button>
        <button 
          onClick={() => setActiveTab("CATEGORIES")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
            activeTab === "CATEGORIES" 
              ? "bg-white text-blue-600 shadow-sm border border-slate-200/50 font-extrabold" 
              : "text-slate-550 hover:text-slate-800"
          )}
        >
          <Layers className="h-3.5 w-3.5" /> Kategori ({categoriesList.length})
        </button>
      </div>

      {activeTab === "ALL" ? (
        <div className="space-y-4 chart-reveal">
          {/* Search and Filters */}
          <div className="bg-slate-50/40 border border-slate-200/60 p-4 rounded-2xl space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama produk, kategori, atau scan barcode SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-755 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm font-semibold"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2.5 items-center">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mr-1">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filter:
              </div>

              {/* Kategori Filter */}
              <div className="relative">
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 hover:border-slate-350 rounded-xl py-2.5 pl-8.5 pr-8.5 text-xs text-slate-650 font-bold focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm cursor-pointer"
                >
                  <option value="ALL">Semua Kategori</option>
                  {categoriesList.map((cat) => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                <Layers className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Filter className="absolute right-3.5 top-3.5 h-3 w-3 text-slate-400 pointer-events-none" />
              </div>

              {/* Tipe Filter */}
              <div className="relative">
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value as any)}
                  className="appearance-none bg-white border border-slate-200 hover:border-slate-350 rounded-xl py-2.5 pl-8.5 pr-8.5 text-xs text-slate-650 font-bold focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm cursor-pointer"
                >
                  <option value="ALL">Semua Tipe</option>
                  <option value="NORMAL">Produk Fisik / Normal</option>
                  <option value="PROCESSED">Olahan / Resep BOM</option>
                </select>
                <Package className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Filter className="absolute right-3.5 top-3.5 h-3 w-3 text-slate-400 pointer-events-none" />
              </div>

              {/* Ketersediaan Stok Filter */}
              <div className="relative">
                <select
                  value={selectedStockFilter}
                  onChange={(e) => setSelectedStockFilter(e.target.value as any)}
                  className="appearance-none bg-white border border-slate-200 hover:border-slate-350 rounded-xl py-2.5 pl-8.5 pr-8.5 text-xs text-slate-650 font-bold focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm cursor-pointer"
                >
                  <option value="ALL">Semua Status Stok</option>
                  <option value="IN_STOCK">Tersedia (&gt; 10 Pcs)</option>
                  <option value="LOW_STOCK">Menipis (1 - 10 Pcs)</option>
                  <option value="OUT_OF_STOCK">Habis (0 Pcs)</option>
                </select>
                <AlertCircle className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Filter className="absolute right-3.5 top-3.5 h-3 w-3 text-slate-400 pointer-events-none" />
              </div>

              {/* Urutkan Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 hover:border-slate-350 rounded-xl py-2.5 pl-8.5 pr-8.5 text-xs text-slate-650 font-bold focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm cursor-pointer"
                >
                  <option value="name-asc">Nama: A - Z</option>
                  <option value="name-desc">Nama: Z - A</option>
                  <option value="stock-desc">Stok: Tertinggi</option>
                  <option value="stock-asc">Stok: Terendah</option>
                  <option value="price-desc">Harga Jual: Tertinggi</option>
                  <option value="price-asc">Harga Jual: Terendah</option>
                </select>
                <ArrowUpDown className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Filter className="absolute right-3.5 top-3.5 h-3 w-3 text-slate-400 pointer-events-none" />
              </div>

              {/* Reset Button */}
              {(searchQuery !== "" || selectedCategoryFilter !== "ALL" || selectedTypeFilter !== "ALL" || selectedStockFilter !== "ALL" || sortBy !== "name-asc") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategoryFilter("ALL");
                    setSelectedTypeFilter("ALL");
                    setSelectedStockFilter("ALL");
                    setSortBy("name-asc");
                  }}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 border border-slate-200/40"
                >
                  <X className="h-3.5 w-3.5" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-4 px-5">Produk</th>
                    <th className="py-4 px-5">SKU / Barcode</th>
                    <th className="py-4 px-5">Kategori</th>
                    <th className="py-4 px-5 text-right">Harga Modal</th>
                    <th className="py-4 px-5 text-right">Harga Jual</th>
                    <th className="py-4 px-5 text-right">Margin / Profit</th>
                    <th className="py-4 px-5 text-center">Stok</th>
                    <th className="py-4 px-5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600 divide-y divide-slate-100">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((p) => {
                      const profit = p.sellPrice - p.costPrice;
                      const marginPercent = p.sellPrice > 0 ? ((profit / p.sellPrice) * 100).toFixed(0) : "0";
                      const currentStock = getProductStock(p, products);
                      const isLowStock = currentStock <= 5;

                      return (
                        <tr 
                          key={p.id} 
                          className="hover:bg-slate-50/60 transition-all duration-200 group"
                        >
                          {/* Product Details with Image/Placeholder */}
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-3">
                              <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                                {p.imageUrl ? (
                                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-300">
                                    <ShoppingBag className="w-4 h-4 stroke-[1.8]" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-800 text-[13px] block group-hover:text-blue-600 transition-colors">
                                    {p.name}
                                  </span>
                                  {p.isProcessed && (
                                    <span className="bg-amber-50 text-amber-700 text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-amber-200/50 uppercase tracking-wide">
                                      Olahan / Resep
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  ID: #{p.id} {p.isProcessed && p.recipe && `• ${p.recipe.length} bahan`}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* SKU/Barcode */}
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg w-fit">
                              <Barcode className="h-3.5 w-3.5 text-slate-400" />
                              {p.sku || "-"}
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-5">
                            <span className="bg-slate-100/70 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-slate-200/40">
                              {p.category}
                            </span>
                          </td>

                          {/* Cost Price */}
                          <td className="py-3 px-5 text-right font-semibold text-slate-500">
                            {hidden ? "Rp ••••••" : `Rp ${p.costPrice.toLocaleString("id-ID")}`}
                          </td>

                          {/* Sell Price */}
                          <td className="py-3 px-5 text-right font-extrabold text-slate-900 text-[13px]">
                            {hidden ? "Rp ••••••" : `Rp ${p.sellPrice.toLocaleString("id-ID")}`}
                          </td>

                          {/* Margin Profit */}
                          <td className="py-3 px-5 text-right">
                            <div className="flex flex-col items-end">
                              <span className={cn(
                                "font-bold text-[11px] flex items-center gap-0.5",
                                profit >= 0 ? "text-emerald-600" : "text-rose-600"
                              )}>
                                <TrendingUp className="w-3 h-3" />
                                {hidden ? "Rp ••••••" : `${profit >= 0 ? "+" : ""}Rp ${profit.toLocaleString("id-ID")}`}
                              </span>
                              <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                                Margin {marginPercent}%
                              </span>
                            </div>
                          </td>

                          {/* Stock Status */}
                          <td className="py-3 px-5 text-center">
                            <div className="flex flex-col items-center justify-center gap-1">
                              <span className={cn(
                                "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold",
                                isLowStock 
                                  ? "bg-rose-50 text-rose-600 border border-rose-100 animate-pulse" 
                                  : "bg-slate-100 text-slate-600"
                              )}>
                                {p.isProcessed ? `${currentStock} Pcs (Virtual)` : `${p.stock} Pcs`}
                              </span>
                              {isLowStock && (
                                <span className="text-[8px] text-rose-500 font-bold flex items-center gap-0.5 uppercase tracking-wide">
                                  <AlertCircle className="w-2 h-2" /> Menipis
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button 
                                onClick={() => openEditProductModal(p)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer active:scale-90"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(p)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer active:scale-90"
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
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Package className="h-10 w-10 text-slate-400 mx-auto mb-2 stroke-[1.5]" />
                        <p className="text-xs font-semibold">Tidak ada produk yang cocok dengan pencarian.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Kategori Produk Tab with Premium Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 chart-reveal">
          {categoriesList.map((cat) => {
            const productCount = products.filter(p => p.category === cat.name).length;
            return (
              <div 
                key={cat.name} 
                className="group relative bg-white border border-slate-200/80 rounded-[22px] p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                {/* Delete button for category */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(cat.name);
                  }}
                  className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 border border-slate-200/60 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer z-20"
                  title="Hapus Kategori"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Shine effect overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-350 z-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                </div>
                
                <div className="relative z-10 space-y-4">
                  {/* Header of category card */}
                  <div className="flex items-center justify-between">
                    <div className={cn(
                      "w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-lg font-bold shadow-md shadow-slate-100 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300",
                      cat.color
                    )}>
                      <span className="drop-shadow-sm select-none">{cat.icon}</span>
                    </div>
                    
                    <div className="bg-slate-50 border border-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200 px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-colors">
                      {productCount} Produk
                    </div>
                  </div>

                  {/* Details */}
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
                      Kategori {cat.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-1">
                      {cat.desc}
                    </p>
                  </div>

                  {/* Actions inside card */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-[10px] font-bold text-slate-400 group-hover:text-blue-500 transition-colors">
                    <span 
                      onClick={() => {
                        setSelectedCategoryFilter(cat.name);
                        setActiveTab("ALL");
                      }}
                      className="flex items-center gap-1 hover:text-blue-700 cursor-pointer"
                    >
                      Lihat Daftar <ExternalLink className="w-3 h-3" />
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 duration-300" />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Category Card */}
          <div 
            onClick={openAddCategoryModal}
            className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-[22px] p-5 flex flex-col items-center justify-center text-center space-y-2.5 group cursor-pointer hover:bg-blue-50/20 transition-all duration-300 min-h-[180px]"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-600 flex items-center justify-center text-slate-500 transition-colors">
              <Plus className="w-5 h-5 transition-transform group-hover:rotate-95 duration-300" />
            </div>
            <div>
              <span className="block font-bold text-xs text-slate-700 group-hover:text-blue-600 transition-colors">Tambah Kategori Baru</span>
              <span className="block text-[10px] text-slate-500 font-semibold mt-0.5">Buat kelompok baru untuk barang dagangan Anda</span>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-[24px] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-300">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">
                  {editingProduct ? "Edit Detail Produk" : "Tambah Produk Baru"}
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  {editingProduct ? `Perbarui informasi untuk ID #${editingProduct.id}` : "Isi detail informasi untuk mendaftarkan barang baru"}
                </p>
              </div>
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg transition-colors border border-transparent hover:border-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProduct} className="p-5 overflow-y-auto space-y-4 text-left flex-1">
              {/* Nama Produk */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Nama Produk</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kopi Kapal Api 165g"
                  value={productForm.name}
                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                />
              </div>

              {/* Barcode/SKU & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">SKU / Barcode (Opsional)</label>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Scan / Ketik Kode"
                      value={productForm.sku}
                      onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-3.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Kategori</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => {
                      if (e.target.value === "ADD_NEW") {
                        openAddCategoryModal();
                      } else {
                        setProductForm(prev => ({ ...prev, category: e.target.value }));
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-600 font-semibold focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm cursor-pointer"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                    <option value="ADD_NEW">+ Buat Kategori Baru...</option>
                  </select>
                </div>
              </div>

              {/* Harga Modal, Harga Jual, Stok */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Harga Modal (Rp)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={productForm.costPrice || ""}
                    onChange={(e) => setProductForm(prev => ({ ...prev, costPrice: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={productForm.sellPrice || ""}
                    onChange={(e) => setProductForm(prev => ({ ...prev, sellPrice: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                  />
                </div>

                {!productForm.isProcessed ? (
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Stok Awal</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={productForm.stock}
                      onChange={(e) => setProductForm(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Stok Awal</label>
                    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 font-semibold shadow-inner select-none h-[42px] flex items-center">
                      Stok Virtual (BOM)
                    </div>
                  </div>
                )}
              </div>

              {/* Profit Warning */}
              {productForm.sellPrice > 0 && productForm.sellPrice < productForm.costPrice && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-[10px] font-bold">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Peringatan: Harga jual lebih rendah dari harga modal (Rugi).</span>
                </div>
              )}

              {/* Metode Produksi / Olahan Checkbox */}
              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-700">Produk Siap Saji / Olahan</span>
                    <span className="text-[9px] text-slate-400 font-semibold leading-relaxed">Aktifkan sistem resep (BOM) jika produk ini diracik dari bahan baku sachet/mentah</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={productForm.isProcessed}
                      onChange={(e) => {
                        const nextVal = e.target.checked;
                        setProductForm(prev => ({ 
                          ...prev, 
                          isProcessed: nextVal,
                          stock: nextVal ? 0 : prev.stock
                        }));
                      }}
                    />
                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Recipe Builder UI */}
                {productForm.isProcessed && (
                  <div className="pt-3.5 border-t border-slate-200/70 space-y-3.5">
                    <span className="block text-[10px] text-slate-450 font-extrabold tracking-wider uppercase">Penyusunan Resep (Bahan Baku)</span>
                    
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <select
                          value={selectedRecipeIngredientId}
                          onChange={(e) => setSelectedRecipeIngredientId(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-600 font-semibold focus:outline-none focus:border-blue-600 shadow-sm cursor-pointer"
                        >
                          <option value="">-- Pilih Bahan Baku --</option>
                          {products.filter(p => !p.isProcessed && p.id !== editingProduct?.id).map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Stok: {p.stock})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="w-20">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={selectedRecipeIngredientQty}
                          onChange={(e) => setSelectedRecipeIngredientQty(parseInt(e.target.value) || 1)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-600 text-center shadow-sm"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleAddRecipeIngredient}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer active:scale-95 transition-all"
                      >
                        Tambah
                      </button>
                    </div>

                    {/* Ingredient List */}
                    {productForm.recipe && productForm.recipe.length > 0 ? (
                      <div className="bg-white border border-slate-200/80 rounded-xl divide-y divide-slate-100 overflow-hidden shadow-sm max-h-32 overflow-y-auto">
                        {productForm.recipe.map((ingredient) => {
                          const ingProd = products.find(p => p.id === ingredient.productId);
                          return (
                            <div key={ingredient.productId} className="flex items-center justify-between p-3 text-xs">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-slate-800">{ingProd ? ingProd.name : `Bahan ID ${ingredient.productId}`}</span>
                                <span className="text-[10px] text-slate-400 font-semibold">Kebutuhan: {ingredient.quantity} Pcs</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveRecipeIngredient(ingredient.productId)}
                                className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors border border-transparent hover:border-rose-100 cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-5 bg-white/40 border border-dashed border-slate-200 rounded-xl">
                        <span className="text-[10px] text-slate-400 font-bold">Resep masih kosong. Silakan pilih dan tambah bahan baku.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Gambar Produk - Base64 Upload */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Foto Produk</label>
                <div className="space-y-3">
                  {productForm.imageUrl ? (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                      <img src={productForm.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setProductForm(prev => ({ ...prev, imageUrl: "" }))}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 transition-colors shadow-sm cursor-pointer text-[10px] font-bold"
                      >
                        Hapus Gambar
                      </button>
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-1.5 transition-colors duration-200 relative group bg-slate-50/30">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={isUploading}
                      />
                      {isUploading ? (
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs font-bold text-slate-500">Mengupload ke Supabase...</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors duration-200" />
                          <div>
                            <span className="block text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors duration-200">
                              Pilih File Gambar
                            </span>
                            <span className="block text-[9px] text-slate-400 font-semibold mt-0.5">
                              Format PNG, JPG (Maks. 2MB)
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 hover:border-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  disabled={isUploading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95 disabled:cursor-not-allowed"
                >
                  {isUploading ? "Mengupload..." : "Simpan Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-[24px] shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-300">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">Tambah Kategori Baru</h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Buat kelompok baru untuk barang dagangan Anda</p>
              </div>
              <button 
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg transition-colors border border-transparent hover:border-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveCategory} className="p-5 space-y-4 text-left overflow-y-auto">
              {/* Nama Kategori */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Nama Kategori</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Snack / Makanan Ringan"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                />
              </div>

              {/* Deskripsi */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Deskripsi (Opsional)</label>
                <textarea
                  placeholder="Deskripsi singkat mengenai kelompok produk ini..."
                  value={categoryForm.desc}
                  rows={2}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, desc: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm resize-none"
                />
              </div>

              {/* Preset Icon Emoji */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Pilih Emoji Ikon</label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  {EMOJI_PRESETS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setCategoryForm(prev => ({ ...prev, icon: emoji }))}
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border hover:bg-white hover:border-slate-400 transition-all cursor-pointer active:scale-90",
                        categoryForm.icon === emoji 
                          ? "bg-white border-blue-500 ring-2 ring-blue-100 text-base" 
                          : "border-transparent text-slate-500"
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preset Warna Gradasi */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Pilih Gradasi Warna</label>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_PRESETS.map((colorObj) => (
                    <button
                      key={colorObj.value}
                      type="button"
                      onClick={() => setCategoryForm(prev => ({ ...prev, color: colorObj.value }))}
                      className={cn(
                        "h-10 rounded-xl bg-gradient-to-br border flex items-center justify-center transition-all cursor-pointer active:scale-95",
                        categoryForm.color === colorObj.value 
                          ? "border-slate-800 ring-2 ring-slate-200 scale-105" 
                          : "border-transparent opacity-85 hover:opacity-100"
                      )}
                      title={colorObj.label}
                    >
                      <div className={cn("w-6 h-6 rounded-lg bg-gradient-to-br shadow-inner flex items-center justify-center text-white text-[10px] font-bold", colorObj.value)}>
                        {categoryForm.icon}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 hover:border-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
                >
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

