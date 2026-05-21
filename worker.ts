/**
 * Kozy ESO PvP Builds — Cloudflare Worker
 * Handles /api/builds/* for short URL storage, passes everything else to static assets.
 */

export interface Env {
  ASSETS: Fetcher;
  BUILDS_KV: KVNamespace;
}

// URL-safe chars without ambiguous 0/O/I/l
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
const ID_LEN = 8;
const MAX_BODY = 200_000; // 200 KB max per build
const TTL_SECONDS = 180 * 24 * 60 * 60; // 180 days

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function generateId(): string {
  const buf = new Uint8Array(ID_LEN);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => CHARS[b % CHARS.length]).join("");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // ── POST /api/builds — save build, return { id, url } ──────────────────
    if (request.method === "POST" && url.pathname === "/api/builds") {
      const body = await request.text().catch(() => "");
      if (!body || body.length > MAX_BODY) {
        return json({ error: "invalid_body" }, 400);
      }
      // Basic sanity check — must be valid JSON with a version field
      try {
        const snap = JSON.parse(body);
        if (!snap || snap.v !== 1) return json({ error: "invalid_snapshot" }, 400);
      } catch {
        return json({ error: "invalid_json" }, 400);
      }

      // Generate a unique ID (retry on collision — astronomically unlikely)
      let id = generateId();
      for (let i = 0; i < 5; i++) {
        if (!(await env.BUILDS_KV.get(id))) break;
        id = generateId();
      }

      await env.BUILDS_KV.put(id, body, { expirationTtl: TTL_SECONDS });

      const shareUrl = `${url.origin}/share?id=${id}`;
      return json({ id, url: shareUrl }, 201);
    }

    // ── GET /api/builds/:id — load build by short ID ───────────────────────
    const match = url.pathname.match(/^\/api\/builds\/([A-Za-z0-9]{6,12})$/);
    if (request.method === "GET" && match) {
      const data = await env.BUILDS_KV.get(match[1]);
      if (!data) return json({ error: "not_found" }, 404);
      return new Response(data, {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // ── Everything else → static assets ────────────────────────────────────
    return env.ASSETS.fetch(request);
  },
};
