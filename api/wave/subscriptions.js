export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  const { phone, plan_id, amount, frequency } = req.body || {};
  const apiKey = process.env.WAVE_API_KEY;
  const merchantKey = process.env.WAVE_MERCHANT_KEY;
  const baseUrl = process.env.WAVE_API_URL || 'https://api.wave.com/v1';
  if (!apiKey || !merchantKey) {
    return res.status(500).json({ success: false, message: 'Wave configuration missing' });
  }
  const response = await fetch(`${baseUrl}/subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ phone, plan_id, amount, frequency, merchant_key: merchantKey }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return res.status(response.status).json({ success: false, message: data?.message || 'Wave error' });
  }
  return res.status(200).json({ success: true, subscription_id: data.subscription_id, status: data.status || 'active', message: data.message || 'Abonnement créé avec succès' });
}