import Link from "next/link";
import { personas, type Persona } from "@/lib/personas";

const avatarColors: Record<string, string> = {
  poe: "bg-amber-800 text-amber-50",
  claude: "bg-indigo-700 text-indigo-50 dark:bg-indigo-600",
  chrissie: "bg-emerald-700 text-emerald-50 dark:bg-emerald-600",
};

const AssistantCard = ({ persona }: { persona: Persona }) => {
  const initials = persona.name.slice(0, persona.name === "Chrissie" ? 2 : 1);
  const colorClass = avatarColors[persona.id] ?? "bg-zinc-700 text-zinc-50";

  return (
    <Link
      href={persona.href}
      className={`group flex flex-col rounded-2xl border border-zinc-200 p-6
        transition-all hover:border-zinc-300 hover:shadow-md
        dark:border-zinc-800 dark:hover:border-zinc-700 ${
          !persona.available ? "opacity-60" : ""
        }`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full
          text-lg font-semibold ${colorClass}`}
      >
        {initials}
      </div>
      <h2
        className="mt-4 text-lg font-semibold text-zinc-900
          group-hover:text-zinc-700 dark:text-zinc-50
          dark:group-hover:text-zinc-200"
      >
        {persona.name}
      </h2>
      <p className="mt-1 text-sm font-medium text-zinc-500">
        {persona.tagline}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        {persona.description}
      </p>
      {!persona.available && (
        <span
          className="mt-4 inline-block self-start rounded-full bg-zinc-100 px-3
            py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-800
            dark:text-zinc-400"
        >
          Coming soon
        </span>
      )}
    </Link>
  );
};

const HomePage = () => {
  return (
    <div
      className="flex min-h-screen flex-col items-center bg-white px-6 py-20
        dark:bg-zinc-950"
    >
      <h1
        className="text-3xl font-bold tracking-tight text-zinc-900
          dark:text-zinc-50"
      >
        wireclaw
      </h1>
      <p className="mt-2 text-zinc-500">
        Wire Loop Labs &mdash; AI Assistants
      </p>
      <div className="mt-12 grid w-full max-w-3xl gap-6 sm:grid-cols-3">
        {personas.map((p) => (
          <AssistantCard key={p.id} persona={p} />
        ))}
      </div>
    </div>
  );
};

export default HomePage;
