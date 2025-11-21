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

  const getDocumentUrl = (filePath: string) => {
    if (!filePath) return null;
    const { data } = supabase.storage.from('kyc-documents').getPublicUrl(filePath);
    return data.publicUrl;
  };

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

      setKycValidations(data || []);
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
                    {kyc.identity_document_url && getDocumentUrl(kyc.identity_document_url) && (
                      <a
                        href={getDocumentUrl(kyc.identity_document_url)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        Pièce d'identité
                      </a>
                    )}
                    {kyc.business_registration_url && getDocumentUrl(kyc.business_registration_url) && (
                      <a
                        href={getDocumentUrl(kyc.business_registration_url)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        Document d'enregistrement
                      </a>
                    )}
                    {kyc.proof_of_address_url && getDocumentUrl(kyc.proof_of_address_url) && (
                      <a
                        href={getDocumentUrl(kyc.proof_of_address_url)!}
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

