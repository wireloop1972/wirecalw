import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const RootPage = async () => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  redirect(user ? "/app" : "/auth/login");
};

export default RootPage;
