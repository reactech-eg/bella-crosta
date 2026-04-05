import MenuClient from "./client";
import { getProducts } from "@/app/actions/products";

export default async function MenuPage() {
  const products = await getProducts();

  return <MenuClient initialProducts={products} />;
}
