"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart-store";
import { ShoppingCart, Plus, Minus, Check, Info } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils"; // Assuming you have a cn helper for tailwind classes
import { Button } from "@/components/ui/button";
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
  const cartItem = useCartStore((state) =>
    state.items.find((item) => item.productId === id),
  );
  const cartQuantity = cartItem?.quantity || 0;
  const remainingStock = Math.max(0, stock_qty - cartQuantity);

  const [quantity, setQuantity] = useState(1);
  const [isAnimate, setIsAnimate] = useState(false);
  const [added, setAdded] = useState(false);

  const isOutOfStock = !is_available || stock_qty === 0;
  const isLowStock = !isOutOfStock && stock_qty <= 10;

  const handleAdd = () => {
    if (remainingStock === 0) return;
    
    const finalQuantity = Math.min(quantity, remainingStock);

    setIsAnimate(true);
    addItem({
      productId: id,
      name,
      price,
      quantity: finalQuantity,
      image_url: image_url ?? undefined,
    });
    setAdded(true);
    setQuantity(1);

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
              <span className="px-2 py-1 bg-orange-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                LOW STOCK
              </span>
            )}
          </div>

          <div className="flex justify-end">
            <span className="px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-bold shadow-lg">
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
          <div className="flex items-center justify-center gap-2 w-full py-3 bg-muted/50 text-muted-foreground rounded-full text-sm font-bold border border-dashed border-border">
            <Info className="w-4 h-4" />
            Sold Out
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              {/* Quantity Toggle */}
              <div className="flex items-center bg-secondary/50 rounded-full p-1 border border-border/50">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="h-7 w-7"
                  disabled={remainingStock === 0}
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </Button>
                <span className="w-8 text-center text-sm font-bold">
                  {remainingStock === 0 ? 0 : quantity > remainingStock ? remainingStock : quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity((q) => Math.min(remainingStock, q + 1))}
                  className="h-7 w-7"
                  disabled={remainingStock === 0 || quantity >= remainingStock}
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Add Button */}
              <Button
                onClick={handleAdd}
                disabled={isAnimate || remainingStock === 0 || quantity > remainingStock}
                className={cn(
                  "flex-1 h-11 text-sm font-bold transition-all duration-300 ",
                  added ? "bg-green-500 text-white" : "",
                )}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4 stroke-3" />
                    <span>Added!</span>
                  </>
                ) : remainingStock === 0 ? (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Limit Reached</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </>
                )}
              </Button>
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
