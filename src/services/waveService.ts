/**
 * Service d'intégration Wave Mobile Money
 * Documentation: https://developer.wave.com/
 */

interface WavePaymentRequest {
  amount: number;
  phone: string;
  description: string;
  reference?: string;
}

interface WavePaymentResponse {
  success: boolean;
  transaction_id?: string;
  status?: string;
  message?: string;
  error?: string;
}

interface WaveSubscriptionRequest {
  phone: string;
  plan_id: string;
  amount: number;
  frequency: 'monthly' | 'yearly';
}

// Configuration Wave (à remplacer par vos vraies clés API)
const WAVE_API_KEY = import.meta.env.VITE_WAVE_API_KEY || '';
const WAVE_MERCHANT_KEY = import.meta.env.VITE_WAVE_MERCHANT_KEY || '';
const WAVE_API_URL = 'https://api.wave.com/v1';

/**
 * Initialiser un paiement Wave
 */
export const initiateWavePayment = async (
  request: WavePaymentRequest
): Promise<WavePaymentResponse> => {
  try {
    // En production, vous feriez un appel API réel à Wave
    // Pour l'instant, on simule une réponse
    const response = await fetch(`${WAVE_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WAVE_API_KEY}`,
      },
      body: JSON.stringify({
        amount: request.amount,
        phone: request.phone,
        description: request.description,
        merchant_key: WAVE_MERCHANT_KEY,
        reference: request.reference || `MORO-${Date.now()}`,
      }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'initialisation du paiement Wave');
    }

    const data = await response.json();
    return {
      success: true,
      transaction_id: data.transaction_id,
      status: data.status,
      message: 'Paiement initialisé avec succès',
    };
  } catch (error: any) {
    console.error('Wave payment error:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors du paiement Wave',
    };
  }
};

/**
 * Vérifier le statut d'un paiement Wave
 */
export const checkWavePaymentStatus = async (
  transactionId: string
): Promise<WavePaymentResponse> => {
  try {
    const response = await fetch(`${WAVE_API_URL}/payments/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WAVE_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la vérification du paiement');
    }

    const data = await response.json();
    return {
      success: data.status === 'completed',
      transaction_id: transactionId,
      status: data.status,
      message: data.status === 'completed' ? 'Paiement réussi' : 'Paiement en attente',
    };
  } catch (error: any) {
    console.error('Wave payment status error:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la vérification',
    };
  }
};

/**
 * Créer un abonnement Wave
 */
export const createWaveSubscription = async (
  request: WaveSubscriptionRequest
): Promise<WavePaymentResponse> => {
  try {
    const response = await fetch(`${WAVE_API_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WAVE_API_KEY}`,
      },
      body: JSON.stringify({
        phone: request.phone,
        plan_id: request.plan_id,
        amount: request.amount,
        frequency: request.frequency,
        merchant_key: WAVE_MERCHANT_KEY,
      }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la création de l\'abonnement');
    }

    const data = await response.json();
    return {
      success: true,
      transaction_id: data.subscription_id,
      status: 'active',
      message: 'Abonnement créé avec succès',
    };
  } catch (error: any) {
    console.error('Wave subscription error:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la création de l\'abonnement',
    };
  }
};

/**
 * Annuler un abonnement Wave
 */
export const cancelWaveSubscription = async (
  subscriptionId: string
): Promise<WavePaymentResponse> => {
  try {
    const response = await fetch(`${WAVE_API_URL}/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WAVE_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'annulation de l\'abonnement');
    }

    return {
      success: true,
      message: 'Abonnement annulé avec succès',
    };
  } catch (error: any) {
    console.error('Wave subscription cancellation error:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de l\'annulation',
    };
  }
};

