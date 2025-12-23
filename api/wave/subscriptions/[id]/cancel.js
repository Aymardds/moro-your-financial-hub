export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  const { id } = req.query;
  const apiKey = process.env.WAVE_API_KEY;
  const baseUrl = process.env.WAVE_API_URL || 'https://api.wave.com/v1';
  if (!apiKey) {
    return res.status(500).json({ success: false, message: 'Wave configuration missing' });
  }
  const response = await fetch(`${baseUrl}/subscriptions/${id}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json({ success: false, message: data?.message || 'Wave error' });
  }
  return res.status(200).json({ success: true, message: 'Abonnement annulé avec succès' });
}