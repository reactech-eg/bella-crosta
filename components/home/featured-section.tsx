// components/sections/featured-section.tsx
import { Suspense } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { getFeaturedProducts } from "@/app/actions/products";
import ProductCard from "../product-card";
import ProductCardSkeleton from "../products/product-card-skeleton";

export default function FeaturedSection() {
  return (
    <section
      id="featured"
      className="relative py-20 bg-background overflow-hidden"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-linear-to-r from-transparent via-border to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold tracking-wider uppercase text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Chef&apos;s Choice</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Featured Pizzas
            </h2>
            <p className="text-muted-foreground max-w-md">
              Our most-loved signatures, prepared daily with imported
              ingredients.
            </p>
          </div>

          <Link
            href="/menu"
            className="hidden md:flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors border-b-2 border-primary/20 pb-1"
          >
            View Full Menu
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Suspense boundary handles the loading state */}
        <Suspense fallback={<FeaturedGridSkeleton />}>
          <FeaturedGridContent />
        </Suspense>
      </div>
    </section>
  );
}

async function FeaturedGridContent() {
  const featured = await getFeaturedProducts();

  if (!featured || featured.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
      {featured.map((product) => (
        <div
          key={product.id}
          className="transform transition-all duration-300 hover:-translate-y-2"
        >
          <ProductCard {...product} />
        </div>
      ))}
    </div>
  );
}

function FeaturedGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
      {[...Array(3)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
