import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Users,
    Building2,
    Shield,
    Settings,
    FileText,
    UserCheck,
    AlertCircle
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

interface UserProfile {
    id: string;
    email: string;
    phone: string;
    name: string;
    role: string;
    created_at: string;
}

interface Stats {
    totalUsers: number;
    cooperatives: number;
    institutions: number;
    entrepreneurs: number;
    agents: number;
}

export default function DashboardAdmin() {
    const { user, signOut } = useAuth();
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        cooperatives: 0,
        institutions: 0,
        entrepreneurs: 0,
        agents: 0,
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
            // Statistiques des utilisateurs (admins ne peuvent pas voir superAdmins)
            const { data: profiles } = await supabase
                .from('user_profiles')
                .select('role')
                .neq('role', 'superAdmin');

            if (profiles) {
                const statsData: Stats = {
                    totalUsers: profiles.length,
                    cooperatives: profiles.filter((p) => p.role === 'cooperative').length,
                    institutions: profiles.filter((p) => p.role === 'institution').length,
                    entrepreneurs: profiles.filter((p) => p.role === 'entrepreneur').length,
                    agents: profiles.filter((p) => p.role === 'agent').length,
                };
                setStats(statsData);
            }

            // Liste des utilisateurs (sauf superAdmins)
            const { data: usersData } = await supabase
                .from('user_profiles')
                .select('*')
                .neq('role', 'superAdmin')
                .order('created_at', { ascending: false })
                .limit(50);

            if (usersData) {
                const usersWithContact = usersData.map((profile) => ({
                    ...profile,
                    email: profile.email || 'N/A',
                    phone: profile.phone || 'N/A',
                }));
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
        // Admins ne peuvent pas promouvoir en superAdmin ou admin
        if (newRole === 'superAdmin' || newRole === 'admin') {
            toast({
                title: 'Erreur',
                description: 'Vous n\'avez pas les permissions pour ce rôle',
                variant: 'destructive',
            });
            return;
        }

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
        <DashboardLayout title="Dashboard Admin" description="Gestion des utilisateurs et organisations">
            {/* Statistiques */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Coopératives</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.cooperatives}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Institutions</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.institutions}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Entrepreneurs</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.entrepreneurs}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Agents</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.agents}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Gestion */}
            <Tabs defaultValue="users" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="users">Gestion Utilisateurs</TabsTrigger>
                    <TabsTrigger value="organizations">Organisations</TabsTrigger>
                </TabsList>

                <TabsContent value="users">
                    <Card>
                        <CardHeader>
                            <CardTitle>Liste des Utilisateurs</CardTitle>
                            <CardDescription>
                                Gérez les utilisateurs (sauf Super Admins)
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

                <TabsContent value="organizations">
                    <Card>
                        <CardHeader>
                            <CardTitle>Organisations</CardTitle>
                            <CardDescription>
                                Gérez les coopératives et institutions financières
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-muted-foreground">
                                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                                <p>Fonctionnalité en développement</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </DashboardLayout>
    );
}
