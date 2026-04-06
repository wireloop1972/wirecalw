import { createClient } from "@supabase/supabase-js";

export const createSupabaseAdminClient = () =>
  createClient(
    process.env.NEVLUNGHAVN_SUPABASE_URL!,
    process.env.NEVLUNGHAVN_SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
