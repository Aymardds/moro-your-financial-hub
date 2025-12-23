export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  const { amount, phone, description, reference } = req.body || {};
  const apiKey = process.env.WAVE_API_KEY;
  const merchantKey = process.env.WAVE_MERCHANT_KEY;
  const baseUrl = process.env.WAVE_API_URL || 'https://api.wave.com/v1';
  if (!apiKey || !merchantKey) {
    return res.status(500).json({ success: false, message: 'Wave configuration missing' });
  }
  const response = await fetch(`${baseUrl}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ amount, phone, description, merchant_key: merchantKey, reference }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return res.status(response.status).json({ success: false, message: data?.message || 'Wave error' });
  }
  return res.status(200).json({ success: true, transaction_id: data.transaction_id, status: data.status, message: 'Paiement initialisé avec succès' });
}