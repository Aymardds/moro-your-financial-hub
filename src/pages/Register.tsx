import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Mail, ArrowLeft, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function Register() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<string>('entrepreneur');
    const [step, setStep] = useState<'input' | 'otp'>('input');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!email || !email.includes('@')) {
            toast({
                title: 'Erreur',
                description: 'Veuillez entrer une adresse email valide',
                variant: 'destructive',
            });
            setLoading(false);
            return;
        }

        if (!name.trim()) {
            toast({
                title: 'Erreur',
                description: 'Veuillez entrer votre nom',
                variant: 'destructive',
            });
            setLoading(false);
            return;
        }

        try {
            // Utiliser la fonction unifiée pour générer le lien et envoyer l'email
            const { data, error } = await supabase.functions.invoke('unified-onboarding', {
                body: { email: email.trim().toLowerCase(), name: name.trim(), role: role }
            });

            if (error) {
                console.error('Edge Function invocation error:', error);
                // Si l'erreur est de type 400, on essaie d'extraire le message retourné par la fonction
                let errorMessage = 'Une erreur est survenue lors de l\'envoi de l\'email de bienvenue';
                if (error.context?.json?.error) {
                    errorMessage = error.context.json.error;
                } else if (error.message) {
                    errorMessage = error.message;
                }

                toast({
                    title: 'Erreur',
                    description: errorMessage,
                    variant: 'destructive',
                });
                setLoading(false);
                return;
            }

            toast({
                title: 'Email envoyé',
                description: 'Vérifiez votre boîte de réception pour activer votre compte.',
            });

            setStep('otp'); // On utilise ce step pour afficher l'écran "Vérifiez vos mails"
            setLoading(false);

        } catch (error: any) {
            console.error('Registration error:', error);
            toast({
                title: 'Erreur',
                description: error.message || 'Une erreur inattendue est survenue',
                variant: 'destructive',
            });
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                <UserPlus className="h-6 w-6" />
                                Inscription
                            </CardTitle>
                            <CardDescription>
                                {step === 'input'
                                    ? 'Créez votre compte MORO'
                                    : 'Vérification de votre compte'}
                            </CardDescription>
                        </div>
                        <Link to="/login">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {step === 'input' ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nom complet</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Votre nom"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Adresse email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="exemple@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Type de compte</Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger id="role">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="entrepreneur">
                                            <div className="flex flex-col items-start">
                                                <span className="font-medium">Entrepreneur</span>
                                                <span className="text-xs text-muted-foreground">
                                                    Gestion financière personnelle et projets
                                                </span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="cooperative">
                                            <div className="flex flex-col items-start">
                                                <span className="font-medium">Coopérative</span>
                                                <span className="text-xs text-muted-foreground">
                                                    Gestion de membres et prêts
                                                </span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="institution">
                                            <div className="flex flex-col items-start">
                                                <span className="font-medium">Institution Financière</span>
                                                <span className="text-xs text-muted-foreground">
                                                    Validation KYC et financements
                                                </span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Choisissez le type de compte qui correspond à votre activité
                                </p>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading || !email || !name}>
                                {loading ? 'Envoi en cours...' : 'Créer mon compte'}
                            </Button>

                            <div className="text-center text-sm">
                                <span className="text-muted-foreground">Vous avez déjà un compte? </span>
                                <Link to="/login" className="text-primary hover:underline">
                                    Se connecter
                                </Link>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6 text-center py-4">
                            <div className="flex justify-center">
                                <div className="bg-green-100 p-3 rounded-full">
                                    <Mail className="h-8 w-8 text-green-600" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-bold tracking-tight">Vérifiez votre boîte mail</h2>
                                <p className="text-sm text-muted-foreground">
                                    Un lien d'activation sécurisé a été envoyé à <br />
                                    <strong className="text-foreground">{email}</strong>.
                                </p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg text-left border border-blue-100">
                                <p className="text-xs text-blue-800 font-semibold mb-1 uppercase tracking-wider">Prochaines étapes :</p>
                                <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                                    <li>Ouvrez l'email reçu (vérifiez les spams)</li>
                                    <li>Cliquez sur <strong>"Activer mon compte"</strong></li>
                                    <li>Vous serez automatiquement connecté</li>
                                </ul>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setStep('input')}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Retour à l'inscription
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

