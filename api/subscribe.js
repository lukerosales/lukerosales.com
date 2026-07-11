const RATE_LIMIT = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const last = RATE_LIMIT.get(ip) || 0;
  if (now - last < 60_000) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  RATE_LIMIT.set(ip, now);

  const { email, source, tag } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const pubId = process.env.BEEHIIV_PUB_ID;
  const apiKey = process.env.BEEHIIV_API_KEY;

  const body = {
    email,
    reactivate_existing: false,
    send_welcome_email: false,
    utm_source: source || 'lukerosales.com',
  };
  if (tag) {
    body.custom_fields = [{ name: 'tag', value: tag }];
  }

  const r = await fetch(`https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const text = await r.text();
    console.error('Beehiiv error:', r.status, text);
    return res.status(502).json({ error: 'Subscription failed' });
  }

  return res.status(200).json({ ok: true });
}
