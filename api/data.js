export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const r = await fetch(`${process.env.KV_REST_API_URL}/get/ledger`, {
      headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
    });
    const { result } = await r.json();
    if (result) return res.status(200).json(JSON.parse(result));
  } catch {}
  return res.status(404).json({ error: 'no data' });
}
