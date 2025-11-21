import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { calculateFinancingScore } from '@/services/scoringService';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function FinancingApplication() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [showScore, setShowScore] = useState(false);

  const handleCalculateScore = async () => {
    if (!user || !amount) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const requestedAmount = parseFloat(amount);
      if (isNaN(requestedAmount) || requestedAmount <= 0) {
        throw new Error('Montant invalide');
      }

      const result = await calculateFinancingScore(user.id, requestedAmount);
      setScore(result.total_score);
      setShowScore(true);

      toast({
        title: 'Score calculé',
        description: `Votre score de financement est de ${result.total_score}/100`,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de calculer le score',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !amount || !description || !score) {
      toast({
        title: 'Erreur',
        description: 'Veuillez calculer le score et remplir tous les champs',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const requestedAmount = parseFloat(amount);

      // Trouver une institution (pour l'instant, on prend la première disponible)
      const { data: institutions } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('role', 'institution')
        .limit(1);

      const institutionId = institutions?.[0]?.id;

      if (!institutionId) {
        throw new Error('Aucune institution disponible');
      }

      // Créer la demande de financement
      const { error } = await supabase.from('financing_applications').insert({
        entrepreneur_id: user.id,
        institution_id: institutionId,
        amount: requestedAmount,
        description,
        score,
        status: 'pending',
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Succès',
        description: 'Votre demande de financement a été soumise avec succès',
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de soumettre la demande',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Demande de Financement
              </CardTitle>
              <CardDescription>
                Soumettez votre demande de financement avec scoring IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant demandé (FCFA)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="500000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description du projet</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre projet et l'utilisation prévue du financement..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                />
              </div>

              {!showScore ? (
                <Button
                  className="w-full"
                  onClick={handleCalculateScore}
                  disabled={loading || !amount}
                >
                  {loading ? 'Calcul en cours...' : 'Calculer mon score IA'}
                </Button>
              ) : (
                <>
                  <Card className="bg-primary/10">
                    <CardHeader>
                      <CardTitle className="text-lg">Votre Score de Financement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-5xl font-bold text-primary mb-2">{score}/100</div>
                        <p className="text-sm text-muted-foreground">
                          {score && score >= 70
                            ? 'Excellent score! Votre demande a de fortes chances d\'être approuvée.'
                            : score && score >= 50
                            ? 'Score moyen. Votre demande sera examinée en détail.'
                            : 'Score faible. Améliorez votre profil pour augmenter vos chances.'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Button
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={loading || !description}
                  >
                    {loading ? 'Soumission...' : 'Soumettre la demande'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

