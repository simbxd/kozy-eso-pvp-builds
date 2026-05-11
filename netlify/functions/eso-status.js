export default async () => {
  try {
    const res = await fetch('https://live-services.elderscrollsonline.com/status/realms', {
      headers: { 'User-Agent': 'kozy-eso-pvp-builds/1.0' },
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config = { path: '/api/eso-status' };
