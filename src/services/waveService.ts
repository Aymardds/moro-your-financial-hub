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

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

/**
 * Initialiser un paiement Wave
 */
export const initiateWavePayment = async (
  request: WavePaymentRequest
): Promise<WavePaymentResponse> => {
  try {
    const endpoint = `${BACKEND_URL}/api/wave/payments`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: request.amount,
        phone: request.phone,
        description: request.description,
        reference: request.reference || `MORO-${Date.now()}`,
      }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'initialisation du paiement Wave');
    }

    const data = await response.json();
    return {
      success: !!data.success || true,
      transaction_id: data.transaction_id,
      status: data.status,
      message: data.message || 'Paiement initialisé avec succès',
    };
  } catch (error: unknown) {
    console.error('Wave payment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors du paiement Wave',
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
    const endpoint = `${BACKEND_URL}/api/wave/payments/${transactionId}`;
    const response = await fetch(endpoint, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la vérification du paiement');
    }

    const data = await response.json();
    return {
      success: !!data.success || data.status === 'completed',
      transaction_id: transactionId,
      status: data.status,
      message: data.message || (data.status === 'completed' ? 'Paiement réussi' : 'Paiement en attente'),
    };
  } catch (error: unknown) {
    console.error('Wave payment status error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la vérification',
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
    const endpoint = `${BACKEND_URL}/api/wave/subscriptions`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: request.phone,
        plan_id: request.plan_id,
        amount: request.amount,
        frequency: request.frequency,
      }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la création de l\'abonnement');
    }

    const data = await response.json();
    return {
      success: !!data.success || true,
      transaction_id: data.subscription_id,
      status: data.status || 'active',
      message: data.message || 'Abonnement créé avec succès',
    };
  } catch (error: unknown) {
    console.error('Wave subscription error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la création de l\'abonnement',
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
    const endpoint = `${BACKEND_URL}/api/wave/subscriptions/${subscriptionId}/cancel`;
    const response = await fetch(endpoint, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'annulation de l\'abonnement');
    }

    return {
      success: true,
      message: 'Abonnement annulé avec succès',
    };
  } catch (error: unknown) {
    console.error('Wave subscription cancellation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de l\'annulation',
    };
  }
};

