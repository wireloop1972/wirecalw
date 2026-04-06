import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEVLUNGHAVN_SUPABASE_URL!,
    process.env.NEVLUNGHAVN_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll can throw when called from a Server Component (read-only
            // headers). The middleware will pick up the refreshed session
            // cookie instead.
          }
        },
      },
    },
  );
};
