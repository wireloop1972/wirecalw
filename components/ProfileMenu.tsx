"use client";

import { useCallback, useRef, useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/supabase/user-context";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  formatDisplayInitials,
  formatDisplayName,
  roleLabelNb,
} from "@/lib/user-profile";

const ProfileMenu = () => {
  const user = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showPwChange, setShowPwChange] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profFn, setProfFn] = useState("");
  const [profLn, setProfLn] = useState("");
  const [profTitle, setProfTitle] = useState("");
  const [profError, setProfError] = useState<string | null>(null);
  const [profSuccess, setProfSuccess] = useState(false);
  const [profLoading, setProfLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayFields = {
    firstName: user.firstName,
    lastName: user.lastName,
    title: user.title,
    email: user.email,
  };
  const initials = formatDisplayInitials(displayFields);
  const displayName = formatDisplayName(displayFields);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open && showProfile) {
      setProfFn(user.firstName ?? "");
      setProfLn(user.lastName ?? "");
      setProfTitle(user.title ?? "");
      setProfError(null);
      setProfSuccess(false);
    }
  }, [open, showProfile, user.firstName, user.lastName, user.title]);

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    setProfError(null);
    setProfSuccess(false);
    setProfLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("users")
        .update({
          first_name: profFn.trim() || null,
          last_name: profLn.trim() || null,
          title: profTitle.trim() || null,
        })
        .eq("id", user.id);
      if (error) {
        setProfError(error.message);
      } else {
        setProfSuccess(true);
        router.refresh();
        setTimeout(() => setProfSuccess(false), 2000);
      }
    } catch {
      setProfError("Noe gikk galt.");
    } finally {
      setProfLoading(false);
    }
  };

  const handleSignOut = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }, [router]);

  const handlePwChange = async (e: FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (newPw.length < 6) {
      setPwError("Passordet må være minst 6 tegn.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("Passordene stemmer ikke overens.");
      return;
    }

    setPwLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) {
        setPwError(error.message);
      } else {
        setPwSuccess(true);
        setNewPw("");
        setConfirmPw("");
        setTimeout(() => {
          setShowPwChange(false);
          setPwSuccess(false);
        }, 2000);
      }
    } catch {
      setPwError("Noe gikk galt.");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-full
          bg-[var(--gjest-teal)] text-xs font-bold text-white
          shadow-sm transition-colors hover:bg-[var(--gjest-teal-light)]
          sm:h-9 sm:w-9 sm:text-sm"
        aria-label="Profil"
      >
        {initials}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-72 rounded-md
            border border-[var(--gjest-border)] bg-[var(--gjest-paper)]
            shadow-lg sm:w-80"
        >
          <div className="border-b border-[var(--gjest-border)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--gjest-ink)]">
              {displayName}
            </p>
            <p className="mt-0.5 text-xs text-[var(--gjest-ink-muted)]">
              {user.email}
            </p>
            <span
              className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[0.625rem]
                font-semibold uppercase tracking-wider
                bg-[var(--gjest-teal)]/10 text-[var(--gjest-teal)]"
            >
              {roleLabelNb[user.role]}
            </span>
          </div>

          <div className="px-4 py-3">
            {!showProfile ? (
              <button
                onClick={() => {
                  setShowProfile(true);
                  setShowPwChange(false);
                }}
                className="w-full rounded-md px-3 py-2 text-left text-sm
                  text-[var(--gjest-ink)] transition-colors
                  hover:bg-[var(--gjest-teal)]/5"
              >
                Profil (navn og tittel)
              </button>
            ) : (
              <form onSubmit={handleProfileSave} className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--gjest-teal)]">
                  Profil
                </p>
                {profError && (
                  <p className="text-xs text-[#6b3030]">{profError}</p>
                )}
                {profSuccess && (
                  <p className="text-xs text-emerald-600">Lagret.</p>
                )}
                <input
                  type="text"
                  placeholder="Fornavn"
                  value={profFn}
                  onChange={(e) => setProfFn(e.target.value)}
                  autoComplete="given-name"
                  disabled={profLoading}
                  className="w-full border-b-2 border-[var(--gjest-border)] bg-transparent
                    px-1 py-1.5 text-sm text-[var(--gjest-ink)] outline-none
                    placeholder:text-[var(--gjest-ink-muted)]/50
                    focus:border-[var(--gjest-teal)]"
                />
                <input
                  type="text"
                  placeholder="Etternavn"
                  value={profLn}
                  onChange={(e) => setProfLn(e.target.value)}
                  autoComplete="family-name"
                  disabled={profLoading}
                  className="w-full border-b-2 border-[var(--gjest-border)] bg-transparent
                    px-1 py-1.5 text-sm text-[var(--gjest-ink)] outline-none
                    placeholder:text-[var(--gjest-ink-muted)]/50
                    focus:border-[var(--gjest-teal)]"
                />
                <input
                  type="text"
                  placeholder="Tittel (valgfritt, f.eks. Daglig leder)"
                  value={profTitle}
                  onChange={(e) => setProfTitle(e.target.value)}
                  disabled={profLoading}
                  className="w-full border-b-2 border-[var(--gjest-border)] bg-transparent
                    px-1 py-1.5 text-sm text-[var(--gjest-ink)] outline-none
                    placeholder:text-[var(--gjest-ink-muted)]/50
                    focus:border-[var(--gjest-teal)]"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={profLoading}
                    className="rounded-full bg-[var(--gjest-teal)] px-3 py-1.5
                      text-xs font-semibold text-white
                      hover:bg-[var(--gjest-teal-light)]
                      disabled:opacity-40"
                  >
                    {profLoading ? "Lagrer ..." : "Lagre"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfile(false);
                      setProfError(null);
                    }}
                    className="rounded-full px-3 py-1.5 text-xs
                      text-[var(--gjest-ink-muted)]
                      hover:text-[var(--gjest-ink)]"
                  >
                    Lukk
                  </button>
                </div>
              </form>
            )}

            {!showPwChange ? (
              <button
                onClick={() => {
                  setShowPwChange(true);
                  setShowProfile(false);
                }}
                className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm
                  text-[var(--gjest-ink)] transition-colors
                  hover:bg-[var(--gjest-teal)]/5"
              >
                Endre passord
              </button>
            ) : (
              <form onSubmit={handlePwChange} className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--gjest-teal)]">
                  Endre passord
                </p>
                {pwError && (
                  <p className="text-xs text-[#6b3030]">{pwError}</p>
                )}
                {pwSuccess && (
                  <p className="text-xs text-emerald-600">Passord oppdatert.</p>
                )}
                <input
                  type="password"
                  placeholder="Nytt passord"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  autoComplete="new-password"
                  disabled={pwLoading}
                  className="w-full border-b-2 border-[var(--gjest-border)] bg-transparent
                    px-1 py-1.5 text-sm text-[var(--gjest-ink)] outline-none
                    placeholder:text-[var(--gjest-ink-muted)]/50
                    focus:border-[var(--gjest-teal)]"
                />
                <input
                  type="password"
                  placeholder="Bekreft passord"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  autoComplete="new-password"
                  disabled={pwLoading}
                  className="w-full border-b-2 border-[var(--gjest-border)] bg-transparent
                    px-1 py-1.5 text-sm text-[var(--gjest-ink)] outline-none
                    placeholder:text-[var(--gjest-ink-muted)]/50
                    focus:border-[var(--gjest-teal)]"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={pwLoading}
                    className="rounded-full bg-[var(--gjest-teal)] px-3 py-1.5
                      text-xs font-semibold text-white
                      hover:bg-[var(--gjest-teal-light)]
                      disabled:opacity-40"
                  >
                    {pwLoading ? "Lagrer ..." : "Lagre"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPwChange(false);
                      setPwError(null);
                    }}
                    className="rounded-full px-3 py-1.5 text-xs
                      text-[var(--gjest-ink-muted)]
                      hover:text-[var(--gjest-ink)]"
                  >
                    Avbryt
                  </button>
                </div>
              </form>
            )}

            {user.role === "admin" && (
              <a
                href="/app/admin/invites"
                className="mt-1 block w-full rounded-md px-3 py-2 text-left text-sm
                  text-[var(--gjest-ink)] transition-colors
                  hover:bg-[var(--gjest-teal)]/5"
              >
                Administrer invitasjoner
              </a>
            )}
          </div>

          <div className="border-t border-[var(--gjest-border)] px-4 py-2.5">
            <button
              onClick={handleSignOut}
              className="w-full rounded-md px-3 py-2 text-left text-sm
                text-[#6b3030] transition-colors hover:bg-[#6b3030]/5"
            >
              Logg ut
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
