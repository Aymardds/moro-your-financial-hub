import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, Wallet, PiggyBank, FolderKanban, ArrowUpRight, ArrowDownRight, Shield, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { KYCForm } from '@/components/KYCForm';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard-layout';

interface Operation {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  target_amount: number;
  current_amount: number;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
}

interface Savings {
  id: string;
  name: string;
  amount: number;
  target: number;
  created_at: string;
}

export default function DashboardEntrepreneur() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [savings, setSavings] = useState<Savings[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [kycStatus, setKycStatus] = useState<'pending' | 'in_review' | 'approved' | 'rejected' | null>(null);
  const [showKYCForm, setShowKYCForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
      fetchKYCStatus();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Récupérer les opérations
      const { data: opsData } = await supabase
        .from('operations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (opsData) {
        setOperations(opsData);
        const income = opsData.filter(o => o.type === 'income').reduce((sum, o) => sum + o.amount, 0);
        const expense = opsData.filter(o => o.type === 'expense').reduce((sum, o) => sum + o.amount, 0);
        setTotalIncome(income);
        setTotalExpense(expense);
      }

      // Récupérer les projets
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (projectsData) {
        setProjects(projectsData);
      }

      // Récupérer l'épargne
      const { data: savingsData } = await supabase
        .from('savings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (savingsData) {
        setSavings(savingsData);
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

  const fetchKYCStatus = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('kyc_validations')
        .select('status')
        .eq('user_id', user.id)
        .eq('entity_type', 'entrepreneur')
        .order('submitted_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setKycStatus(data.status);
      }
    } catch (error) {
      // Pas de KYC soumis encore
      setKycStatus(null);
    }
  };

  const balance = totalIncome - totalExpense;

  return (
    <DashboardLayout title="Dashboard Entrepreneur" description={`Bienvenue, ${user?.phone || 'Utilisateur'}`}>
      {/* Statistiques rapides */}
      <div className="grid gap-4 md:grid-cols-3">

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{balance.toLocaleString('fr-FR')} FCFA</div>
            <p className="text-xs text-muted-foreground">
              {totalIncome.toLocaleString('fr-FR')} FCFA de revenus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets Actifs</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {projects.length} projet(s) au total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Épargne</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {savings.reduce((sum, s) => sum + s.amount, 0).toLocaleString('fr-FR')} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              {savings.length} objectif(s) d'épargne
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerte KYC */}
      {kycStatus !== 'approved' && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-lg">Validation KYC Requise</CardTitle>
              </div>
              {kycStatus && (
                <Badge className={
                  kycStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    kycStatus === 'in_review' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                }>
                  {kycStatus === 'pending' ? 'En attente' :
                    kycStatus === 'in_review' ? 'En examen' :
                      'Rejeté'}
                </Badge>
              )}
            </div>
            <CardDescription>
              Complétez votre validation KYC pour accéder à toutes les fonctionnalités, notamment les demandes de financement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowKYCForm(true)}>
              {kycStatus ? 'Mettre à jour ma validation KYC' : 'Commencer la validation KYC'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Formulaire KYC */}
      {showKYCForm && (
        <div className="mb-6">
          <KYCForm
            entityType="entrepreneur"
            onSuccess={() => {
              setShowKYCForm(false);
              fetchKYCStatus();
            }}
          />
        </div>
      )}

      {/* Onglets principaux */}
      <Tabs defaultValue="operations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="operations">Opérations</TabsTrigger>
          <TabsTrigger value="projects">Projets</TabsTrigger>
          <TabsTrigger value="savings">Épargne</TabsTrigger>
          <TabsTrigger value="kyc">KYC</TabsTrigger>
        </TabsList>

        {/* Onglet Opérations */}
        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Opérations Récentes</CardTitle>
                  <CardDescription>Vos dernières transactions</CardDescription>
                </div>
                <Button onClick={() => navigate('/operations/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle opération
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : operations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune opération enregistrée
                </div>
              ) : (
                <div className="space-y-2">
                  {operations.map((op) => (
                    <div
                      key={op.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {op.type === 'income' ? (
                          <ArrowDownRight className="h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{op.description}</p>
                          <p className="text-sm text-muted-foreground">{op.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${op.type === 'income' ? 'text-green-500' : 'text-red-500'
                            }`}
                        >
                          {op.type === 'income' ? '+' : '-'}
                          {op.amount.toLocaleString('fr-FR')} FCFA
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(op.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Projets */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Mes Projets</CardTitle>
                  <CardDescription>Gérez vos projets et objectifs financiers</CardDescription>
                </div>
                <Button onClick={() => navigate('/projects/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau projet
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun projet créé
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {projects.map((project) => {
                    const progress = (project.current_amount / project.target_amount) * 100;
                    return (
                      <Card key={project.id}>
                        <CardHeader>
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <CardDescription>{project.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Progression</span>
                              <span className="font-medium">
                                {project.current_amount.toLocaleString('fr-FR')} /{' '}
                                {project.target_amount.toLocaleString('fr-FR')} FCFA
                              </span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {progress.toFixed(0)}% complété
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded ${project.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : project.status === 'completed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                  }`}
                              >
                                {project.status === 'active'
                                  ? 'Actif'
                                  : project.status === 'completed'
                                    ? 'Terminé'
                                    : 'En pause'}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Épargne */}
        <TabsContent value="savings" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Objectifs d'Épargne</CardTitle>
                  <CardDescription>Suivez vos économies et objectifs</CardDescription>
                </div>
                <Button onClick={() => navigate('/savings/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvel objectif
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : savings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun objectif d'épargne défini
                </div>
              ) : (
                <div className="space-y-4">
                  {savings.map((saving) => {
                    const progress = (saving.amount / saving.target) * 100;
                    return (
                      <Card key={saving.id}>
                        <CardHeader>
                          <CardTitle className="text-lg">{saving.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Épargné</span>
                              <span className="font-medium">
                                {saving.amount.toLocaleString('fr-FR')} /{' '}
                                {saving.target.toLocaleString('fr-FR')} FCFA
                              </span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {progress.toFixed(0)}% de l'objectif atteint
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet KYC */}
        <TabsContent value="kyc" className="space-y-4">
          {kycStatus === 'approved' ? (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-lg">Validation KYC Approuvée</CardTitle>
                </div>
                <CardDescription>
                  Votre validation KYC a été approuvée. Vous pouvez maintenant accéder à toutes les fonctionnalités.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <KYCForm
              entityType="entrepreneur"
              onSuccess={() => {
                fetchKYCStatus();
              }}
            />
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

