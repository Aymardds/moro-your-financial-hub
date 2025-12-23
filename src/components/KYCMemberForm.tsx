import { useState, useEffect } from 'react';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Upload, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface KYCMemberFormProps {
    userId: string;
    onSuccess?: () => void;
    status?: string;
}

export function KYCMemberForm({ userId, onSuccess, status }: KYCMemberFormProps) {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [matricule, setMatricule] = useState('');
    const [gpsCoords, setGpsCoords] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchExistingKYC();
    }, [userId]);

    const fetchExistingKYC = async () => {
        try {
            const { data, error } = await supabase
                .from('kyc_validations')
                .select('*')
                .eq('user_id', userId)
                .eq('entity_type', 'entrepreneur') // Assuming members are entrepreneurs
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setMatricule(data.matricule || '');
                setGpsCoords(data.gps_coordinates || '');
                setPhotoUrl(data.photo_id_url || '');
            }
        } catch (error) {
            console.error("Error loading KYC:", error);
        } finally {
            setFetching(false);
        }
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast({
                title: "Erreur",
                description: "La géolocalisation n'est pas supportée par votre navigateur",
                variant: "destructive"
            });
            return;
        }

        toast({ title: "Localisation en cours..." });
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = `${position.coords.latitude},${position.coords.longitude}`;
                setGpsCoords(coords);
                toast({ title: "Localisation réussie !" });
            },
            (error) => {
                toast({
                    title: "Erreur de localisation",
                    description: error.message,
                    variant: "destructive"
                });
            }
        );
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = event.target.files?.[0];
            if (!file) return;

            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const filePath = `${userId}/photo_id_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('kyc-documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: publicUrl } = supabase.storage
                .from('kyc-documents')
                .getPublicUrl(filePath);

            setPhotoUrl(publicUrl.publicUrl);
            toast({ title: "Photo téléchargée avec succès" });
        } catch (error: any) {
            toast({
                title: "Erreur de téléchargement",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Upsert into kyc_validations
            const { error } = await supabase
                .from('kyc_validations')
                .upsert({
                    user_id: userId,
                    entity_type: 'entrepreneur', // To be safe
                    matricule,
                    gps_coordinates: gpsCoords,
                    photo_id_url: photoUrl,
                    status: 'pending', // Reset to pending if updated, or keep as is? Let's say pending for review.
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' } as any);

            if (error) throw error;

            toast({
                title: "KYC Mis à jour",
                description: "Vos informations membre ont été enregistrées.",
            });
            onSuccess?.();
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Erreur",
                description: "Impossible d'enregistrer les informations.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div>Chargement...</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Identification Membre
                </CardTitle>
                <CardDescription>
                    Informations requises pour l'adhésion à la coopérative
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="matricule">Numéro Matricule</Label>
                        <Input
                            id="matricule"
                            value={matricule}
                            onChange={(e) => setMatricule(e.target.value)}
                            placeholder="Ex: COOP-2024-001"
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Localisation GPS (Résidence)</Label>
                        <div className="flex gap-2">
                            <Input
                                value={gpsCoords}
                                onChange={(e) => setGpsCoords(e.target.value)}
                                placeholder="Latitude, Longitude"
                                required
                                readOnly
                            />
                            <Button type="button" variant="outline" onClick={handleGetLocation}>
                                <MapPin className="h-4 w-4 mr-2" />
                                Localiser
                            </Button>
                        </div>
                        {gpsCoords && (
                            <p className="text-xs text-muted-foreground">
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${gpsCoords}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline text-blue-500"
                                >
                                    Voir sur la carte
                                </a>
                            </p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label>Photo d'identité</Label>
                        <div className="flex items-center gap-4">
                            {photoUrl && (
                                <img
                                    src={photoUrl}
                                    alt="Identité"
                                    className="h-20 w-20 object-cover rounded-md border"
                                />
                            )}
                            <div className="flex-1">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Format acceptés: JPG, PNG. Max 5MB.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading || uploading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enregistrer le dossier membre
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
