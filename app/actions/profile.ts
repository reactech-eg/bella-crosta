"use server";

import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Customer } from "@/lib/types";
import { cache } from "react";

// ─── Get Profile ──────────────────────────────────────────────────────────────

export const getProfile = cache(
  async (): Promise<{
    customer: Customer;
  } | null> => {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("[profile] getProfile error:", error.message);
      return null;
    }

    return { customer: data as Customer };
  },
);

// ─── Update Profile ───────────────────────────────────────────────────────────

export type UpdateProfileInput = {
  full_name: string;
  phone: string;
  alt_phone: string;
  address: string;
};

export async function updateProfile(
  input: UpdateProfileInput,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Not authenticated." };

    const supabase = await createClient();
    const { error } = await supabase
      .from("customers")
      .update({
        full_name: input.full_name.trim() || null,
        phone: input.phone.trim() || null,
        alt_phone: input.alt_phone.trim() || null,
        address: input.address.trim() || null,
      })
      .eq("id", user.id);

    if (error) {
      console.error("[profile] updateProfile error:", error.message);
      return {
        success: false,
        error: "Failed to update profile. Please try again.",
      };
    }

    revalidatePath("/profile");
    return { success: true };
  } catch (e) {
    console.error("[profile] updateProfile unexpected error:", e);
    return { success: false, error: "Something went wrong." };
  }
}
