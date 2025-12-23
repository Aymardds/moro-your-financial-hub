import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Shield, FileText, CheckCircle2, XCircle, Clock, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface KYCValidation {
  id: string;
  user_id: string;
  entity_type: 'entrepreneur' | 'cooperative' | 'institution';
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  full_name: string;
  business_name: string;
  registration_number: string;
  tax_id: string;
  address: string;
  city: string;
  country: string;
  submitted_at: string;
  reviewed_at: string;
  rejection_reason: string;
  notes: string;
  identity_document_url: string;
  business_registration_url: string;
  tax_certificate_url: string;
  proof_of_address_url: string;
  // New fields
  matricule?: string;
  gps_coordinates?: string;
  photo_id_url?: string;
}

interface KYCValidationListProps {
  entityType?: 'entrepreneur' | 'cooperative' | 'institution';
  canApprove?: boolean;
}

export const KYCValidationList = ({ entityType, canApprove = false }: KYCValidationListProps) => {
  const { user } = useAuth();
  const [kycValidations, setKycValidations] = useState<KYCValidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKYC, setSelectedKYC] = useState<KYCValidation | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [signedUrls, setSignedUrls] = useState<Record<string, { identity?: string; business_registration?: string; tax_certificate?: string; proof_of_address?: string; photo_id?: string }>>({});

  useEffect(() => {
    fetchKYCValidations();
  }, [entityType]);

  const fetchKYCValidations = async () => {
    try {
      let query = supabase
        .from('kyc_validations')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      const { data, error } = await query;

      if (error) throw error;

      const list = data || [];
      setKycValidations(list);
      await buildSignedUrls(list);
    } catch (error: any) {
      console.error('Error fetching KYC validations:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les validations KYC',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const buildSignedUrls = async (items: KYCValidation[]) => {
    const map: Record<string, { identity?: string; business_registration?: string; tax_certificate?: string; proof_of_address?: string; photo_id?: string }> = {};
    for (const kyc of items) {
      const entry: { identity?: string; business_registration?: string; tax_certificate?: string; proof_of_address?: string; photo_id?: string } = {};
      if (kyc.identity_document_url) {
        const { data } = await supabase.storage.from('kyc-documents').createSignedUrl(kyc.identity_document_url, 3600);
        if (data?.signedUrl) entry.identity = data.signedUrl;
      }
      if (kyc.business_registration_url) {
        const { data } = await supabase.storage.from('kyc-documents').createSignedUrl(kyc.business_registration_url, 3600);
        if (data?.signedUrl) entry.business_registration = data.signedUrl;
      }
      if (kyc.tax_certificate_url) {
        const { data } = await supabase.storage.from('kyc-documents').createSignedUrl(kyc.tax_certificate_url, 3600);
        if (data?.signedUrl) entry.tax_certificate = data.signedUrl;
      }
      if (kyc.proof_of_address_url) {
        const { data } = await supabase.storage.from('kyc-documents').createSignedUrl(kyc.proof_of_address_url, 3600);
        if (data?.signedUrl) entry.proof_of_address = data.signedUrl;
      }
      if (kyc.photo_id_url) {
        const { data } = await supabase.storage.from('kyc-documents').createSignedUrl(kyc.photo_id_url, 3600);
        if (data?.signedUrl) entry.photo_id = data.signedUrl;
      }
      map[kyc.id] = entry;
    }
    setSignedUrls(map);
  };

  const handleApprove = async (kycId: string) => {
    try {
      const { error } = await supabase
        .from('kyc_validations')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id || null,
          notes: reviewNotes || null,
        })
        .eq('id', kycId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Validation KYC approuvée',
      });

      fetchKYCValidations();
      setSelectedKYC(null);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'approuver la validation',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (kycId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez fournir une raison de rejet',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('kyc_validations')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id || null,
          rejection_reason: rejectionReason,
          notes: reviewNotes || null,
        })
        .eq('id', kycId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Validation KYC rejetée',
      });

      fetchKYCValidations();
      setSelectedKYC(null);
      setRejectionReason('');
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de rejeter la validation',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approuvé</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
      case 'in_review':
        return <Badge className="bg-blue-100 text-blue-800">En examen</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
    }
  };

  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case 'entrepreneur':
        return 'Entrepreneur';
      case 'cooperative':
        return 'Coopérative';
      case 'institution':
        return 'Institution';
      default:
        return type;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      {kycValidations.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Aucune validation KYC en attente
        </div>
      ) : (
        kycValidations.map((kyc) => (
          <Card key={kyc.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {kyc.business_name || kyc.full_name}
                  </CardTitle>
                  <CardDescription>
                    {getEntityTypeLabel(kyc.entity_type)} • Soumis le{' '}
                    {new Date(kyc.submitted_at).toLocaleDateString('fr-FR')}
                  </CardDescription>
                </div>
                {getStatusBadge(kyc.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Informations</p>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p>Nom: {kyc.full_name}</p>
                    {kyc.matricule && <p className="font-semibold text-primary">Matricule: {kyc.matricule}</p>}
                    {kyc.gps_coordinates && (
                      <p>
                        GPS: <a
                          href={`https://www.google.com/maps/search/?api=1&query=${kyc.gps_coordinates}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-blue-500 hover:text-blue-700"
                        >
                          {kyc.gps_coordinates}
                        </a>
                      </p>
                    )}
                    {kyc.business_name && <p>Entreprise: {kyc.business_name}</p>}
                    {kyc.registration_number && (
                      <p>N° Enregistrement: {kyc.registration_number}</p>
                    )}
                    <p>Adresse: {kyc.address}, {kyc.city}, {kyc.country}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Documents</p>
                  <div className="mt-2 space-y-2">
                    {signedUrls[kyc.id]?.photo_id && (
                      <div className="mb-2">
                        <img
                          src={signedUrls[kyc.id]!.photo_id!}
                          alt="Photo Identité"
                          className="h-24 w-24 object-cover rounded-md border"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Photo d'identité</p>
                      </div>
                    )}
                    {signedUrls[kyc.id]?.identity && (
                      <a
                        href={signedUrls[kyc.id]!.identity!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        Document d'identité
                      </a>
                    )}
                    {signedUrls[kyc.id]?.business_registration && (
                      <a
                        href={signedUrls[kyc.id]!.business_registration!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        Document d'enregistrement
                      </a>
                    )}
                    {signedUrls[kyc.id]?.proof_of_address && (
                      <a
                        href={signedUrls[kyc.id]!.proof_of_address!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        Justificatif de domicile
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {kyc.rejection_reason && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm font-medium text-red-800">Raison du rejet:</p>
                  <p className="text-sm text-red-700">{kyc.rejection_reason}</p>
                </div>
              )}

              {canApprove && kyc.status === 'pending' && (
                <div className="mt-4 flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedKYC(kyc);
                          setRejectionReason('');
                          setReviewNotes('');
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejeter
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Rejeter la validation KYC</DialogTitle>
                        <DialogDescription>
                          Veuillez fournir une raison pour le rejet
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="rejection-reason">Raison du rejet *</Label>
                          <Textarea
                            id="rejection-reason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Expliquez pourquoi cette validation est rejetée..."
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="review-notes">Notes (optionnel)</Label>
                          <Textarea
                            id="review-notes"
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            placeholder="Notes supplémentaires..."
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setSelectedKYC(null);
                              setRejectionReason('');
                            }}
                          >
                            Annuler
                          </Button>
                          <Button
                            className="flex-1"
                            onClick={() => selectedKYC && handleReject(selectedKYC.id)}
                          >
                            Confirmer le rejet
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedKYC(kyc);
                          setReviewNotes('');
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approuver
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Approuver la validation KYC</DialogTitle>
                        <DialogDescription>
                          Confirmez l'approbation de cette validation KYC
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="approval-notes">Notes (optionnel)</Label>
                          <Textarea
                            id="approval-notes"
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            placeholder="Notes supplémentaires..."
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setSelectedKYC(null);
                              setReviewNotes('');
                            }}
                          >
                            Annuler
                          </Button>
                          <Button
                            className="flex-1"
                            onClick={() => selectedKYC && handleApprove(selectedKYC.id)}
                          >
                            Confirmer l'approbation
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

