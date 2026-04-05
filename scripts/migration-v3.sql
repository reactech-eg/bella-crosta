-- ============================================================
-- Bella Crosta — Migration V3
-- Authentication & Customer Profile Auto-creation Trigger
-- ============================================================

-- Function to handle newly created users (from email/password, OAuth, etc.)
-- and automatically insert them into public.customers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.customers (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    -- Try to grab full name from user_metadata (useful for OAuth or Supabase standard signup metadata)
    COALESCE(
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name', 
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Map the function to a trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- That's it! Supabase will now auto-create customer records reliably.
