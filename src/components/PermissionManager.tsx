import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PermissionManagerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    organizationUserId: string;
    currentRole: 'admin' | 'member' | 'viewer';
    currentPermissions: {
        read: boolean;
        write: boolean;
        delete: boolean;
        manage_users: boolean;
    };
    userName: string;
    onSuccess?: () => void;
}

export function PermissionManager({
    open,
    onOpenChange,
    organizationUserId,
    currentRole,
    currentPermissions,
    userName,
    onSuccess,
}: PermissionManagerProps) {
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState(currentRole);
    const [permissions, setPermissions] = useState(currentPermissions);

    const handleRoleChange = (newRole: 'admin' | 'member' | 'viewer') => {
        setRole(newRole);

        // Ajuster les permissions selon le rôle
        if (newRole === 'admin') {
            setPermissions({
                read: true,
                write: true,
                delete: true,
                manage_users: true,
            });
        } else if (newRole === 'member') {
            setPermissions({
                read: true,
                write: true,
                delete: false,
                manage_users: false,
            });
        } else {
            setPermissions({
                read: true,
                write: false,
                delete: false,
                manage_users: false,
            });
        }
    };

    const handleSave = async () => {
        setLoading(true);

        try {
            const { error } = await supabase
                .from('organization_users')
                .update({
                    role: role,
                    permissions: permissions,
                })
                .eq('id', organizationUserId);

            if (error) throw error;

            toast({
                title: 'Succès',
                description: 'Permissions mises à jour avec succès',
            });

            onOpenChange(false);
            onSuccess?.();
        } catch (error: any) {
            console.error('Error updating permissions:', error);
            toast({
                title: 'Erreur',
                description: error.message || 'Impossible de mettre à jour les permissions',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const getRoleBadge = (role: string) => {
        const roleConfig: Record<string, { label: string; className: string }> = {
            admin: { label: 'Administrateur', className: 'bg-red-100 text-red-800' },
            member: { label: 'Membre', className: 'bg-blue-100 text-blue-800' },
            viewer: { label: 'Observateur', className: 'bg-gray-100 text-gray-800' },
        };

        const config = roleConfig[role] || roleConfig.member;
        return <Badge className={config.className}>{config.label}</Badge>;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Gérer les permissions
                    </DialogTitle>
                    <DialogDescription>
                        Modifier le rôle et les permissions de <strong>{userName}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Rôle actuel */}
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                        <span className="text-sm font-medium">Rôle actuel</span>
                        {getRoleBadge(currentRole)}
                    </div>

                    {/* Nouveau rôle */}
                    <div className="grid gap-2">
                        <Label htmlFor="role">Nouveau rôle</Label>
                        <Select value={role} onValueChange={handleRoleChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un rôle" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4" />
                                        <span>Administrateur</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="member">
                                    <div className="flex items-center gap-2">
                                        <span>Membre</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="viewer">
                                    <div className="flex items-center gap-2">
                                        <span>Observateur</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {role === 'admin' && '✓ Accès complet avec gestion des utilisateurs'}
                            {role === 'member' && '✓ Accès standard avec lecture et écriture'}
                            {role === 'viewer' && '✓ Accès en lecture seule'}
                        </p>
                    </div>

                    {/* Permissions détaillées */}
                    <div className="grid gap-3">
                        <Label>Permissions détaillées</Label>
                        <div className="space-y-3 p-4 border rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="read"
                                        checked={permissions.read}
                                        onCheckedChange={(checked) =>
                                            setPermissions({ ...permissions, read: checked as boolean })
                                        }
                                    />
                                    <label htmlFor="read" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Lecture
                                    </label>
                                </div>
                                <span className="text-xs text-muted-foreground">Voir les données</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="write"
                                        checked={permissions.write}
                                        onCheckedChange={(checked) =>
                                            setPermissions({ ...permissions, write: checked as boolean })
                                        }
                                    />
                                    <label htmlFor="write" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Écriture
                                    </label>
                                </div>
                                <span className="text-xs text-muted-foreground">Créer et modifier</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="delete"
                                        checked={permissions.delete}
                                        onCheckedChange={(checked) =>
                                            setPermissions({ ...permissions, delete: checked as boolean })
                                        }
                                    />
                                    <label htmlFor="delete" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Suppression
                                    </label>
                                </div>
                                <span className="text-xs text-muted-foreground">Supprimer des données</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="manage_users"
                                        checked={permissions.manage_users}
                                        onCheckedChange={(checked) =>
                                            setPermissions({ ...permissions, manage_users: checked as boolean })
                                        }
                                    />
                                    <label htmlFor="manage_users" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Gestion des utilisateurs
                                    </label>
                                </div>
                                <span className="text-xs text-muted-foreground">Inviter et gérer</span>
                            </div>
                        </div>
                    </div>

                    {/* Résumé des changements */}
                    {(role !== currentRole || JSON.stringify(permissions) !== JSON.stringify(currentPermissions)) && (
                        <div className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
                            <p className="text-sm font-medium text-orange-800">
                                ⚠️ Des modifications seront appliquées
                            </p>
                            <p className="text-xs text-orange-600 mt-1">
                                L'utilisateur sera notifié de ces changements
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Annuler
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enregistrer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
