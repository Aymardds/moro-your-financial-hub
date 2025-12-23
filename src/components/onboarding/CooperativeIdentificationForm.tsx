import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { OrganizationApplication } from '@/types/onboarding';

export function CooperativeIdentificationForm() {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        applicant: {
            name: user?.user_metadata?.name || '',
            role: '',
        },
        cooperative: {
            name: '',
            agrement_number: '',
            activity_type: '',
            zone: '',
            adherence_count: '',
        }
    });

    const updateFormData = (section: keyof typeof formData, field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleSubmit = async () => {
        if (!user) return;
        setLoading(true);

        try {
            const { error } = await supabase
                .from('organization_applications')
                .insert({
                    user_id: user.id,
                    organization_type: 'cooperative',
                    applicant_info: formData.applicant,
                    basic_info: {
                        name: formData.cooperative.name,
                        agrement_number: formData.cooperative.agrement_number,
                        activity_type: formData.cooperative.activity_type,
                        zone: formData.cooperative.zone,
                    },
                    membership_info: {
                        adherence_count: formData.cooperative.adherence_count,
                    },
                    status: 'submitted'
                });

            if (error) throw error;

            await supabase
                .from('user_profiles')
                .update({ onboarding_status: 'pending_approval' })
                .eq('id', user.id);

            toast({
                title: "Candidature envoyée",
                description: "Votre dossier a été transmis à l'administration pour validation.",
            });

            window.location.reload();

        } catch (error: any) {
            console.error('Error submitting application:', error);
            toast({
                title: "Erreur",
                description: "Une erreur est survenue lors de l'envoi du formulaire.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Identification de la Coopérative</CardTitle>
                    <CardDescription>
                        Étape {step} sur 2 : {
                            step === 1 ? "Identification du demandeur" : "Informations sur la coopérative"
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nom complet du demandeur</Label>
                                <Input
                                    value={formData.applicant.name}
                                    onChange={(e) => updateFormData('applicant', 'name', e.target.value)}
                                    placeholder="Votre nom"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Fonction au sein de la coopérative</Label>
                                <Input
                                    value={formData.applicant.role}
                                    onChange={(e) => updateFormData('applicant', 'role', e.target.value)}
                                    placeholder="Ex: Président, Gérant, Secrétaire..."
                                />
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <p className="text-sm text-blue-800">
                                    <strong>Note :</strong> Ces informations nous permettent de savoir qui au sein de l'organisation initie cette demande de services financiers.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nom de la coopérative</Label>
                                <Input
                                    value={formData.cooperative.name}
                                    onChange={(e) => updateFormData('cooperative', 'name', e.target.value)}
                                    placeholder="Ex: Coopérative Agricole de..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Numéro d'agrément</Label>
                                    <Input
                                        value={formData.cooperative.agrement_number}
                                        onChange={(e) => updateFormData('cooperative', 'agrement_number', e.target.value)}
                                        placeholder="Numéro officiel"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Nombre d'adhérents</Label>
                                    <Input
                                        value={formData.cooperative.adherence_count}
                                        onChange={(e) => updateFormData('cooperative', 'adherence_count', e.target.value)}
                                        placeholder="Ex: 150"
                                        type="number"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Type d'activité principale</Label>
                                <Input
                                    value={formData.cooperative.activity_type}
                                    onChange={(e) => updateFormData('cooperative', 'activity_type', e.target.value)}
                                    placeholder="Ex: Café-Cacao, Maraicher, etc."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Zone d'activité / Localisation</Label>
                                <Input
                                    value={formData.cooperative.zone}
                                    onChange={(e) => updateFormData('cooperative', 'zone', e.target.value)}
                                    placeholder="Région, Ville, District"
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between">
                    {step > 1 ? (
                        <Button variant="outline" onClick={prevStep}>Retour</Button>
                    ) : (
                        <div></div>
                    )}

                    {step < 2 ? (
                        <Button onClick={nextStep} disabled={!formData.applicant.name || !formData.applicant.role}>
                            Suivant
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={loading || !formData.cooperative.name}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Soumettre le dossier
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
