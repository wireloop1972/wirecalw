import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UserProvider, type UserProfile } from "@/lib/supabase/user-context";

const AppLayout = async ({ children }: { children: React.ReactNode }) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: dbUser } = await supabase
    .from("users")
    .select("id, email, role, title, phone_number")
    .eq("id", user.id)
    .single();

  const profile: UserProfile = {
    id: user.id,
    email: user.email ?? dbUser?.email ?? "",
    role: dbUser?.role === "admin" ? "admin" : "member",
    title: dbUser?.title ?? null,
    phoneNumber: dbUser?.phone_number ?? null,
  };

  return <UserProvider profile={profile}>{children}</UserProvider>;
};

export default AppLayout;
