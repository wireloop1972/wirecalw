export type AppRole = "admin" | "manager" | "employee" | "guest";

export const APP_ROLES: readonly AppRole[] = [
  "admin",
  "manager",
  "employee",
  "guest",
] as const;

export const isAppRole = (v: string): v is AppRole =>
  (APP_ROLES as readonly string[]).includes(v);

export const roleLabelNb: Record<AppRole, string> = {
  admin: "Administrator",
  manager: "Leder",
  employee: "Ansatt",
  guest: "Gjest",
};

export interface ProfileDisplayFields {
  firstName: string | null;
  lastName: string | null;
  title: string | null;
  email: string;
}

export const formatDisplayName = (p: ProfileDisplayFields): string => {
  const parts = [p.firstName, p.lastName].filter(Boolean) as string[];
  if (parts.length > 0) {
    return parts.join(" ");
  }
  const t = p.title?.trim();
  if (t) return t;
  return p.email.split("@")[0] ?? p.email;
};

export const formatDisplayInitials = (p: ProfileDisplayFields): string => {
  const fn = p.firstName?.trim();
  const ln = p.lastName?.trim();
  if (fn && ln) {
    return (fn.charAt(0) + ln.charAt(0)).toUpperCase();
  }
  if (fn && fn.length >= 2) {
    return fn.slice(0, 2).toUpperCase();
  }
  const name = formatDisplayName(p);
  const bits = name.split(/\s+/).filter(Boolean).slice(0, 2);
  if (bits.length === 0) return "?";
  return bits.map((w) => w.charAt(0).toUpperCase()).join("");
};
