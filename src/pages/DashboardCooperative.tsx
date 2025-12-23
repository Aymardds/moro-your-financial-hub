import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Building2, TrendingUp, FileText, Shield, MapPin, Clock } from 'lucide-react';
import { KYCValidationList } from '@/components/KYCValidationList';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PermissionManager } from '@/components/PermissionManager';
import { UserInviteDialog } from '@/components/UserInviteDialog';
import { KYCMemberForm } from '@/components/KYCMemberForm';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CooperativeIdentificationForm } from '@/components/onboarding/CooperativeIdentificationForm';
import { OrganizationDocumentUpload } from '@/components/onboarding/OrganizationDocumentUpload';
import { OnboardingStatus } from '@/types/onboarding';

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

interface OrganizationUser {
  id: string;
  user_id: string;
  role: 'admin' | 'member' | 'viewer';
  permissions: any;
  user_profiles: {
    name: string;
    email: string;
    phone: string;
  };
}

export default function DashboardCooperative() {
  const { user, signOut } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [orgUsers, setOrgUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showPermissionManager, setShowPermissionManager] = useState(false);
  const [selectedUser, setSelectedUser] = useState<OrganizationUser | null>(null);

  // Onboarding State
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);

  // KYC Member Form
  const [showKYCForm, setShowKYCForm] = useState(false);
  const [selectedUserForKYC, setSelectedUserForKYC] = useState<OrganizationUser | null>(null);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalContributions: 0,
    activeLoans: 0,
    totalLoans: 0,
    pendingApplications: 0,
  });

  useEffect(() => {
    if (user) {
      checkOnboardingStatus();
    }
  }, [user]);

  const checkOnboardingStatus = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('onboarding_status')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Cast the string from DB to the specific type
      const status = (data?.onboarding_status || 'incomplete') as OnboardingStatus;
      setOnboardingStatus(status);

      if (status === 'active') {
        fetchData();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking status:', error);
      setLoading(false);
    }
  };

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

      // Récupérer les prêts internes
      const { data: loansData } = await supabase
        .from('cooperative_loans')
        .select('*')
        .eq('cooperative_id', user.id)
        .order('created_at', { ascending: false });

      // Récupérer les demandes de financement
      const { data: appsData } = await supabase
        .from('financing_applications')
        .select(`
          *,
          user_profiles!financing_applications_entrepreneur_id_fkey (
            name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (appsData) {
        setApplications(appsData);
      }

      // Récupérer les utilisateurs de l'organisation
      const { data: orgUsersData } = await supabase
        .from('organization_users')
        .select(`
          *,
          user_profiles!organization_users_user_id_fkey (
            name,
            email,
            phone
          )
        `)
        .eq('organization_id', user.id);

      if (orgUsersData) {
        setOrgUsers(orgUsersData as any);
      }

      if (loansData) {
        setLoans(loansData);
        const active = loansData.filter((l: Loan) => l.status === 'approved').length;
        const total = loansData.reduce((sum: number, l: Loan) => sum + l.amount, 0);
        const pendingApps = appsData?.filter((a: any) => a.status === 'submitted_to_coop').length || 0;

        setStats({
          totalMembers: membersData?.length || 0,
          totalContributions: membersData?.reduce((sum: number, m: any) => sum + (m.contribution || 0), 0) || 0,
          activeLoans: active,
          totalLoans: total,
          pendingApplications: pendingApps,
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

  const handleValidation = async (id: string, action: 'approve' | 'reject') => {
    try {
      const statusToSet = action === 'approve' ? 'submitted_to_admin' : 'rejected_by_coop';

      const { error } = await supabase
        .from('financing_applications')
        .update({ status: statusToSet })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `La demande a été ${action === 'approve' ? 'validée' : 'rejetée'}`,
      });
      fetchData();
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: 'Erreur',
        description: 'Action impossible',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Chargement..." description="">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  // ONBOARDING FLOW RENDEING

  if (onboardingStatus === 'incomplete') {
    return (
      <DashboardLayout title="Finalisez votre inscription" description="Complétez les informations de votre coopérative">
        <CooperativeIdentificationForm />
      </DashboardLayout>
    );
  }

  if (onboardingStatus === 'pending_approval') {
    return (
      <DashboardLayout title="En attente de validation" description="Votre dossier est en cours d'examen">
        <div className="max-w-md mx-auto mt-10">
          <Card className="text-center p-6">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <CardTitle>Dossier soumis avec succès</CardTitle>
              <CardDescription>
                Merci d'avoir complété le formulaire d'identification.
                L'administration examine actuellement votre demande. Vous recevrez une notification
                une fois que votre compte sera prêt pour l'étape suivante (soumission des documents).
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout >
    );
  }

  if (onboardingStatus === 'awaiting_docs') {
    return (
      <DashboardLayout title="Documents requis" description="Veuillez fournir les pièces justificatives">
        <OrganizationDocumentUpload />
      </DashboardLayout>
    );
  }

  if (onboardingStatus === 'pending_verification') {
    return (
      <DashboardLayout title="Vérification des documents" description="Vos pièces sont en cours de traitement">
        <div className="max-w-md mx-auto mt-10">
          <Card className="text-center p-6">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Documents en cours d'analyse</CardTitle>
              <CardDescription>
                Vos documents ont bien été reçus. Nos équipes procèdent à leur vérification.
                Une fois validés, votre compte sera pleinement activé.
                L'administration examine actuellement votre demande. Vous recevrez une notification
                une fois que votre compte sera prêt pour l'étape suivante (soumission des documents).
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (onboardingStatus === 'active') {
    return (
      <DashboardLayout title="Dashboard Coopérative" description="Gestion des membres et prêts">
        <div className="grid gap-4 md:grid-cols-4">
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
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="kyc">Validations KYC</TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Membres de la Coopérative</CardTitle>
                <CardDescription>Liste des membres et leurs contributions</CardDescription>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
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
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Demandes de Financement (Interne)</CardTitle>
                <CardDescription>Demandes à traiter par la coopérative</CardDescription>
              </CardHeader>
              <CardContent>
                {applications.filter(a => a.status === 'submitted_to_coop').length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune demande en attente
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.filter(a => a.status === 'submitted_to_coop').map((app) => (
                      <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg bg-blue-50/50 border-blue-100">
                        <div>
                          <p className="font-semibold text-lg">{app.amount.toLocaleString('fr-FR')} FCFA</p>
                          <p className="font-medium">{app.user_profiles?.name}</p>
                          <p className="text-sm text-muted-foreground">{app.description}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              Score IA: {app.ai_score?.score || app.score || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleValidation(app.id, 'approve')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Valider
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleValidation(app.id, 'reject')}
                          >
                            Rejeter
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prêts Internes Coopérative</CardTitle>
                <CardDescription>Gérer les prêts sur fonds propres</CardDescription>
              </CardHeader>
              <CardContent>
                {loans.length === 0 ? (
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
                            className={`text-xs px-2 py-1 rounded ${loan.status === 'approved'
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

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gestion des Utilisateurs</CardTitle>
                    <CardDescription>Gérez les utilisateurs de votre coopérative</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setShowInviteDialog(true)}>
                    <Users className="h-4 w-4 mr-2" />
                    Inviter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {orgUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun utilisateur trouvé
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orgUsers.map((orgUser) => (
                      <div
                        key={orgUser.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            {orgUser.role === 'admin' ? <Shield className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{orgUser.user_profiles?.name || 'Utilisateur'}</p>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${orgUser.role === 'admin' ? 'bg-red-100 text-red-800' :
                                orgUser.role === 'member' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                {orgUser.role === 'admin' ? 'Admin' : orgUser.role === 'member' ? 'Membre' : 'Observateur'}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {orgUser.user_profiles?.email || orgUser.user_profiles?.phone || 'Sans contact'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(orgUser);
                              setShowPermissionManager(true);
                            }}
                          >
                            Gérer
                          </Button>

                          {orgUser.role === 'member' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUserForKYC(orgUser);
                                setShowKYCForm(true);
                              }}
                            >
                              <MapPin className="h-4 w-4 mr-2" />
                              KYC
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

        {
          user && (
            <UserInviteDialog
              open={showInviteDialog}
              onOpenChange={setShowInviteDialog}
              organizationId={user.id}
              organizationType="cooperative"
              onSuccess={() => {
                fetchData();
                toast({ title: 'Succès', description: 'Invitation envoyée avec succès' });
              }}
            />
          )
        }

        {selectedUser && (
          <PermissionManager
            open={showPermissionManager}
            onOpenChange={(open) => {
              setShowPermissionManager(open);
              if (!open) setSelectedUser(null);
            }}
            organizationUserId={selectedUser.id}
            currentRole={selectedUser.role}
            currentPermissions={selectedUser.permissions}
            userName={selectedUser.user_profiles?.name || 'Utilisateur'}
            onSuccess={() => {
              fetchData();
              setSelectedUser(null);
            }}
          />
        )}

        <Dialog open={showKYCForm} onOpenChange={setShowKYCForm}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
            {selectedUserForKYC && (
              <KYCMemberForm
                userId={selectedUserForKYC.user_id}
                onSuccess={() => {
                  setShowKYCForm(false);
                  fetchData();
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    );
  }

  // Default Render if status is something else
  return (
    <DashboardLayout title="Accès restreint" description="Votre compte n'est pas encore actif">
      <div className="flex justify-center p-10">
        <p>Veuillez contacter l'administrateur.</p>
      </div>
    </DashboardLayout>
  )
}

