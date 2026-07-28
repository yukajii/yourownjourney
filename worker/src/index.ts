import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Reflection proxy.
 *
 * The app is a static PWA, so it has nowhere to keep a secret: anything the
 * browser can read, every visitor can read. This Worker holds the OpenAI key
 * instead and will only spend it for a caller who proves they are a signed-in
 * user of this Firebase project.
 *
 * Without that proof an endpoint holding a funded API key is a free OpenAI
 * account for whoever finds the URL.
 */

export interface Env {
  /** wrangler secret put OPENAI_API_KEY */
  OPENAI_API_KEY: string;
  /** Firebase project id, e.g. leagues-2790f */
  FIREBASE_PROJECT_ID: string;
  /** Comma-separated origins allowed to call this Worker. */
  ALLOWED_ORIGINS: string;
}

const MODEL = "gpt-5.6-luna";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

/** Google's public keys for Firebase ID tokens. Cached by the runtime. */
const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

/** Refuse oversized bodies before doing any work on them. */
const MAX_BODY_BYTES = 60_000;
const MAX_OUTPUT_TOKENS = 700;

const corsHeaders = (origin: string | null, env: Env) => {
  const allowed = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean);
  const ok = origin !== null && allowed.includes(origin);

  return {
    "Access-Control-Allow-Origin": ok ? origin : allowed[0] ?? "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
};

const json = (body: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });

/**
 * Verifies a Firebase ID token: correct signature from Google, correct issuer
 * and audience for this project, and not expired. Returns the uid.
 */
async function verifyFirebaseToken(token: string, projectId: string): Promise<string> {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });

  // `sub` is the uid. Firebase also requires it to be non-empty.
  const uid = typeof payload.sub === "string" ? payload.sub : "";
  if (!uid) throw new Error("token carries no subject");
  return uid;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const cors = corsHeaders(origin, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== "POST") {
      return json({ error: "Use POST." }, 405, cors);
    }

    /* ── who is calling ─────────────────────────────────────────── */
    const auth = request.headers.get("Authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) {
      return json({ error: "Sign in to request a reflection." }, 401, cors);
    }

    try {
      await verifyFirebaseToken(token, env.FIREBASE_PROJECT_ID);
    } catch {
      // Deliberately vague: a precise reason helps someone probing the endpoint.
      return json({ error: "Sign in to request a reflection." }, 401, cors);
    }

    /* ── what they are asking for ───────────────────────────────── */
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return json({ error: "That is more than a reflection needs." }, 413, cors);
    }

    let body: { system?: unknown; user?: unknown; schema?: unknown };
    try {
      body = JSON.parse(raw);
    } catch {
      return json({ error: "Malformed request." }, 400, cors);
    }

    const system = typeof body.system === "string" ? body.system : "";
    const user = typeof body.user === "string" ? body.user : "";
    if (!system || !user) {
      return json({ error: "Malformed request." }, 400, cors);
    }

    /* ── spend the key ──────────────────────────────────────────── */
    const upstream = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_completion_tokens: MAX_OUTPUT_TOKENS,
        response_format: body.schema
          ? {
              type: "json_schema",
              json_schema: { name: "reflection", strict: true, schema: body.schema },
            }
          : undefined,
      }),
    });

    if (!upstream.ok) {
      // The upstream body can quote the request; never pass it through verbatim.
      console.error("OpenAI request failed", upstream.status, await upstream.text());
      return json({ error: "The reflection could not be written just now." }, 502, cors);
    }

    const completion = (await upstream.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = completion.choices?.[0]?.message?.content ?? "";

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return json({ error: "The reflection came back malformed." }, 502, cors);
    }

    return json({ reflection: parsed }, 200, cors);
  },
};
