"use server";

import { Product } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";
import { handleSupabaseError } from "@/utils/supabase/utils";
import { cache } from "react";

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
