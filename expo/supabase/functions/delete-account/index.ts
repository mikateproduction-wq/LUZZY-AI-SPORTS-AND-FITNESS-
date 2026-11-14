// LUZZY AI — suppression définitive du compte.
// Le client doit renvoyer le prénom, le nom et l'email exacts : la comparaison est faite ici, côté serveur,
// à partir des données de la base (et non de ce que dit le client).

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const ALLOWED_ORIGINS = new Set([
  "http://localhost:8081",
  "http://localhost:8080",
]);

/** Extensions possibles de la photo de profil (voir expo/lib/avatar.ts et la migration 004). */
const AVATAR_EXTENSIONS = ["jpg", "png", "webp"] as const;

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : "null";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(status: number, body: unknown, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

function normalize(value: unknown): string {
  return typeof value === "string" ? value.normalize("NFC").trim().toLowerCase() : "";
}

function isBodyShape(value: unknown): value is { firstName: string; lastName: string; email: string } {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.firstName === "string" && v.firstName.length <= 120 &&
    typeof v.lastName === "string" && v.lastName.length <= 120 &&
    typeof v.email === "string" && v.email.length <= 320
  );
}

async function fetchCurrentUser(bearer: string): Promise<{ id: string; email: string | null } | null> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: ANON_KEY, Authorization: bearer },
  });
  if (!res.ok) return null;
  const user = (await res.json()) as { id?: unknown; email?: unknown };
  if (typeof user.id !== "string") return null;
  return { id: user.id, email: typeof user.email === "string" ? user.email : null };
}

async function serviceFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") {
    return json(405, { error: "method_not_allowed" }, origin);
  }

  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json(401, { error: "unauthorized" }, origin);
  }

  const current = await fetchCurrentUser(authorization);
  if (!current) {
    return json(401, { error: "unauthorized" }, origin);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid_json" }, origin);
  }
  if (!isBodyShape(body)) {
    return json(400, { error: "invalid_body" }, origin);
  }

  // 1. Confirmation : les données saisies doivent correspondre à celles de la base.
  const profileRes = await serviceFetch(
    `/rest/v1/profiles?id=eq.${encodeURIComponent(current.id)}&select=first_name,last_name&limit=1`,
    { method: "GET" }
  );
  if (!profileRes.ok) {
    return json(500, { error: "profile_lookup_failed" }, origin);
  }
  const profiles = (await profileRes.json()) as { first_name: string; last_name: string }[];
  const profile = profiles[0];

  const emailMatches = current.email !== null && normalize(body.email) === normalize(current.email);
  const firstMatches = profile ? normalize(body.firstName) === normalize(profile.first_name) : false;
  const lastMatches = profile ? normalize(body.lastName) === normalize(profile.last_name) : false;

  if (!emailMatches || !firstMatches || !lastMatches) {
    return json(400, { error: "confirmation_mismatch" }, origin);
  }

  // 2. Suppression des données applicatives. Les tables ont ON DELETE CASCADE sur auth.users,
  //    mais on supprime explicitement pour ne rien laisser en cas d'échec partiel.
  const xpRes = await serviceFetch(`/rest/v1/user_xp?user_id=eq.${encodeURIComponent(current.id)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
  if (!xpRes.ok) return json(500, { error: "delete_xp_failed" }, origin);

  // 2 bis. Photo de profil : suppression des fichiers du dossier de l'utilisateur dans le bucket `avatars`.
  //        L'API Storage ignore les chemins absents, donc les trois extensions sont toujours passées.
  const avatarRes = await serviceFetch(`/storage/v1/object/avatars`, {
    method: "DELETE",
    body: JSON.stringify({
      prefixes: AVATAR_EXTENSIONS.map((ext) => `${current.id}/avatar.${ext}`),
    }),
  });
  if (!avatarRes.ok) return json(500, { error: "delete_avatars_failed" }, origin);

  const profileDelete = await serviceFetch(`/rest/v1/profiles?id=eq.${encodeURIComponent(current.id)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
  if (!profileDelete.ok) return json(500, { error: "delete_profile_failed" }, origin);

  // 3. Suppression du compte d'authentification (libère aussi le pseudo, déjà supprimé ci-dessus).
  const authDelete = await serviceFetch(`/auth/v1/admin/users/${encodeURIComponent(current.id)}`, {
    method: "DELETE",
  });
  if (!authDelete.ok) return json(500, { error: "delete_auth_user_failed" }, origin);

  return json(200, { deleted: true }, origin);
});
