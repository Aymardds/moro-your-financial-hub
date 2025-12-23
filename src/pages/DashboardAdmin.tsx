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
    AlertCircle,
    CheckCircle2,
    XCircle,
    ExternalLink
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
import { OrganizationApplication } from '@/types/onboarding';

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
    const [applications, setApplications] = useState<any[]>([]);
    const [pendingValidations, setPendingValidations] = useState<any[]>([]);
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

            // Récupérer les demandes d'organisation en attente
            const { data: applicationsData } = await supabase
                .from('organization_applications')
                .select('*, user_profiles(name, email)')
                .eq('status', 'submitted')
                .order('created_at', { ascending: false });

            if (applicationsData) {
                setApplications(applicationsData);
            }

            // Récupérer les dossiers en attente de validation (Documents soumis)
            // On cherche les applications dont l'utilisateur est en statut 'pending_verification'
            const { data: validationsData } = await supabase
                .from('organization_applications')
                .select(`
                    *,
                    user_profiles!inner (
                        id,
                        name,
                        email,
                        onboarding_status
                    ),
                    organization_documents (*)
                `)
                .eq('user_profiles.onboarding_status', 'pending_verification');

            if (validationsData) {
                setPendingValidations(validationsData);
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

    const handleApplicationAction = async (appId: string, userId: string, action: 'approve' | 'reject') => {
        try {
            if (action === 'approve') {
                // Update application status
                const { error: appError } = await supabase
                    .from('organization_applications')
                    .update({ status: 'approved' })
                    .eq('id', appId);

                if (appError) throw appError;

                // Update user profile status to enable next step (documents)
                const { error: userError } = await supabase
                    .from('user_profiles')
                    .update({ onboarding_status: 'awaiting_docs' })
                    .eq('id', userId);

                if (userError) throw userError;

            } else {
                const { error: appError } = await supabase
                    .from('organization_applications')
                    .update({ status: 'rejected' })
                    .eq('id', appId);

                if (appError) throw appError;
            }

            toast({
                title: action === 'approve' ? 'Demande approuvée' : 'Demande rejetée',
                description: action === 'approve' ? "L'utilisateur peut maintenant soumettre ses documents." : "Le dossier a été rejeté.",
            });

            fetchData();
        } catch (error) {
            console.error('Error processing application:', error);
            toast({
                title: 'Erreur',
                description: "Une erreur est survenue lors du traitement.",
                variant: 'destructive',
            });
        }
    };

    const handleValidationAction = async (userId: string, applicationId: string, action: 'validate' | 'reject') => {
        try {
            if (action === 'validate') {
                // 1. Valider tous les documents
                const { error: docsError } = await supabase
                    .from('organization_documents')
                    .update({ status: 'verified' })
                    .eq('application_id', applicationId);

                if (docsError) throw docsError;

                // 2. Activer le compte de l'utilisateur
                const { error: userError } = await supabase
                    .from('user_profiles')
                    .update({ onboarding_status: 'active' })
                    .eq('id', userId);

                if (userError) throw userError;

                toast({
                    title: 'Compte Activé',
                    description: "Le compte de la coopérative est maintenant pleinement opérationnel.",
                });

            } else {
                // Rejeter -> renvoyer à l'étape upload (awaiting_docs)
                const { error: userError } = await supabase
                    .from('user_profiles')
                    .update({ onboarding_status: 'awaiting_docs' })
                    .eq('id', userId);

                if (userError) throw userError;

                toast({
                    title: 'Dossier Rejeté',
                    description: "L'utilisateur devra soumettre de nouveaux documents.",
                });
            }

            fetchData();
        } catch (error) {
            console.error('Error validating documents:', error);
            toast({
                title: 'Erreur',
                description: "Erreur lors de la validation.",
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
            <Tabs defaultValue="applications" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="applications">Candidatures ({applications.length})</TabsTrigger>
                    <TabsTrigger value="validations">Validations ({pendingValidations.length})</TabsTrigger>
                    <TabsTrigger value="users">Gestion Utilisateurs</TabsTrigger>
                    <TabsTrigger value="organizations">Organisations</TabsTrigger>
                </TabsList>

                <TabsContent value="applications">
                    <Card>
                        <CardHeader>
                            <CardTitle>Candidatures en Attente</CardTitle>
                            <CardDescription>
                                Examinez les demandes d'identification des coopératives/institutions
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8">Chargement...</div>
                            ) : applications.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                                    <p>Aucune candidature en attente</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {applications.map((app) => (
                                        <Card key={app.id} className="p-4 border-l-4 border-l-primary">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-lg">{app.basic_info.name}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Agrément: {app.basic_info.agrement_number} • {app.basic_info.activity_type}
                                                    </p>
                                                    <div className="mt-2 text-sm grid grid-cols-2 gap-x-8 gap-y-1">
                                                        <p><span className="font-medium">Zone:</span> {app.basic_info.zone}</p>
                                                        <p><span className="font-medium">Adhérents:</span> {app.membership_info.adherence_count}</p>
                                                        <p><span className="font-medium">Président:</span> {app.management_info.president_name}</p>
                                                        <p><span className="font-medium">Contact:</span> {app.user_profiles?.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleApplicationAction(app.id, app.user_id, 'reject')}>Rejeter</Button>
                                                    <Button size="sm" onClick={() => handleApplicationAction(app.id, app.user_id, 'approve')}>Approuver</Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="validations">
                    <Card>
                        <CardHeader>
                            <CardTitle>Validation des Documents</CardTitle>
                            <CardDescription>
                                Validez les pièces justificatives pour activer les comptes
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8">Chargement...</div>
                            ) : pendingValidations.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                                    <p>Aucun dossier en attente de validation</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {pendingValidations.map((app) => (
                                        <Card key={app.id} className="p-6 border-l-4 border-l-orange-500">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-bold text-lg">{app.basic_info.name}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {app.user_profiles?.email} • {new Date(app.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="destructive" size="sm" onClick={() => handleValidationAction(app.user_id, app.id, 'reject')}>
                                                        <XCircle className="w-4 h-4 mr-2" />
                                                        Rejeter
                                                    </Button>
                                                    <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={() => handleValidationAction(app.user_id, app.id, 'validate')}>
                                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                                        Valider & Activer
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <h4 className="font-semibold mb-2 text-sm">Informations</h4>
                                                    <div className="text-sm space-y-1 text-gray-600">
                                                        <p>Type: {app.organization_type}</p>
                                                        <p>Agrément: {app.basic_info.agrement_number}</p>
                                                        <p>Zone: {app.basic_info.zone}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold mb-2 text-sm">Documents Soumis</h4>
                                                    <div className="space-y-2">
                                                        {app.organization_documents?.map((doc: any) => (
                                                            <div key={doc.id} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                                                                <div className="flex items-center">
                                                                    <FileText className="h-4 w-4 mr-2 text-blue-500" />
                                                                    <span className="text-sm font-medium capitalize">{doc.document_type.replace('_', ' ')}</span>
                                                                </div>
                                                                <a
                                                                    href={doc.file_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs text-blue-600 hover:underline flex items-center"
                                                                >
                                                                    Voir <ExternalLink className="h-3 w-3 ml-1" />
                                                                </a>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
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
