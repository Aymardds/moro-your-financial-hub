import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Building2, TrendingUp, FileText, Shield } from 'lucide-react';
import { KYCValidationList } from '@/components/KYCValidationList';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Member {
  id: string;
  name: string;
  phone: string;
  contribution: number;
  created_at: string;
}

interface Loan {
  id: string;
  member_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'repaid';
  created_at: string;
}

export default function DashboardCooperative() {
  const { user, signOut } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalContributions: 0,
    activeLoans: 0,
    totalLoans: 0,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Récupérer les membres
      const { data: membersData } = await supabase
        .from('cooperative_members')
        .select('*, user_profiles(*)')
        .eq('cooperative_id', user.id);

      if (membersData) {
        setMembers(membersData.map((m: any) => ({
          id: m.user_id,
          name: m.user_profiles?.name || 'Membre',
          phone: m.user_profiles?.phone || 'N/A',
          contribution: m.contribution || 0,
          created_at: m.created_at,
        })));
      }

      // Récupérer les prêts
      const { data: loansData } = await supabase
        .from('cooperative_loans')
        .select('*')
        .eq('cooperative_id', user.id)
        .order('created_at', { ascending: false });

      if (loansData) {
        setLoans(loansData);
        const active = loansData.filter((l: Loan) => l.status === 'approved').length;
        const total = loansData.reduce((sum: number, l: Loan) => sum + l.amount, 0);

        setStats({
          totalMembers: membersData?.length || 0,
          totalContributions: membersData?.reduce((sum: number, m: any) => sum + (m.contribution || 0), 0) || 0,
          activeLoans: active,
          totalLoans: total,
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard Coopérative</h1>
              <p className="text-sm text-muted-foreground">
                Gestion des membres et prêts
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
              <CardTitle className="text-sm font-medium">Membres</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMembers}</div>
              <p className="text-xs text-muted-foreground">Membres actifs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contributions</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalContributions.toLocaleString('fr-FR')} FCFA
              </div>
              <p className="text-xs text-muted-foreground">Total contributions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prêts Actifs</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeLoans}</div>
              <p className="text-xs text-muted-foreground">Prêts en cours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Volume Prêts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalLoans.toLocaleString('fr-FR')} FCFA
              </div>
              <p className="text-xs text-muted-foreground">Volume total</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="members" className="space-y-4">
          <TabsList>
            <TabsTrigger value="members">Membres</TabsTrigger>
            <TabsTrigger value="loans">Prêts</TabsTrigger>
            <TabsTrigger value="kyc">Validations KYC</TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Membres de la Coopérative</CardTitle>
                <CardDescription>Liste des membres et leurs contributions</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Chargement...</div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun membre enregistré
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {member.contribution.toLocaleString('fr-FR')} FCFA
                          </p>
                          <p className="text-xs text-muted-foreground">Contribution</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loans">
            <Card>
              <CardHeader>
                <CardTitle>Demandes de Prêts</CardTitle>
                <CardDescription>Gérer les demandes de prêts des membres</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Chargement...</div>
                ) : loans.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune demande de prêt
                  </div>
                ) : (
                  <div className="space-y-2">
                    {loans.map((loan) => (
                      <div
                        key={loan.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {loan.amount.toLocaleString('fr-FR')} FCFA
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(loan.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              loan.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : loan.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : loan.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {loan.status === 'approved'
                              ? 'Approuvé'
                              : loan.status === 'pending'
                              ? 'En attente'
                              : loan.status === 'rejected'
                              ? 'Rejeté'
                              : 'Remboursé'}
                          </span>
                          {loan.status === 'pending' && (
                            <Button size="sm" variant="outline">
                              Examiner
                            </Button>
                          )}
                        </div>
                      </div>
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
                  Validations KYC des Membres
                </CardTitle>
                <CardDescription>
                  Validez les documents KYC des membres de la coopérative
                </CardDescription>
              </CardHeader>
              <CardContent>
                <KYCValidationList entityType="cooperative" canApprove={true} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

