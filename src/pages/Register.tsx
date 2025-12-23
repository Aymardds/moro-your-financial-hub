import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
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
    const [otp, setOtp] = useState('');
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
            const { error } = await supabase.auth.signInWithOtp({
                email: email.trim().toLowerCase(),
                options: {
                    emailRedirectTo: window.location.origin,
                    data: {
                        name: name.trim(),
                        role: role,
                    },
                },
            });

            if (error) {
                toast({
                    title: 'Erreur',
                    description: error.message || 'Impossible d\'envoyer le code OTP',
                    variant: 'destructive',
                });
                setLoading(false);
            } else {
                toast({
                    title: 'Code envoyé',
                    description: 'Vérifiez votre email pour le code de vérification',
                });
                setStep('otp');
                setLoading(false);
            }
        } catch (error) {
            console.error('Registration error:', error);
            toast({
                title: 'Erreur',
                description: 'Une erreur est survenue lors de l\'inscription',
                variant: 'destructive',
            });
            setLoading(false);
        }
    };

    const handleOTPSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email: email.trim().toLowerCase(),
                token: otp,
                type: 'email',
            });

            if (error) {
                toast({
                    title: 'Erreur',
                    description: error.message || 'Code OTP invalide',
                    variant: 'destructive',
                });
                setLoading(false);
            } else if (data?.user) {
                // Créer ou mettre à jour le profil utilisateur
                const { error: profileError } = await supabase
                    .from('user_profiles')
                    .upsert({
                        id: data.user.id,
                        email: email.trim().toLowerCase(),
                        name: name.trim(),
                        role: role,
                    }, {
                        onConflict: 'id'
                    });

                if (profileError) {
                    console.error('Profile creation error:', profileError);
                } else if (role === 'cooperative') {
                    // Envoyer un email de bienvenue/onboarding via Edge Function
                    supabase.functions.invoke('onboarding-email', {
                        body: {
                            user_id: data.user.id,
                            email: email.trim().toLowerCase(),
                            name: name.trim(),
                            role: 'cooperative'
                        }
                    }).catch(console.error);

                    // Créer aussi une notification in-app
                    supabase.from('notifications').insert({
                        user_id: data.user.id,
                        title: 'Bienvenue !',
                        message: 'Veuillez compléter votre formulaire d\'identification.',
                        type: 'info',
                        link: '/dashboard'
                    }).then(({ error }) => {
                        if (error) console.error('Notification error:', error);
                    });
                }

                toast({
                    title: 'Inscription réussie',
                    description: 'Redirection vers votre dashboard...',
                });

                // Redirection vers le dashboard
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1000);
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            toast({
                title: 'Erreur',
                description: 'Une erreur est survenue lors de la vérification',
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
                                    : 'Entrez le code de vérification'}
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
                        <form onSubmit={handleOTPSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Code de vérification</Label>
                                <InputOTP
                                    maxLength={6}
                                    value={otp}
                                    onChange={setOtp}
                                >
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                </InputOTP>
                                <p className="text-xs text-muted-foreground text-center">
                                    Entrez le code à 6 chiffres reçu par email
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        setStep('input');
                                        setOtp('');
                                    }}
                                >
                                    Retour
                                </Button>
                                <Button type="submit" className="flex-1" disabled={loading || otp.length !== 6}>
                                    {loading ? 'Vérification...' : 'Vérifier'}
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
