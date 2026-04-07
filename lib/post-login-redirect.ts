/**
 * Post-login and "home" routing: the assistant hub at /app is admin-only;
 * everyone else defaults to /app/poe.
 */

const normalizePath = (path: string): string => {
  const withoutQuery = path.split("?")[0] ?? path;
  const trimmed = withoutQuery.replace(/\/+$/, "") || "/";
  return trimmed;
};

/** True for the three-agent landing page (/app), not /app/poe etc. */
export const isAssistantHubPath = (path: string): boolean =>
  normalizePath(path) === "/app";

export const resolveAfterLogin = (
  role: string | null | undefined,
  nextParam: string | null | undefined,
): string => {
  const isAdmin = role === "admin";
  const raw = (nextParam ?? "").trim() || "/app";
  const next = raw.startsWith("/") ? raw : "/app";

  if (isAdmin) {
    return next;
  }
  return isAssistantHubPath(next) ? "/app/poe" : next;
};

export const homePathForUser = (role: string | null | undefined): string =>
  role === "admin" ? "/app" : "/app/poe";
