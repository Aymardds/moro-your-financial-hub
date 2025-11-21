import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { createWaveSubscription, initiateWavePayment } from '@/services/waveService';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const SUBSCRIPTION_PLANS = [
  {
    id: 'basic',
    name: 'Basique',
    price: 5000,
    features: ['Gestion des opérations', '1 projet actif', 'Épargne de base'],
  },
  {
    id: 'pro',
    name: 'Professionnel',
    price: 15000,
    features: ['Toutes les fonctionnalités Basique', 'Projets illimités', 'Épargne avancée', 'Support prioritaire'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 30000,
    features: [
      'Toutes les fonctionnalités Pro',
      'Scoring IA personnalisé',
      'Accès prioritaire au financement',
      'Conseil financier',
    ],
  },
];

export default function Subscription() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string>('basic');
  const [frequency, setFrequency] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour souscrire',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlan);
      if (!plan) {
        throw new Error('Plan introuvable');
      }

      const amount = frequency === 'yearly' ? plan.price * 12 * 0.9 : plan.price; // 10% de réduction annuelle

      // Récupérer le téléphone de l'utilisateur
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('phone')
        .eq('id', user.id)
        .single();

      const phone = profile?.phone || user.phone || '';

      if (!phone) {
        throw new Error('Numéro de téléphone non trouvé');
      }

      // Initialiser le paiement Wave
      const paymentResult = await initiateWavePayment({
        amount,
        phone,
        description: `Abonnement ${plan.name} - ${frequency === 'monthly' ? 'Mensuel' : 'Annuel'}`,
        reference: `SUB-${user.id}-${Date.now()}`,
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Erreur lors du paiement');
      }

      // Créer l'abonnement Wave
      const subscriptionResult = await createWaveSubscription({
        phone,
        plan_id: selectedPlan,
        amount: plan.price,
        frequency,
      });

      if (!subscriptionResult.success) {
        throw new Error(subscriptionResult.error || 'Erreur lors de la création de l\'abonnement');
      }

      // Enregistrer l'abonnement dans Supabase
      const { error: dbError } = await supabase.from('subscriptions').insert({
        user_id: user.id,
        plan_id: selectedPlan,
        amount: plan.price,
        frequency,
        wave_subscription_id: subscriptionResult.transaction_id,
        status: 'active',
      });

      if (dbError) {
        console.error('Database error:', dbError);
        // Ne pas échouer si l'enregistrement DB échoue, le paiement est déjà fait
      }

      toast({
        title: 'Succès',
        description: 'Abonnement activé avec succès!',
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer l\'abonnement',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedPlanData = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlan);
  const finalPrice = selectedPlanData
    ? frequency === 'yearly'
      ? selectedPlanData.price * 12 * 0.9
      : selectedPlanData.price
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Choisissez votre abonnement</CardTitle>
              <CardDescription>
                Sélectionnez le plan qui correspond à vos besoins
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sélection de la fréquence */}
              <div className="space-y-2">
                <Label>Fréquence de paiement</Label>
                <RadioGroup value={frequency} onValueChange={(v) => setFrequency(v as 'monthly' | 'yearly')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly" className="cursor-pointer">
                      Mensuel
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yearly" id="yearly" />
                    <Label htmlFor="yearly" className="cursor-pointer">
                      Annuel (10% de réduction)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Plans */}
              <div className="grid gap-4 md:grid-cols-3">
                {SUBSCRIPTION_PLANS.map((plan) => {
                  const price = frequency === 'yearly' ? plan.price * 12 * 0.9 : plan.price;
                  const isSelected = selectedPlan === plan.id;

                  return (
                    <Card
                      key={plan.id}
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      <CardHeader>
                        <CardTitle>{plan.name}</CardTitle>
                        <div className="mt-2">
                          <span className="text-3xl font-bold">
                            {price.toLocaleString('fr-FR')} FCFA
                          </span>
                          {frequency === 'yearly' && (
                            <span className="text-sm text-muted-foreground">/an</span>
                          )}
                          {frequency === 'monthly' && (
                            <span className="text-sm text-muted-foreground">/mois</span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-start">
                              <span className="mr-2">✓</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Résumé */}
              <Card>
                <CardHeader>
                  <CardTitle>Résumé</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Plan sélectionné:</span>
                    <span className="font-medium">{selectedPlanData?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fréquence:</span>
                    <span className="font-medium">
                      {frequency === 'monthly' ? 'Mensuel' : 'Annuel'}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{finalPrice.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleSubscribe}
                    disabled={loading}
                  >
                    {loading ? 'Traitement...' : 'Payer avec Wave'}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Le paiement sera effectué via Wave Mobile Money
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

