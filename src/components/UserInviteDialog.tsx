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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

interface UserInviteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    organizationId: string;
    organizationType: 'cooperative' | 'institution';
    onSuccess?: () => void;
}

interface Permissions {
    read: boolean;
    write: boolean;
    delete: boolean;
    manage_users: boolean;
}

export function UserInviteDialog({
    open,
    onOpenChange,
    organizationId,
    organizationType,
    onSuccess,
}: UserInviteDialogProps) {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member');
    const [permissions, setPermissions] = useState<Permissions>({
        read: true,
        write: false,
        delete: false,
        manage_users: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email && !phone) {
            toast({
                title: 'Erreur',
                description: 'Veuillez fournir un email ou un téléphone',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        try {
            // 1. Créer ou récupérer l'utilisateur
            let userId: string;

            // Chercher si l'utilisateur existe déjà
            const { data: existingUser } = await supabase
                .from('user_profiles')
                .select('id')
                .or(`email.eq.${email},phone.eq.${phone}`)
                .single();

            if (existingUser) {
                userId = existingUser.id;
            } else {
                // Créer un nouvel utilisateur (invitation)
                // Note: Dans un système réel, cela devrait envoyer une invitation par email/SMS
                const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                    email: email || undefined,
                    phone: phone || undefined,
                    email_confirm: false,
                    user_metadata: {
                        name: name,
                        invited_by_organization: organizationId,
                    },
                });

                if (createError) throw createError;
                if (!newUser.user) throw new Error('Failed to create user');

                userId = newUser.user.id;

                // Créer le profil utilisateur
                const { error: profileError } = await supabase
                    .from('user_profiles')
                    .insert({
                        id: userId,
                        email: email || null,
                        phone: phone || null,
                        name: name,
                        role: 'entrepreneur', // Par défaut
                    });

                if (profileError) throw profileError;
            }

            // 2. Ajouter l'utilisateur à l'organisation
            const { error: orgError } = await supabase
                .from('organization_users')
                .insert({
                    organization_id: organizationId,
                    user_id: userId,
                    role: role,
                    permissions: permissions,
                });

            if (orgError) throw orgError;

            toast({
                title: 'Succès',
                description: 'Utilisateur invité avec succès',
            });

            // Réinitialiser le formulaire
            setEmail('');
            setPhone('');
            setName('');
            setRole('member');
            setPermissions({
                read: true,
                write: false,
                delete: false,
                manage_users: false,
            });

            onOpenChange(false);
            onSuccess?.();
        } catch (error: any) {
            console.error('Error inviting user:', error);
            toast({
                title: 'Erreur',
                description: error.message || 'Impossible d\'inviter l\'utilisateur',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Inviter un utilisateur</DialogTitle>
                    <DialogDescription>
                        Invitez un utilisateur à rejoindre votre {organizationType === 'cooperative' ? 'coopérative' : 'institution'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Nom */}
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nom complet</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Jean Dupont"
                                required
                            />
                        </div>

                        {/* Email */}
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="jean@example.com"
                            />
                        </div>

                        {/* Téléphone */}
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Téléphone</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+237 6XX XX XX XX"
                            />
                        </div>

                        {/* Rôle */}
                        <div className="grid gap-2">
                            <Label htmlFor="role">Rôle</Label>
                            <Select value={role} onValueChange={handleRoleChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un rôle" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Administrateur</SelectItem>
                                    <SelectItem value="member">Membre</SelectItem>
                                    <SelectItem value="viewer">Observateur</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {role === 'admin' && 'Accès complet, peut gérer les utilisateurs'}
                                {role === 'member' && 'Accès standard, peut lire et écrire'}
                                {role === 'viewer' && 'Accès en lecture seule'}
                            </p>
                        </div>

                        {/* Permissions */}
                        <div className="grid gap-2">
                            <Label>Permissions</Label>
                            <div className="space-y-2">
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
                            </div>
                        </div>
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
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Inviter
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
