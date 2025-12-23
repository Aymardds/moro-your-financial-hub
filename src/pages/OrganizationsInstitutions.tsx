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
import { Search, Building2, Eye, Edit, FileText, Shield, Trash2, Pencil } from 'lucide-react';
import { OrganizationDialog } from '@/components/OrganizationDialog';

interface Institution {
    id: string;
    email: string;
    phone: string;
    name: string;
    kyc_status: string;
    is_organization_admin: boolean;
    created_at: string;
    _count?: {
        applications: number;
    };
}

export default function OrganizationsInstitutions() {
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [filteredInstitutions, setFilteredInstitutions] = useState<Institution[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // States for CRUD
    const [showOrgDialog, setShowOrgDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
    const [selectedOrg, setSelectedOrg] = useState<any>(null);

    useEffect(() => {
        fetchInstitutions();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            const filtered = institutions.filter(
                (i) =>
                    i.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    i.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    i.phone?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredInstitutions(filtered);
        } else {
            setFilteredInstitutions(institutions);
        }
    }, [searchQuery, institutions]);

    const fetchInstitutions = async () => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('role', 'institution')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Récupérer le nombre de demandes de financement pour chaque institution
            const institutionsWithCounts = await Promise.all(
                (data || []).map(async (inst) => {
                    const { count } = await supabase
                        .from('financing_applications')
                        .select('*', { count: 'exact', head: true })
                        .eq('institution_id', inst.id);

                    return {
                        ...inst,
                        _count: { applications: count || 0 },
                    };
                })
            );

            setInstitutions(institutionsWithCounts);
            setFilteredInstitutions(institutionsWithCounts);
        } catch (error: any) {
            console.error('Error fetching institutions:', error);
            toast({
                title: 'Erreur',
                description: 'Impossible de charger les institutions',
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

    const handleEdit = (org: Institution) => {
        setDialogMode('edit');
        setSelectedOrg(org);
        setShowOrgDialog(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'institution "${name}" ? Cette action est irréversible.`)) {
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
                description: 'Institution supprimée avec succès',
            });

            fetchInstitutions();
        } catch (error: any) {
            console.error('Error deleting:', error);
            toast({
                title: 'Erreur',
                description: 'Impossible de supprimer l\'institution',
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
            title="Institutions Financières"
            description="Liste de toutes les institutions financières enregistrées sur la plateforme"
        >
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Liste des Institutions Financières</CardTitle>
                            <CardDescription>
                                {filteredInstitutions.length} institution(s) trouvée(s)
                            </CardDescription>
                        </div>
                        <Button onClick={handleCreate}>
                            <Building2 className="h-4 w-4 mr-2" />
                            Créer une institution
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
                    ) : filteredInstitutions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {searchQuery ? 'Aucune institution trouvée' : 'Aucune institution enregistrée'}
                        </div>
                    ) : (
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nom</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Demandes traitées</TableHead>
                                        <TableHead>Statut KYC</TableHead>
                                        <TableHead>Date de création</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredInstitutions.map((institution) => (
                                        <TableRow key={institution.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{institution.name || 'N/A'}</span>
                                                    {institution.is_organization_admin && (
                                                        <Badge variant="outline" className="text-xs">
                                                            <Shield className="h-3 w-3 mr-1" />
                                                            Admin
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <div>{institution.email || 'N/A'}</div>
                                                    {institution.phone && (
                                                        <div className="text-muted-foreground">{institution.phone}</div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                    <span>{institution._count?.applications || 0}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getKYCBadge(institution.kyc_status)}</TableCell>
                                            <TableCell>
                                                {new Date(institution.created_at).toLocaleDateString('fr-FR')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(institution)}
                                                    >
                                                        <Pencil className="h-4 w-4 text-blue-500" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(institution.id, institution.name)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
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
                type="institution"
                initialData={selectedOrg}
                onSuccess={fetchInstitutions}
            />
        </DashboardLayout>
    );
}
