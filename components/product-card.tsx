"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart-store";
import { ShoppingCart, Plus, Minus, Check, Info } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils"; // Assuming you have a cn helper for tailwind classes

interface ProductCardProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  is_available: boolean;
  stock_qty: number;
}

export default function ProductCard({
  id,
  name,
  description,
  price,
  image_url,
  is_available,
  stock_qty,
  category,
}: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [isAnimate, setIsAnimate] = useState(false);
  const [added, setAdded] = useState(false);

  const isOutOfStock = !is_available || stock_qty === 0;
  const isLowStock = !isOutOfStock && stock_qty <= 10;

  const handleAdd = () => {
    setIsAnimate(true);
    addItem({
      productId: id,
      name,
      price,
      quantity,
      image_url: image_url ?? undefined,
    });
    setAdded(true);

    // Reset states
    setTimeout(() => {
      setAdded(false);
      setIsAnimate(false);
    }, 1500);
  };

  return (
    <div className="group relative bg-card border border-border/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20">
      {/* Image Container */}
      <div className="relative aspect-4/3 overflow-hidden bg-muted">
        {image_url ? (
          <Image
            src={image_url}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/30">
            <span className="text-5xl mb-2">🍕</span>
            <span className="text-xs font-medium text-muted-foreground">
              No image available
            </span>
          </div>
        )}

        {/* Overlay Badges */}
        <div className="absolute inset-0 p-3 flex flex-col justify-between pointer-events-none">
          <div className="flex justify-between items-start">
            <span className="px-3 py-1 bg-background/80 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider text-foreground shadow-sm">
              {category}
            </span>
            {isLowStock && (
              <span className="px-2 py-1 bg-orange-500 text-white text-[10px] font-bold rounded-md animate-pulse">
                LOW STOCK
              </span>
            )}
          </div>

          <div className="flex justify-end">
            <span className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold shadow-lg">
              ${Number(price).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-4">
          <h3 className="font-bold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
            {name}
          </h3>
          {description && (
            <p className="text-muted-foreground text-sm line-clamp-2 min-h-10 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {isOutOfStock ? (
          <div className="flex items-center justify-center gap-2 w-full py-3 bg-muted/50 text-muted-foreground rounded-xl text-sm font-bold border border-dashed border-border">
            <Info className="w-4 h-4" />
            Sold Out
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              {/* Quantity Toggle */}
              <div className="flex items-center bg-secondary/50 rounded-xl p-1 border border-border/50">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-1.5 rounded-lg hover:bg-background hover:shadow-sm transition-all active:scale-90"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-bold">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(stock_qty, q + 1))}
                  className="p-1.5 rounded-lg hover:bg-background hover:shadow-sm transition-all active:scale-90"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add Button */}
              <button
                onClick={handleAdd}
                disabled={isAnimate}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 active:scale-95 shadow-md",
                  added
                    ? "bg-green-500 text-white shadow-green-200"
                    : "bg-primary text-primary-foreground hover:shadow-primary/30 hover:brightness-110",
                )}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4 stroke-3" />
                    <span>Added!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>
            </div>

            {isLowStock && (
              <p className="text-[11px] text-center font-semibold text-orange-600 uppercase tracking-tight">
                Hurry! Only {stock_qty} items left in stock
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
