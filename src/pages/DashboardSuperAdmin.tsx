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
  UserX
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface UserStats {
  totalUsers: number;
  entrepreneurs: number;
  agents: number;
  cooperatives: number;
  institutions: number;
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
  const [loading, setLoading] = useState(true);

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
          superAdmins: profiles.filter((p) => p.role === 'superAdmin').length,
        };
        setUserStats(stats);
      }

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
        // Pour obtenir les emails, on doit utiliser une fonction Supabase ou les stocker dans user_profiles
        // Pour l'instant, on utilise les données disponibles
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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6 text-red-500" />
                Dashboard Super Admin
              </h1>
              <p className="text-sm text-muted-foreground">
                Administration complète de la plateforme
              </p>
            </div>
            <Button variant="outline" onClick={signOut}>
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Statistiques utilisateurs */}
        <div className="grid gap-4 md:grid-cols-6 mb-6">
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

        {/* Gestion des utilisateurs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Gestion Utilisateurs</TabsTrigger>
            <TabsTrigger value="settings">Paramètres Système</TabsTrigger>
          </TabsList>

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
      </div>
    </div>
  );
}

