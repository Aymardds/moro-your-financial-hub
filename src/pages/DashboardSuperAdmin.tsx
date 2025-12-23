import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Building2,
  TrendingUp,
  DollarSign,
  Shield,
  Settings,
  FileText,
  BarChart3,
  UserCheck,
  UserX,
  Check,
  AlertCircle,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard-layout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from '@/components/ui/label';

interface UserStats {
  totalUsers: number;
  entrepreneurs: number;
  agents: number;
  cooperatives: number;
  institutions: number;
  admins: number;
  superAdmins: number;
}

interface SystemStats {
  totalOperations: number;
  totalProjects: number;
  totalSavings: number;
  totalSubscriptions: number;
  totalFinancingApplications: number;
}

interface UserProfile {
  id: string;
  email: string;
  phone: string;
  name: string;
  role: string;
  created_at: string;
}

export default function DashboardSuperAdmin() {
  const { user, signOut } = useAuth();
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    entrepreneurs: 0,
    agents: 0,
    cooperatives: 0,
    institutions: 0,
    admins: 0,
    superAdmins: 0,
  });
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalOperations: 0,
    totalProjects: 0,
    totalSavings: 0,
    totalSubscriptions: 0,
    totalFinancingApplications: 0,
  });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pendingOrgs, setPendingOrgs] = useState<any[]>([]);
  const [financingRequests, setFinancingRequests] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Assignment Dialog State
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Statistiques des utilisateurs
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('role');

      if (profiles) {
        const stats: UserStats = {
          totalUsers: profiles.length,
          entrepreneurs: profiles.filter((p) => p.role === 'entrepreneur').length,
          agents: profiles.filter((p) => p.role === 'agent').length,
          cooperatives: profiles.filter((p) => p.role === 'cooperative').length,
          institutions: profiles.filter((p) => p.role === 'institution').length,
          admins: profiles.filter((p) => p.role === 'admin').length,
          superAdmins: profiles.filter((p) => p.role === 'superAdmin').length,
        };
        setUserStats(stats);
      }

      // Organisations en attente
      const { data: pendingData } = await supabase
        .from('user_profiles')
        .select('*')
        .in('role', ['cooperative', 'institution'])
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      setPendingOrgs(pendingData || []);

      // Demandes de financement validées par coopératives (ou en attente admin)
      const { data: financingData } = await supabase
        .from('financing_applications')
        .select(`
          *,
          user_profiles!financing_applications_entrepreneur_id_fkey (
            name,
            email, 
            phone
          ),
          institution:user_profiles!financing_applications_institution_id_fkey (
            name
          )
        `)
        .eq('status', 'submitted_to_admin')
        .order('created_at', { ascending: false });

      setFinancingRequests(financingData || []);

      // Institutions actives pour assignation
      const { data: instData } = await supabase
        .from('user_profiles')
        .select('id, name')
        .eq('role', 'institution')
        .eq('status', 'active'); // Only active institutions

      setInstitutions(instData || []);

      // Statistiques système
      const [operations, projects, savings, subscriptions, applications] = await Promise.all([
        supabase.from('operations').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('savings').select('id', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }),
        supabase.from('financing_applications').select('id', { count: 'exact', head: true }),
      ]);

      setSystemStats({
        totalOperations: operations.count || 0,
        totalProjects: projects.count || 0,
        totalSavings: savings.count || 0,
        totalSubscriptions: subscriptions.count || 0,
        totalFinancingApplications: applications.count || 0,
      });

      // Liste des utilisateurs
      const { data: usersData } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (usersData) {
        const usersWithContact = usersData.map((profile) => {
          return {
            ...profile,
            email: profile.email || 'N/A',
            phone: profile.phone || 'N/A',
          };
        });

        setUsers(usersWithContact);
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

  const handleValidateOrg = async (id: string, status: 'active' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: status === 'active' ? 'Organisation validée' : 'Organisation rejetée',
        description: `L'organisation a été ${status === 'active' ? 'activée' : 'rejetée'} avec succès.`,
      });

      fetchData(); // Refresh
    } catch (error) {
      console.error('Error updating org status:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive"
      });
    }
  };

  const handleAssignInstitution = async () => {
    if (!selectedRequest || !selectedInstitutionId) return;

    try {
      const { error } = await supabase
        .from('financing_applications')
        .update({
          status: 'submitted_to_institution',
          institution_id: selectedInstitutionId
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Dossier transmis à l\'institution financière',
      });

      setShowAssignDialog(false);
      setSelectedRequest(null);
      setSelectedInstitutionId('');
      fetchData();
    } catch (error) {
      console.error('Error assigning institution:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'assigner l\'institution',
        variant: 'destructive',
      });
    }
  };

  const handleRejectByAdmin = async (id: string) => {
    try {
      const { error } = await supabase
        .from('financing_applications')
        .update({ status: 'rejected_by_admin' })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Dossier rejeté',
        description: 'La demande a été rejetée par l\'administration',
      });
      fetchData();
    } catch (error) {
      toast({ title: 'Erreur', description: 'Action impossible', variant: 'destructive' });
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Rôle mis à jour avec succès',
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour le rôle',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superAdmin':
        return 'bg-red-100 text-red-800';
      case 'admin':
        return 'bg-orange-100 text-orange-800';
      case 'institution':
        return 'bg-purple-100 text-purple-800';
      case 'cooperative':
        return 'bg-blue-100 text-blue-800';
      case 'agent':
        return 'bg-green-100 text-green-800';
      case 'entrepreneur':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superAdmin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'institution':
        return 'Institution';
      case 'cooperative':
        return 'Coopérative';
      case 'agent':
        return 'Agent';
      case 'entrepreneur':
        return 'Entrepreneur';
      default:
        return role;
    }
  };

  return (
    <DashboardLayout title="Dashboard Super Admin" description="Administration complète de la plateforme">

      {/* Section Validation Organisations */}
      {pendingOrgs.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50 mb-6">
          <CardHeader>
            <CardTitle className="text-orange-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Validations en Attente ({pendingOrgs.length})
            </CardTitle>
            <CardDescription>
              Ces organisations attendent votre validation pour accéder à la plateforme.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingOrgs.map((org) => (
                <div key={org.id} className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
                  <div>
                    <h4 className="font-medium text-lg">{org.name}</h4>
                    <div className="text-sm text-muted-foreground flex gap-4">
                      <span>{org.role === 'cooperative' ? 'Coopérative' : 'Institution'}</span>
                      <span>{org.email}</span>
                      <span>{org.phone}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleValidateOrg(org.id, 'active')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Valider
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleValidateOrg(org.id, 'rejected')}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Rejeter
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques utilisateurs */}
      <div className="grid gap-4 md:grid-cols-7">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entrepreneurs</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.entrepreneurs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.agents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coopératives</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.cooperatives}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Institutions</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.institutions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.admins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.superAdmins}</div>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques système */}
      <div className="grid gap-4 md:grid-cols-5 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opérations</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalOperations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalProjects}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Épargnes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalSavings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnements</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalSubscriptions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demandes Financement</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalFinancingApplications}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="financing" className="space-y-4">
        <TabsList>
          <TabsTrigger value="financing">Financements</TabsTrigger>
          <TabsTrigger value="users">Gestion Utilisateurs</TabsTrigger>
          <TabsTrigger value="settings">Paramètres Système</TabsTrigger>
        </TabsList>

        <TabsContent value="financing">
          <Card>
            <CardHeader>
              <CardTitle>Demandes de Financement (Validation Admin)</CardTitle>
              <CardDescription>
                Validez les demandes approuvées par les coopératives et assignez-les aux institutions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {financingRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune demande en attente de validation admin.
                </div>
              ) : (
                <div className="space-y-4">
                  {financingRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50/50 border-yellow-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-lg">{req.amount.toLocaleString('fr-FR')} FCFA</p>
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                            En Attente Admin
                          </Badge>
                        </div>
                        <p className="font-medium mt-1">{req.user_profiles?.name}</p>
                        <p className="text-sm text-muted-foreground">{req.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Score IA: {req.ai_score?.score || req.score || 'N/A'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(req);
                            setShowAssignDialog(true);
                          }}
                        >
                          Valider & Assigner
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectByAdmin(req.id)}
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
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Liste des Utilisateurs</CardTitle>
              <CardDescription>
                Gérez les utilisateurs et leurs rôles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email / Téléphone</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Date d'inscription</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((userProfile) => (
                      <TableRow key={userProfile.id}>
                        <TableCell>
                          <div className="text-sm">
                            <div>{userProfile.email}</div>
                            {userProfile.phone && (
                              <div className="text-muted-foreground">{userProfile.phone}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{userProfile.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(userProfile.role)}>
                            {getRoleLabel(userProfile.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(userProfile.created_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          <select
                            value={userProfile.role}
                            onChange={(e) => handleRoleChange(userProfile.id, e.target.value)}
                            className="text-sm border rounded px-2 py-1"
                          >
                            <option value="entrepreneur">Entrepreneur</option>
                            <option value="agent">Agent</option>
                            <option value="cooperative">Coopérative</option>
                            <option value="institution">Institution</option>
                            <option value="admin">Admin</option>
                            <option value="superAdmin">Super Admin</option>
                          </select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres Système</CardTitle>
              <CardDescription>
                Configuration de la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Statut du système</h3>
                    <p className="text-sm text-muted-foreground">État général de la plateforme</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Opérationnel</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Version</h3>
                    <p className="text-sm text-muted-foreground">Version actuelle de l'application</p>
                  </div>
                  <span className="text-sm font-medium">v1.0.0</span>
                </div>
                <Button className="w-full" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Paramètres avancés
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assigner une Institution</DialogTitle>
            <DialogDescription>
              Sélectionnez l'institution financière qui traitera cette demande de {selectedRequest?.amount?.toLocaleString()} FCFA.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="institution" className="text-right">
                Institution
              </Label>
              <div className="col-span-3">
                <Select
                  value={selectedInstitutionId}
                  onValueChange={setSelectedInstitutionId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une institution" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.name || 'Institution sans nom'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Annuler</Button>
            <Button onClick={handleAssignInstitution} disabled={!selectedInstitutionId}>Assigner</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
