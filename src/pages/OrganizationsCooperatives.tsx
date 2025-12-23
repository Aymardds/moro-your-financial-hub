import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Building2, Eye, Edit, Users, Shield, Trash2, Pencil, UserPlus } from 'lucide-react';
import { OrganizationDialog } from '@/components/OrganizationDialog';

interface Cooperative {
    id: string;
    email: string;
    phone: string;
    name: string;
    kyc_status: string;
    is_organization_admin: boolean;
    created_at: string;
    _count?: {
        members: number;
    };
}

export default function OrganizationsCooperatives() {
    const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
    const [filteredCooperatives, setFilteredCooperatives] = useState<Cooperative[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // States for CRUD
    const [showOrgDialog, setShowOrgDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
    const [selectedOrg, setSelectedOrg] = useState<any>(null);

    useEffect(() => {
        fetchCooperatives();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            const filtered = cooperatives.filter(
                (c) =>
                    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.phone?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredCooperatives(filtered);
        } else {
            setFilteredCooperatives(cooperatives);
        }
    }, [searchQuery, cooperatives]);

    const fetchCooperatives = async () => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('role', 'cooperative')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Récupérer le nombre de membres pour chaque coopérative
            const cooperativesWithCounts = await Promise.all(
                (data || []).map(async (coop) => {
                    const { count } = await supabase
                        .from('organization_users')
                        .select('*', { count: 'exact', head: true })
                        .eq('organization_id', coop.id);

                    return {
                        ...coop,
                        _count: { members: count || 0 },
                    };
                })
            );

            setCooperatives(cooperativesWithCounts);
            setFilteredCooperatives(cooperativesWithCounts);
        } catch (error: any) {
            console.error('Error fetching cooperatives:', error);
            toast({
                title: 'Erreur',
                description: 'Impossible de charger les coopératives',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setDialogMode('create');
        setSelectedOrg(null);
        setShowOrgDialog(true);
    };

    const handleEdit = (org: Cooperative) => {
        setDialogMode('edit');
        setSelectedOrg(org);
        setShowOrgDialog(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la coopérative "${name}" ? Cette action est irréversible.`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('user_profiles')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({
                title: 'Supprimé',
                description: 'Coopérative supprimée avec succès',
            });

            fetchCooperatives();
        } catch (error: any) {
            console.error('Error deleting:', error);
            toast({
                title: 'Erreur',
                description: 'Impossible de supprimer l\'organisation',
                variant: 'destructive',
            });
        }
    };

    const getKYCBadge = (status: string) => {
        const statusMap: Record<string, { label: string; className: string }> = {
            pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
            approved: { label: 'Approuvé', className: 'bg-green-100 text-green-800' },
            rejected: { label: 'Rejeté', className: 'bg-red-100 text-red-800' },
        };

        const config = statusMap[status] || { label: 'Non soumis', className: 'bg-gray-100 text-gray-800' };
        return <Badge className={config.className}>{config.label}</Badge>;
    };

    return (
        <DashboardLayout
            title="Coopératives"
            description="Liste de toutes les coopératives enregistrées sur la plateforme"
        >
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Liste des Coopératives</CardTitle>
                            <CardDescription>
                                {filteredCooperatives.length} coopérative(s) trouvée(s)
                            </CardDescription>
                        </div>
                        <Button onClick={handleCreate}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Créer une coopérative
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Barre de recherche */}
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher par nom, email ou téléphone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Tableau */}
                    {loading ? (
                        <div className="text-center py-8">Chargement...</div>
                    ) : filteredCooperatives.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {searchQuery ? 'Aucune coopérative trouvée' : 'Aucune coopérative enregistrée'}
                        </div>
                    ) : (
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nom</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Membres</TableHead>
                                        <TableHead>Statut KYC</TableHead>
                                        <TableHead>Date de création</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCooperatives.map((cooperative) => (
                                        <TableRow key={cooperative.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{cooperative.name || 'N/A'}</span>
                                                    {cooperative.is_organization_admin && (
                                                        <Badge variant="outline" className="text-xs">
                                                            <Shield className="h-3 w-3 mr-1" />
                                                            Admin
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <div>{cooperative.email || 'N/A'}</div>
                                                    {cooperative.phone && (
                                                        <div className="text-muted-foreground">{cooperative.phone}</div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                                    <span>{cooperative._count?.members || 0}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getKYCBadge(cooperative.kyc_status)}</TableCell>
                                            <TableCell>
                                                {new Date(cooperative.created_at).toLocaleDateString('fr-FR')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm">
                                                        <Users className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <OrganizationDialog
                open={showOrgDialog}
                onOpenChange={setShowOrgDialog}
                mode={dialogMode}
                type="cooperative"
                initialData={selectedOrg}
                onSuccess={fetchCooperatives}
            />
        </DashboardLayout>
    );
}
