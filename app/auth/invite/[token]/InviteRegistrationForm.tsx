"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const ENABLE_SMS_2FA = false;

interface InviteRegistrationFormProps {
  token: string;
  email: string;
  inviteRole: string;
  inviteTitle: string | null;
}

export const InviteRegistrationForm = ({
  token,
  email,
  inviteRole,
  inviteTitle,
}: InviteRegistrationFormProps) => {
  const router = useRouter();
  const [title, setTitle] = useState(inviteTitle ?? "");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          phone: phone || undefined,
        });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      const userId = signUpData.user?.id;
      if (!userId) {
        setError("Registrering feilet. Prøv igjen.");
        setLoading(false);
        return;
      }

      await supabase
        .from("users")
        .update({
          role: inviteRole,
          title: title || null,
          phone_number: phone || null,
        })
        .eq("id", userId);

      await supabase
        .from("invites")
        .update({ accepted_at: new Date().toISOString() })
        .eq("token", token);

      if (ENABLE_SMS_2FA && phone) {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          phone,
        });
        if (!otpError) {
          router.push("/auth/2fa");
          return;
        }
      }

      router.push("/app");
      router.refresh();
    } catch {
      setError("Noe gikk galt. Prøv igjen.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="gjest-auth-error">{error}</div>}

      <div className="gjest-auth-field">
        <label htmlFor="invite-email" className="gjest-auth-label">
          E-post
        </label>
        <input
          id="invite-email"
          type="email"
          value={email}
          readOnly
          className="gjest-auth-input"
        />
      </div>

      <div className="gjest-auth-field">
        <label htmlFor="invite-title" className="gjest-auth-label">
          Navn / tittel
        </label>
        <input
          id="invite-title"
          type="text"
          placeholder="F.eks. Daglig leder"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
          className="gjest-auth-input"
        />
      </div>

      <div className="gjest-auth-field">
        <label htmlFor="invite-phone" className="gjest-auth-label">
          Telefonnummer (med landskode)
        </label>
        <input
          id="invite-phone"
          type="tel"
          placeholder="+47 900 00 000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={loading}
          className="gjest-auth-input"
        />
      </div>

      <div className="gjest-auth-field">
        <label htmlFor="invite-password" className="gjest-auth-label">
          Passord
        </label>
        <input
          id="invite-password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Velg et sterkt passord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          className="gjest-auth-input"
        />
      </div>

      <button type="submit" disabled={loading} className="gjest-auth-btn">
        {loading ? "Registrerer ..." : "Opprett konto"}
      </button>
    </form>
  );
};
