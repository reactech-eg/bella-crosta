import { PostgrestError } from "@supabase/supabase-js";

export function handleSupabaseError(
  context: string,
  error: PostgrestError,
  status: number,
) {
  // You could integrate Sentry or Axiom here
  console.error(`[${context}] Status ${status}:`, {
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}
