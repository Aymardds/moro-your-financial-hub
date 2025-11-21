import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface KYCFormProps {
  entityType: 'entrepreneur' | 'cooperative' | 'institution';
  onSuccess?: () => void;
}

export const KYCForm = ({ entityType, onSuccess }: KYCFormProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    business_name: '',
    registration_number: '',
    tax_id: '',
    date_of_birth: '',
    nationality: '',
    address: '',
    city: '',
    country: '',
    postal_code: '',
    contact_email: '',
    contact_phone: '',
    bank_name: '',
    bank_account_number: '',
    bank_iban: '',
  });

  const [documents, setDocuments] = useState({
    identity: null as File | null,
    business_registration: null as File | null,
    tax_certificate: null as File | null,
    proof_of_address: null as File | null,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (type: keyof typeof documents, file: File | null) => {
    setDocuments((prev) => ({ ...prev, [type]: file }));
  };

  const uploadFile = async (file: File, userId: string): Promise<string | null> => {
    try {
      // Vérifier la taille du fichier (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Erreur',
          description: 'Le fichier est trop volumineux (max 10MB)',
          variant: 'destructive',
        });
        return null;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: 'Erreur',
          description: 'Impossible d\'uploader le fichier: ' + uploadError.message,
          variant: 'destructive',
        });
        return null;
      }

      // Retourner le chemin du fichier (on utilisera getPublicUrl pour l'accès)
      return fileName;
    } catch (error) {
      console.error('File upload error:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Créer la validation KYC
      const { data: kycValidation, error: kycError } = await supabase
        .from('kyc_validations')
        .insert({
          user_id: user.id,
          entity_type: entityType,
          status: 'pending',
          ...formData,
          contact_email: formData.contact_email || user.email || '',
        })
        .select()
        .single();

      if (kycError) throw kycError;

      // Uploader les documents et mettre à jour la validation
      const updateData: any = {};
      const documentUploads = [];

      for (const [type, file] of Object.entries(documents)) {
        if (file && kycValidation) {
          const filePath = await uploadFile(file, user.id);
          if (filePath) {
            // Mapper le type de document
            const docType = type === 'identity' ? 'identity' : 
                           type === 'business_registration' ? 'business_registration' :
                           type === 'tax_certificate' ? 'tax_certificate' :
                           'proof_of_address';

            // Ajouter à la table kyc_documents
            documentUploads.push({
              kyc_validation_id: kycValidation.id,
              document_type: docType,
              file_url: filePath,
              file_name: file.name,
              file_size: file.size,
              mime_type: file.type,
            });

            // Mettre à jour les URLs dans kyc_validations
            if (type === 'identity') {
              updateData.identity_document_url = filePath;
            } else if (type === 'business_registration') {
              updateData.business_registration_url = filePath;
            } else if (type === 'tax_certificate') {
              updateData.tax_certificate_url = filePath;
            } else if (type === 'proof_of_address') {
              updateData.proof_of_address_url = filePath;
            }
          }
        }
      }

      // Insérer les documents dans kyc_documents
      if (documentUploads.length > 0) {
        const { error: docError } = await supabase
          .from('kyc_documents')
          .insert(documentUploads);

        if (docError) throw docError;
      }

      // Mettre à jour la validation avec les chemins des documents
      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('kyc_validations')
          .update(updateData)
          .eq('id', kycValidation.id);

        if (updateError) throw updateError;
      }

      toast({
        title: 'Succès',
        description: 'Votre demande KYC a été soumise avec succès. Elle sera examinée sous peu.',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de soumettre la demande KYC',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Validation KYC</CardTitle>
        <CardDescription>
          Complétez votre profil pour accéder à toutes les fonctionnalités
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations personnelles */}
          <div className="space-y-4">
            <h3 className="font-semibold">Informations Personnelles</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nom complet *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  required
                />
              </div>

              {entityType !== 'entrepreneur' && (
                <div className="space-y-2">
                  <Label htmlFor="business_name">Nom de l'entreprise *</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => handleInputChange('business_name', e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="registration_number">Numéro d'enregistrement</Label>
                <Input
                  id="registration_number"
                  value={formData.registration_number}
                  onChange={(e) => handleInputChange('registration_number', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_id">Numéro fiscal</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => handleInputChange('tax_id', e.target.value)}
                />
              </div>

              {entityType === 'entrepreneur' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date de naissance</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationalité</Label>
                    <Input
                      id="nationality"
                      value={formData.nationality}
                      onChange={(e) => handleInputChange('nationality', e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Adresse */}
          <div className="space-y-4">
            <h3 className="font-semibold">Adresse</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Adresse complète *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Ville *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Pays *</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => handleInputChange('country', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SN">Sénégal</SelectItem>
                    <SelectItem value="ML">Mali</SelectItem>
                    <SelectItem value="CI">Côte d'Ivoire</SelectItem>
                    <SelectItem value="BJ">Bénin</SelectItem>
                    <SelectItem value="TG">Togo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">Code postal</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Informations bancaires */}
          <div className="space-y-4">
            <h3 className="font-semibold">Informations Bancaires</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Nom de la banque</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => handleInputChange('bank_name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account_number">Numéro de compte</Label>
                <Input
                  id="bank_account_number"
                  value={formData.bank_account_number}
                  onChange={(e) => handleInputChange('bank_account_number', e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bank_iban">IBAN</Label>
                <Input
                  id="bank_iban"
                  value={formData.bank_iban}
                  onChange={(e) => handleInputChange('bank_iban', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-4">
            <h3 className="font-semibold">Documents Requis</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="identity">Pièce d'identité *</Label>
                <Input
                  id="identity"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange('identity', e.target.files?.[0] || null)}
                  required
                />
                {documents.identity && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {documents.identity.name}
                  </p>
                )}
              </div>

              {entityType !== 'entrepreneur' && (
                <div className="space-y-2">
                  <Label htmlFor="business_registration">Document d'enregistrement *</Label>
                  <Input
                    id="business_registration"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange('business_registration', e.target.files?.[0] || null)}
                    required
                  />
                  {documents.business_registration && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {documents.business_registration.name}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="tax_certificate">Certificat fiscal</Label>
                <Input
                  id="tax_certificate"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange('tax_certificate', e.target.files?.[0] || null)}
                />
                {documents.tax_certificate && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {documents.tax_certificate.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="proof_of_address">Justificatif de domicile *</Label>
                <Input
                  id="proof_of_address"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange('proof_of_address', e.target.files?.[0] || null)}
                  required
                />
                {documents.proof_of_address && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {documents.proof_of_address.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Soumission...' : 'Soumettre la demande KYC'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

