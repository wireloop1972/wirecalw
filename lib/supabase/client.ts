import { createBrowserClient } from "@supabase/ssr";

export const createSupabaseBrowserClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_NEVLUNGHAVN_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_NEVLUNGHAVN_SUPABASE_ANON_KEY!,
  );
