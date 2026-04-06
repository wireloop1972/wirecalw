"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const TwoFactorPage = () => {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadPhone = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth/login");
        return;
      }
      const { data: profile } = await supabase
        .from("users")
        .select("phone_number")
        .eq("id", user.id)
        .single();
      setPhone(profile?.phone_number ?? null);
    };
    loadPhone();
    inputRef.current?.focus();
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!phone || code.length !== 6) return;
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone,
        token: code,
        type: "sms",
      });

      if (verifyError) {
        setError(verifyError.message);
        setLoading(false);
        return;
      }

      router.push("/app");
      router.refresh();
    } catch {
      setError("Verifisering feilet. Prøv igjen.");
      setLoading(false);
    }
  };

  const maskedPhone = phone
    ? phone.slice(0, 4) + " *** " + phone.slice(-2)
    : "...";

  return (
    <>
      <h1 className="gjest-auth-heading">Verifisering</h1>
      <p className="gjest-auth-subheading">
        Skriv inn den 6-sifrede koden sendt til {maskedPhone}
      </p>

      {error && <div className="gjest-auth-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="gjest-auth-field">
          <label htmlFor="otp-code" className="gjest-auth-label">
            Engangskode
          </label>
          <input
            ref={inputRef}
            id="otp-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoComplete="one-time-code"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            disabled={loading}
            className="gjest-auth-input text-center text-2xl tracking-[0.3em]"
          />
        </div>

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="gjest-auth-btn"
        >
          {loading ? "Verifiserer ..." : "Bekreft"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-[var(--gjest-ink-muted)]">
        Mottar du ikke koden? Sjekk at telefonnummeret er riktig, eller kontakt
        administrasjonen.
      </p>
    </>
  );
};

export default TwoFactorPage;
