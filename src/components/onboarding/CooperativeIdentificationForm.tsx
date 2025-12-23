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
        basic_info: {
            name: '',
            agrement_number: '',
            activity_type: '',
            zone: '',
        },
        membership_info: {
            adherence_count: '',
            intervals: '',
        },
        management_info: {
            manager_name: '',
            secretary_name: '',
            president_name: '',
        },
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
                    basic_info: formData.basic_info,
                    membership_info: formData.membership_info,
                    management_info: formData.management_info,
                    status: 'submitted'
                });

            if (error) throw error;

            // Update local user profile status to pending_approval (optimistic update or triggering a re-fetch would be ideal)
            await supabase
                .from('user_profiles')
                .update({ onboarding_status: 'pending_approval' })
                .eq('id', user.id);

            toast({
                title: "Candidature envoyée",
                description: "Votre dossier a été transmis à l'administration pour validation.",
            });

            // Reload to reflect status change in main dashboard
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
                        Étape {step} sur 3: {
                            step === 1 ? "Informations Générales" :
                                step === 2 ? "Adhérents" : "Gestion & Administration"
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nom de la coopérative</Label>
                                <Input
                                    value={formData.basic_info.name}
                                    onChange={(e) => updateFormData('basic_info', 'name', e.target.value)}
                                    placeholder="Ex: Coopérative Agricole de..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Numéro d'agrément</Label>
                                <Input
                                    value={formData.basic_info.agrement_number}
                                    onChange={(e) => updateFormData('basic_info', 'agrement_number', e.target.value)}
                                    placeholder="Numéro officiel"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Type d'activité</Label>
                                <Input
                                    value={formData.basic_info.activity_type}
                                    onChange={(e) => updateFormData('basic_info', 'activity_type', e.target.value)}
                                    placeholder="Ex: Cacao, Café, Anacarde..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Zone d'activité</Label>
                                <Input
                                    value={formData.basic_info.zone}
                                    onChange={(e) => updateFormData('basic_info', 'zone', e.target.value)}
                                    placeholder="Région, Ville, Localité"
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nombre d'adhérents</Label>
                                <Input
                                    value={formData.membership_info.adherence_count}
                                    onChange={(e) => updateFormData('membership_info', 'adherence_count', e.target.value)}
                                    placeholder="Ex: 150"
                                    type="number"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Intervalle de membres (optionnel)</Label>
                                <Input
                                    value={formData.membership_info.intervals}
                                    onChange={(e) => updateFormData('membership_info', 'intervals', e.target.value)}
                                    placeholder="Ex: 50-100 membres actifs"
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nom du Président</Label>
                                <Input
                                    value={formData.management_info.president_name}
                                    onChange={(e) => updateFormData('management_info', 'president_name', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Nom du Secrétaire Général</Label>
                                <Input
                                    value={formData.management_info.secretary_name}
                                    onChange={(e) => updateFormData('management_info', 'secretary_name', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Nom du Gérant (optionnel)</Label>
                                <Input
                                    value={formData.management_info.manager_name}
                                    onChange={(e) => updateFormData('management_info', 'manager_name', e.target.value)}
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

                    {step < 3 ? (
                        <Button onClick={nextStep}>Suivant</Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Soumettre le dossier
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
