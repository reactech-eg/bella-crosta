"use client";

import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/header";
import ProductCard from "@/components/product-card";
import ProductCardSkeleton from "@/components/products/product-card-skeleton";
import { useAppStore } from "@/store/app-store";
import { Search, X, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Product } from "@/lib/types";

interface MenuClientProps {
  initialProducts: Product[];
}

const ITEMS_PER_PAGE = 9;

export default function MenuClient({ initialProducts }: MenuClientProps) {
  const { products, loadingProducts, setProducts, fetchProducts } =
    useAppStore();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Set initial products from server or fetch on client
  useEffect(() => {
    const timer = setTimeout(() => {
      if (initialProducts.length > 0 && products.length === 0) {
        setProducts(initialProducts);
      } else if (initialProducts.length === 0 && products.length === 0) {
        fetchProducts();
      }
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Use initialProducts synchronously to avoid hydration delays/loading screens
  const displayProducts = products.length > 0 ? products : initialProducts;

  // If no products available at all and we are fetching, it's loading
  const loading =
    loadingProducts ||
    (displayProducts.length === 0 && initialProducts.length === 0);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(displayProducts.map((p) => p.category)));
    return ["all", ...unique.sort()];
  }, [displayProducts]);

  const filtered = useMemo(() => {
    return displayProducts.filter((p) => {
      const matchesCategory =
        selectedCategory === "all" || p.category === selectedCategory;
      const matchesSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [displayProducts, selectedCategory, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset page immediately!
  };
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1); // Reset page immediately!
  };
  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setCurrentPage(1); // Reset page here too!
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
              Our <span className="text-primary italic">Menu</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Freshly prepared Italian classics for every craving.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search for a pizza..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-10 py-3 bg-muted/50 border-border rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearch("");
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-muted-foreground hover:bg-muted p-0"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Category Bar - Sticky on Desktop */}
        <div className="sticky top-18.25 z-30 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 mb-8 border-b border-border/40">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar mask-fade-right">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                onClick={() => handleCategoryChange(cat)}
                className={cn(
                  "rounded-full font-bold whitespace-nowrap capitalize transition-all px-5 h-10",
                  selectedCategory === cat
                    ? ""
                    : "text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {cat === "all" ? "View All" : cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Results Info */}
        {!loading && (
          <div className="mb-6 text-sm text-muted-foreground font-medium italic">
            Showing {paginated.length} of {filtered.length} items
          </div>
        )}

        {/* Main Grid Area */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-32 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
              <UtensilsCrossed className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-bold mb-2">No matches found</h3>
            <p className="text-muted-foreground max-w-xs mb-8">
              We couldn&apos;t find anything matching your current filters. Try
              adjusting your search or category.
            </p>
            <Button
              size="lg"
              onClick={resetFilters}
              className="rounded-xl font-bold bg-foreground text-background hover:bg-foreground/90 h-12 px-6"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginated.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="px-4 py-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
