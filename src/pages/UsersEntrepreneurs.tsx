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
import { Search, UserPlus, Eye, Edit, Ban } from 'lucide-react';

interface Entrepreneur {
    id: string;
    email: string;
    phone: string;
    name: string;
    kyc_status: string;
    created_at: string;
}

export default function UsersEntrepreneurs() {
    const [entrepreneurs, setEntrepreneurs] = useState<Entrepreneur[]>([]);
    const [filteredEntrepreneurs, setFilteredEntrepreneurs] = useState<Entrepreneur[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchEntrepreneurs();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            const filtered = entrepreneurs.filter(
                (e) =>
                    e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    e.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    e.phone?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredEntrepreneurs(filtered);
        } else {
            setFilteredEntrepreneurs(entrepreneurs);
        }
    }, [searchQuery, entrepreneurs]);

    const fetchEntrepreneurs = async () => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('role', 'entrepreneur')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setEntrepreneurs(data || []);
            setFilteredEntrepreneurs(data || []);
        } catch (error: any) {
            console.error('Error fetching entrepreneurs:', error);
            toast({
                title: 'Erreur',
                description: 'Impossible de charger les entrepreneurs',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
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
            title="Entrepreneurs"
            description="Liste de tous les entrepreneurs inscrits sur la plateforme"
        >
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Liste des Entrepreneurs</CardTitle>
                            <CardDescription>
                                {filteredEntrepreneurs.length} entrepreneur(s) trouvé(s)
                            </CardDescription>
                        </div>
                        <Button>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Inviter un entrepreneur
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
                    ) : filteredEntrepreneurs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {searchQuery ? 'Aucun entrepreneur trouvé' : 'Aucun entrepreneur inscrit'}
                        </div>
                    ) : (
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nom</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Statut KYC</TableHead>
                                        <TableHead>Date d'inscription</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredEntrepreneurs.map((entrepreneur) => (
                                        <TableRow key={entrepreneur.id}>
                                            <TableCell className="font-medium">
                                                {entrepreneur.name || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <div>{entrepreneur.email || 'N/A'}</div>
                                                    {entrepreneur.phone && (
                                                        <div className="text-muted-foreground">{entrepreneur.phone}</div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getKYCBadge(entrepreneur.kyc_status)}</TableCell>
                                            <TableCell>
                                                {new Date(entrepreneur.created_at).toLocaleDateString('fr-FR')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm">
                                                        <Ban className="h-4 w-4" />
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
        </DashboardLayout>
    );
}
