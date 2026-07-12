export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { password, data } = req.body;

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'wrong password' });
  }

  if (!data) return res.status(400).json({ error: 'missing data' });

  const token = process.env.GITHUB_TOKEN;
  const REPO  = 'lukerosales/lukerosales.com';
  const FILE  = 'data.json';
  const API   = 'https://api.github.com';
  const hdrs  = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const getRes = await fetch(`${API}/repos/${REPO}/contents/${FILE}`, { headers: hdrs });
  if (!getRes.ok) return res.status(500).json({ error: 'failed to read file from GitHub' });

  const { sha } = await getRes.json();
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

  const putRes = await fetch(`${API}/repos/${REPO}/contents/${FILE}`, {
    method: 'PUT',
    headers: { ...hdrs, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `ledger update ${new Date().toISOString().slice(0, 10)}`,
      content,
      sha,
    }),
  });

  if (!putRes.ok) {
    const err = await putRes.json();
    return res.status(500).json({ error: 'GitHub commit failed', detail: err.message });
  }

  return res.status(200).json({ ok: true });
}
