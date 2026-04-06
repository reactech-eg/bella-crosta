import { Suspense } from "react";
import MenuClient from "./client";
import { getProducts } from "@/app/actions/products";
import ProductCardSkeleton from "@/components/products/product-card-skeleton";

export default async function MenuPage() {
  const products = await getProducts();

  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      }
    >
      <MenuClient products={products} />
    </Suspense>
  );
}
