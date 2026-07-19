// Accept whichever names Vercel/Upstash injects for the Redis REST credentials.
const KV_URL   = process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const r = await fetch(`${KV_URL}/get/ledger`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
    });
    const { result } = await r.json();
    if (result) return res.status(200).json(JSON.parse(result));
  } catch {}
  return res.status(404).json({ error: 'no data' });
}
