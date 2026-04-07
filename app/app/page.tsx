import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { personas, type Persona } from "@/lib/personas";

const avatarConfig: Record<string, { image: string; ring: string }> = {
  poe: { image: "/images/poe.png", ring: "ring-wl-orange/60" },
  claude: { image: "/images/claude.png", ring: "ring-indigo-500/60" },
  chrissie: { image: "/images/Chrissie.png", ring: "ring-emerald-500/60" },
};

const AssistantCard = ({ persona }: { persona: Persona }) => {
  const config = avatarConfig[persona.id];

  return (
    <Link
      href={persona.href}
      className={`group relative flex flex-col rounded-xl border border-wl-border
        bg-wl-surface p-6 transition-all duration-200
        ${persona.available
          ? "hover:border-wl-orange/40 hover:bg-wl-raised"
          : "pointer-events-none opacity-40"
        }`}
    >
      <div
        className={`h-14 w-14 overflow-hidden rounded-full ring-2 ${
          config?.ring ?? "ring-wl-border"
        }`}
      >
        {config ? (
          <Image
            src={config.image}
            alt={persona.name}
            width={56}
            height={56}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-wl-raised text-wl-muted">
            ?
          </div>
        )}
      </div>

      <h2 className="mt-5 text-xl font-semibold text-wl-text">
        {persona.name}
      </h2>
      <p className="mt-1 text-sm text-wl-orange-light">
        {persona.tagline}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-wl-muted">
        {persona.description}
      </p>

      {persona.available ? (
        <span
          className="mt-5 inline-flex items-center gap-1.5 self-start text-xs
            font-medium text-wl-orange transition-colors
            group-hover:text-wl-orange-light"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-wl-orange" />
          Online
        </span>
      ) : (
        <span
          className="mt-5 inline-block self-start rounded-full border border-wl-border
            px-3 py-1 text-xs text-wl-muted"
        >
          Coming soon
        </span>
      )}
    </Link>
  );
};

const AssistantHubContent = () => (
  <div className="flex min-h-screen flex-col items-center bg-wl-black px-6 py-20">
    <div className="flex items-center gap-3">
      <div className="h-px w-8 bg-wl-orange" />
      <span className="text-xs font-bold uppercase tracking-[0.25em] text-wl-orange">
        Wire Loop Labs
      </span>
      <div className="h-px w-8 bg-wl-orange" />
    </div>

    <h1 className="mt-4 text-4xl font-bold tracking-tight text-wl-text">
      AI Assistants
    </h1>
    <p className="mt-3 max-w-md text-center text-sm leading-relaxed text-wl-muted">
      Your personal team of AI-powered assistants, each with their own
      personality and expertise.
    </p>

    <div className="mt-14 grid w-full max-w-3xl gap-5 sm:grid-cols-3">
      {personas.map((p) => (
        <AssistantCard key={p.id} persona={p} />
      ))}
    </div>

    <div className="mt-16 text-xs text-wl-muted/50">
      Powered by OpenClaw &middot; Wire Loop Labs
    </div>
  </div>
);

const DashboardPage = async () => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }
  const { data: row } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (row?.role !== "admin") {
    redirect("/app/poe");
  }
  return <AssistantHubContent />;
};

export default DashboardPage;
