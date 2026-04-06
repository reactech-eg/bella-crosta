"use server";

import { Product } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";
import { handleSupabaseError } from "@/utils/supabase/utils";
import { cache } from "react";

export const getProducts = cache(async (): Promise<Product[]> => {
  const supabase = await createClient();

  const { data, error, status } = await supabase
    .from("products")
    .select("*")
    .eq("is_available", true)
    .order("created_at", { ascending: false });

  if (error) {
    handleSupabaseError("getProducts", error, status);
    return [];
  }

  return data || [];
});

export const getFeaturedProducts = cache(async (): Promise<Product[]> => {
  const supabase = await createClient();

  const { data, error, status } = await supabase
    .from("products")
    .select("*")
    .eq("is_featured", true)
    .eq("is_available", true)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    handleSupabaseError("getFeaturedProducts", error, status);
    return [];
  }

  return data || [];
});

export const getProductsByCategory = cache(
  async (category: string): Promise<Product[]> => {
    const supabase = await createClient();
    const { data, error, status } = await supabase
      .from("products")
      .select("*")
      .eq("category", category)
      .eq("is_available", true)
      .order("created_at", { ascending: false });
    if (error) {
      handleSupabaseError("getProductsByCategory", error, status);
      return [];
    }
    return data ?? [];
  },
);

export const getProductById = cache(
  async (id: string): Promise<Product | null> => {
    const supabase = await createClient();
    const { data, error, status } = await supabase
      .from("products")
      .select(`*, product_ingredients(*, raw_materials(*))`)
      .eq("id", id)
      .single();
    if (error) {
      handleSupabaseError("getProductById:", error, status);
      return null;
    }
    return data;
  },
);

export const getAllProducts = cache(async (): Promise<Product[]> => {
  // Admin: get ALL products including unavailable ones
  const supabase = await createClient();
  const { data, error, status } = await supabase
    .from("products")
    .select(`*, product_ingredients(*, raw_materials(*))`)
    .order("created_at", { ascending: false });
  if (error) {
    handleSupabaseError("getAllProducts", error, status);
    return [];
  }
  return data ?? [];
});
