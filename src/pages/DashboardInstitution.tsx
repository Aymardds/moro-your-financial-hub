import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, FileText, TrendingUp, Users, CheckCircle2, Shield } from 'lucide-react';
import { KYCValidationList } from '@/components/KYCValidationList';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PermissionManager } from '@/components/PermissionManager';
import { UserInviteDialog } from '@/components/UserInviteDialog';
interface Application {
  id: string;
  entrepreneur_id: string;
  entrepreneur_name: string;
  amount: number;
  status: string;
  score: number;
  ai_score: any;
  description: string;
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

export default function DashboardInstitution() {
  const { user, signOut } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [orgUsers, setOrgUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showPermissionManager, setShowPermissionManager] = useState(false);
  const [selectedUser, setSelectedUser] = useState<OrganizationUser | null>(null);
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
      // Récupérer les demandes de financement assignées à cette institution
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
            ai_score: app.ai_score,
            description: app.description,
            created_at: app.created_at,
          }))
        );

        const pending = applicationsData.filter((a: any) => a.status === 'submitted_to_institution').length;
        const approved = applicationsData.filter((a: any) => a.status === 'approved').length;
        const volume = applicationsData
          .filter((a: any) => a.status === 'approved')
          .reduce((sum: number, a: any) => sum + a.amount, 0);

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
    <DashboardLayout title="Dashboard Institution" description="Gestion des demandes de financement">
      <div className="grid gap-4 md:grid-cols-4">
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
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
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
                            <p className="text-sm text-muted-foreground mt-1">{application.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              {application.ai_score?.score || application.score || 'N/A'}
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
                              className={`inline-block mt-2 text-xs px-2 py-1 rounded ${application.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : application.status === 'submitted_to_institution'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                            >
                              {application.status === 'approved'
                                ? 'Approuvé'
                                : application.status === 'submitted_to_institution'
                                  ? 'En attente d\'examen'
                                  : application.status === 'pending' // Legacy support
                                    ? 'En attente'
                                    : 'Rejeté'}
                            </span>
                          </div>
                          {(application.status === 'submitted_to_institution' || application.status === 'pending') && (
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

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestion des Utilisateurs</CardTitle>
                  <CardDescription>Gérez les employés de votre institution</CardDescription>
                </div>
                <Button size="sm" onClick={() => setShowInviteDialog(true)}>
                  <Users className="h-4 w-4 mr-2" />
                  Inviter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : orgUsers.length === 0 ? (
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
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {user && (
        <UserInviteDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          organizationId={user.id}
          organizationType="institution"
          onSuccess={() => {
            fetchData();
            toast({ title: 'Succès', description: 'Invitation envoyée avec succès' });
          }}
        />
      )}

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
    </DashboardLayout>
  );
}
