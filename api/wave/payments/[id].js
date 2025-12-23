export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  const { id } = req.query;
  const apiKey = process.env.WAVE_API_KEY;
  const baseUrl = process.env.WAVE_API_URL || 'https://api.wave.com/v1';
  if (!apiKey) {
    return res.status(500).json({ success: false, message: 'Wave configuration missing' });
  }
  const response = await fetch(`${baseUrl}/payments/${id}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return res.status(response.status).json({ success: false, message: data?.message || 'Wave error' });
  }
  return res.status(200).json({ success: data.status === 'completed', status: data.status, message: data.message || (data.status === 'completed' ? 'Paiement réussi' : 'Paiement en attente') });
}