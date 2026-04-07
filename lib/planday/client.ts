/**
 * Planday API client with automatic OAuth token management.
 * Auth: POST https://id.planday.com/connect/token
 * API calls require: X-ClientId + Authorization: Bearer {access_token}
 */

const TOKEN_URL = "https://id.planday.com/connect/token";
const API_BASE = "https://openapi.planday.com";

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

const getClientId = (): string => {
  const id = process.env.PLANDAY_APP_ID ?? process.env.PALNDAY_APP_ID;
  if (!id) throw new Error("Missing PLANDAY_APP_ID env var");
  return id;
};

const getRefreshToken = (): string => {
  const token = process.env.PLANDAY_TOKEN;
  if (!token) throw new Error("Missing PLANDAY_TOKEN env var");
  return token;
};

export const getAccessToken = async (): Promise<string> => {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.accessToken;
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getClientId(),
      grant_type: "refresh_token",
      refresh_token: getRefreshToken(),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Planday token exchange failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.accessToken;
};

export interface PlandayRequestOptions {
  path: string;
  params?: Record<string, string>;
}

export const plandayGet = async <T = unknown>(
  options: PlandayRequestOptions,
): Promise<T> => {
  const token = await getAccessToken();
  const url = new URL(options.path, API_BASE);
  if (options.params) {
    for (const [k, v] of Object.entries(options.params)) {
      url.searchParams.set(k, v);
    }
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "X-ClientId": getClientId(),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Planday API ${response.status} on ${options.path}: ${text}`);
  }
  return response.json() as Promise<T>;
};

export const plandayGetAll = async <T = unknown>(
  options: PlandayRequestOptions,
): Promise<T[]> => {
  const results: T[] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const response = await plandayGet<{ data: T[] }>({
      path: options.path,
      params: { ...options.params, offset: String(offset), limit: String(limit) },
    });
    results.push(...response.data);
    if (response.data.length < limit) break;
    offset += limit;
  }
  return results;
};
