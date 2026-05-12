/**
 * Kozy ESO OAuth Proxy — Cloudflare Worker
 *
 * Handles the GitHub OAuth dance for Decap CMS.
 * Requires two environment variables set in the Cloudflare dashboard:
 *   GITHUB_CLIENT_ID
 *   GITHUB_CLIENT_SECRET
 *
 * Endpoints:
 *   GET /auth      → redirect to GitHub OAuth
 *   GET /callback  → exchange code for token, send back to Decap via postMessage
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ── /auth — redirect to GitHub ───────────────────────────────────────────
    if (url.pathname === '/auth') {
      const params = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        scope: 'repo,user',
        state: crypto.randomUUID(),
      });
      return Response.redirect(
        `https://github.com/login/oauth/authorize?${params}`,
        302
      );
    }

    // ── /callback — exchange code for token ──────────────────────────────────
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');

      if (!code) {
        return sendToDecap('error', { message: 'Missing OAuth code' });
      }

      let token;
      try {
        const res = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code,
          }),
        });

        const data = await res.json();

        if (data.error) {
          return sendToDecap('error', { message: data.error_description ?? data.error });
        }

        token = data.access_token;
      } catch (err) {
        return sendToDecap('error', { message: 'Failed to fetch token from GitHub' });
      }

      return sendToDecap('success', { token, provider: 'github' });
    }

    return new Response('Not found', { status: 404 });
  },
};

/**
 * Sends the result back to Decap CMS via postMessage, then closes the popup.
 */
function sendToDecap(status, payload) {
  const message = JSON.stringify(`authorization:github:${status}:${JSON.stringify(payload)}`);
  const html = `<!doctype html>
<html><head><meta charset="utf-8"></head><body>
<script>
  (function () {
    var msg = ${message};
    function onMessage(e) {
      window.opener.postMessage(msg, e.origin);
    }
    window.addEventListener('message', onMessage, false);
    if (window.opener) {
      window.opener.postMessage('authorizing:github', '*');
    }
  })();
</script>
</body></html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
