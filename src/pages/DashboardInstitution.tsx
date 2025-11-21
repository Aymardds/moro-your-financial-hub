import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, FileText, TrendingUp, Users, CheckCircle2, Shield } from 'lucide-react';
import { KYCValidationList } from '@/components/KYCValidationList';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Application {
  id: string;
  entrepreneur_id: string;
  entrepreneur_name: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  score: number;
  created_at: string;
}

export default function DashboardInstitution() {
  const { user, signOut } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    totalVolume: 0,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Récupérer les demandes de financement
      const { data: applicationsData } = await supabase
        .from('financing_applications')
        .select('*, user_profiles!financing_applications_entrepreneur_id_fkey(*)')
        .eq('institution_id', user.id)
        .order('created_at', { ascending: false });

      if (applicationsData) {
        setApplications(
          applicationsData.map((app: any) => ({
            id: app.id,
            entrepreneur_id: app.entrepreneur_id,
            entrepreneur_name: app.user_profiles?.name || 'Entrepreneur',
            amount: app.amount,
            status: app.status,
            score: app.score || 0,
            created_at: app.created_at,
          }))
        );

        const pending = applicationsData.filter((a: any) => a.status === 'pending').length;
        const approved = applicationsData.filter((a: any) => a.status === 'approved').length;
        const volume = applicationsData
          .filter((a: any) => a.status === 'approved')
          .reduce((sum: number, a: any) => sum + a.amount, 0);

        setStats({
          totalApplications: applicationsData.length,
          pendingApplications: pending,
          approvedApplications: approved,
          totalVolume: volume,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('financing_applications')
        .update({ status: 'approved' })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Demande approuvée avec succès',
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'approuver la demande',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('financing_applications')
        .update({ status: 'rejected' })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Demande rejetée',
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de rejeter la demande',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard Institution</h1>
              <p className="text-sm text-muted-foreground">
                Gestion des demandes de financement
              </p>
            </div>
            <Button variant="outline" onClick={signOut}>
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Demandes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalApplications}</div>
              <p className="text-xs text-muted-foreground">Total demandes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingApplications}</div>
              <p className="text-xs text-muted-foreground">En attente d'examen</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approuvées</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvedApplications}</div>
              <p className="text-xs text-muted-foreground">Demandes approuvées</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Volume</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalVolume.toLocaleString('fr-FR')} FCFA
              </div>
              <p className="text-xs text-muted-foreground">Volume total financé</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="applications" className="space-y-4">
          <TabsList>
            <TabsTrigger value="applications">Demandes de Financement</TabsTrigger>
            <TabsTrigger value="kyc">Validations KYC</TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Demandes de Financement</CardTitle>
                <CardDescription>
                  Examinez et approuvez les demandes de financement avec scoring IA
                </CardDescription>
              </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Chargement...</div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune demande de financement
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <Card key={application.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{application.entrepreneur_name}</CardTitle>
                          <CardDescription>
                            Montant demandé: {application.amount.toLocaleString('fr-FR')} FCFA
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {application.score}/100
                          </div>
                          <p className="text-xs text-muted-foreground">Score IA</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Date: {new Date(application.created_at).toLocaleDateString('fr-FR')}
                          </p>
                          <span
                            className={`inline-block mt-2 text-xs px-2 py-1 rounded ${
                              application.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : application.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {application.status === 'approved'
                              ? 'Approuvé'
                              : application.status === 'pending'
                              ? 'En attente'
                              : 'Rejeté'}
                          </span>
                        </div>
                        {application.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(application.id)}
                            >
                              Rejeter
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(application.id)}
                            >
                              Approuver
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="kyc">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Validations KYC des Entrepreneurs
                </CardTitle>
                <CardDescription>
                  Validez les documents KYC des entrepreneurs avant d'approuver leurs demandes de financement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <KYCValidationList entityType="entrepreneur" canApprove={true} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

