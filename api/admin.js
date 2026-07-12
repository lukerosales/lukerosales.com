export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { password, data } = req.body;

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'wrong password' });
  }

  if (!data) return res.status(400).json({ error: 'missing data' });

  try {
    const r = await fetch(`${process.env.KV_REST_API_URL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['SET', 'ledger', JSON.stringify(data)]),
    });
    if (!r.ok) throw new Error('kv write failed');
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }

  return res.status(200).json({ ok: true });
}
