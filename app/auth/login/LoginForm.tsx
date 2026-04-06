"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const ENABLE_SMS_2FA = false;

export const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Innlogging feilet. Prøv igjen.");
        setLoading(false);
        return;
      }

      if (ENABLE_SMS_2FA) {
        const { data: profile } = await supabase
          .from("users")
          .select("phone_number")
          .eq("id", user.id)
          .single();

        if (profile?.phone_number) {
          const { error: otpError } = await supabase.auth.signInWithOtp({
            phone: profile.phone_number,
          });
          if (otpError) {
            setError(otpError.message);
            setLoading(false);
            return;
          }
          router.push("/auth/2fa");
          return;
        }
      }

      const next = searchParams.get("next") ?? "/app";
      router.push(next);
      router.refresh();
    } catch {
      setError("Noe gikk galt. Prøv igjen.");
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="gjest-auth-heading">Velkommen</h1>
      <p className="gjest-auth-subheading">
        Logg inn for å fortsette
      </p>

      {error && <div className="gjest-auth-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="gjest-auth-field">
          <label htmlFor="email" className="gjest-auth-label">
            E-post
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="din@epost.no"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="gjest-auth-input"
          />
        </div>

        <div className="gjest-auth-field">
          <label htmlFor="password" className="gjest-auth-label">
            Passord
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Skriv inn passord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="gjest-auth-input"
          />
        </div>

        <button type="submit" disabled={loading} className="gjest-auth-btn">
          {loading ? "Logger inn ..." : "Logg inn"}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-[var(--gjest-ink-muted)]">
        Kun inviterte brukere kan registrere seg.
      </p>
    </>
  );
};
