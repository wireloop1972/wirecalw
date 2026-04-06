"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useUser } from "@/lib/supabase/user-context";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Invite {
  id: string;
  email: string;
  role: string;
  title: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

const AdminInvitesPage = () => {
  const user = useUser();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadInvites = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("invites")
      .select("id, email, role, title, expires_at, accepted_at, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setInvites(data);
  }, []);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  if (user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-wl-black px-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-wl-text">
            Ingen tilgang
          </h1>
          <p className="mt-2 text-sm text-wl-muted">
            Du har ikke tilgang til denne siden.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          role,
          title: title.trim() || undefined,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Feil ved sending av invitasjon");
      } else {
        setMessage(`Invitasjon sendt til ${email}`);
        setEmail("");
        setTitle("");
        setRole("member");
        loadInvites();
      }
    } catch {
      setError("Noe gikk galt");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-wl-black px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-wl-text">Invitasjoner</h1>
        <p className="mt-1 text-sm text-wl-muted">
          Send invitasjoner til nye brukere. Kun inviterte kan registrere seg.
        </p>

        <div className="mt-8 rounded-lg border border-wl-border bg-wl-surface p-5">
          {error && <div className="gjest-auth-error">{error}</div>}
          {message && (
            <div className="mb-4 rounded border border-emerald-700/30 bg-emerald-900/10 px-3 py-2 text-sm text-emerald-400">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="inv-email"
                className="mb-1 block text-xs font-semibold uppercase tracking-wider text-wl-muted"
              >
                E-post
              </label>
              <input
                id="inv-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="bruker@epost.no"
                className="w-full rounded border border-wl-border bg-wl-raised px-3 py-2 text-sm text-wl-text placeholder:text-wl-muted/50 focus:border-wl-orange focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="inv-role"
                  className="mb-1 block text-xs font-semibold uppercase tracking-wider text-wl-muted"
                >
                  Rolle
                </label>
                <select
                  id="inv-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={loading}
                  className="w-full rounded border border-wl-border bg-wl-raised px-3 py-2 text-sm text-wl-text focus:border-wl-orange focus:outline-none"
                >
                  <option value="member">Medlem</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="inv-title"
                  className="mb-1 block text-xs font-semibold uppercase tracking-wider text-wl-muted"
                >
                  Tittel (valgfritt)
                </label>
                <input
                  id="inv-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading}
                  placeholder="F.eks. Daglig leder"
                  className="w-full rounded border border-wl-border bg-wl-raised px-3 py-2 text-sm text-wl-text placeholder:text-wl-muted/50 focus:border-wl-orange focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-wl-orange px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-wl-orange-light disabled:opacity-40"
            >
              {loading ? "Sender ..." : "Send invitasjon"}
            </button>
          </form>
        </div>

        <div className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-wl-text">
            Sendte invitasjoner
          </h2>
          {invites.length === 0 ? (
            <p className="text-sm text-wl-muted">Ingen invitasjoner ennå.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-wl-border">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-wl-border bg-wl-surface text-xs uppercase tracking-wider text-wl-muted">
                  <tr>
                    <th className="px-4 py-2.5">E-post</th>
                    <th className="px-4 py-2.5">Rolle</th>
                    <th className="px-4 py-2.5">Utløper</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-wl-border">
                  {invites.map((inv) => {
                    const expired =
                      !inv.accepted_at &&
                      new Date(inv.expires_at) < new Date();
                    return (
                      <tr
                        key={inv.id}
                        className="bg-wl-raised/50 text-wl-text"
                      >
                        <td className="px-4 py-2">{inv.email}</td>
                        <td className="px-4 py-2 capitalize">{inv.role}</td>
                        <td className="px-4 py-2">{fmt(inv.expires_at)}</td>
                        <td className="px-4 py-2">
                          {inv.accepted_at ? (
                            <span className="text-emerald-400">Akseptert</span>
                          ) : expired ? (
                            <span className="text-wl-muted">Utløpt</span>
                          ) : (
                            <span className="text-wl-orange">Venter</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8">
          <a
            href="/app"
            className="text-sm text-wl-muted transition-colors hover:text-wl-orange"
          >
            &larr; Tilbake til assistenter
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminInvitesPage;
