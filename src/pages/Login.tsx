import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Phone, Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getAllCountries,
  normalizePhoneNumber,
  validatePhoneNumber,
  getPhoneExample,
  type CountryCode,
} from '@/utils/phoneFormatter';

export default function Login() {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('SN');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const { signInWithPhone, verifyOTP, signInWithEmail, verifyEmailOTP } = useAuth();

  const countries = getAllCountries();
  const selectedCountryConfig = countries.find((c) => c.code === selectedCountry);

  // Mettre à jour le numéro normalisé quand le pays ou le téléphone change
  useEffect(() => {
    if (phone) {
      const normalized = normalizePhoneNumber(phone, selectedCountry);
      setNormalizedPhone(normalized);
    } else {
      setNormalizedPhone('');
    }
  }, [phone, selectedCountry]);

  const handlePhoneChange = (value: string) => {
    // Nettoyer le numéro (garder seulement les chiffres et espaces)
    const cleaned = value.replace(/[^\d\s]/g, '');
    setPhone(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (authMethod === 'phone') {
      // Valider le numéro
      if (!validatePhoneNumber(phone, selectedCountry)) {
        toast({
          title: 'Erreur',
          description: `Format de numéro invalide pour ${selectedCountryConfig?.name}. Exemple: ${getPhoneExample(selectedCountry)}`,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Normaliser le numéro au format E.164 (sans espaces)
      const finalPhone = normalizedPhone || normalizePhoneNumber(phone, selectedCountry);
      const cleanedPhone = finalPhone.replace(/\s/g, '');

      const { error } = await signInWithPhone(cleanedPhone);

      if (error) {
        const errorMessage = (error as any)?.userMessage || error.message || 'Impossible d\'envoyer le code OTP';
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
        setLoading(false);
      } else {
        toast({
          title: 'Code envoyé',
          description: 'Vérifiez votre téléphone pour le code de vérification',
        });
        setStep('otp');
        setLoading(false);
      }
    } else {
      // Authentification par email
      if (!email || !email.includes('@')) {
        toast({
          title: 'Erreur',
          description: 'Veuillez entrer une adresse email valide',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const { error } = await signInWithEmail(email);

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
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (authMethod === 'phone') {
      const finalPhone = normalizedPhone || normalizePhoneNumber(phone, selectedCountry);
      const cleanedPhone = finalPhone.replace(/\s/g, '');
      const { error } = await verifyOTP(cleanedPhone, otp);

      if (error) {
        toast({
          title: 'Erreur',
          description: error.message || 'Code OTP invalide',
          variant: 'destructive',
        });
        setLoading(false);
      } else {
        toast({
          title: 'Connexion réussie',
          description: 'Redirection en cours...',
        });
      }
    } else {
      const { error } = await verifyEmailOTP(email, otp);

      if (error) {
        toast({
          title: 'Erreur',
          description: error.message || 'Code OTP invalide',
          variant: 'destructive',
        });
        setLoading(false);
      } else {
        toast({
          title: 'Connexion réussie',
          description: 'Redirection en cours...',
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
              <CardDescription>
                {step === 'input'
                  ? authMethod === 'email'
                    ? 'Entrez votre adresse email'
                    : 'Entrez votre numéro de téléphone'
                  : 'Entrez le code de vérification'}
              </CardDescription>
            </div>
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {step === 'input' ? (
            <Tabs value={authMethod} onValueChange={(v) => {
              setAuthMethod(v as 'email' | 'phone');
              setPhone('');
              setEmail('');
              setOtp('');
            }} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Téléphone
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-4 mt-4">
                <form onSubmit={handleSubmit} className="space-y-4">
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
                    <p className="text-xs text-muted-foreground">
                      Nous vous enverrons un code de vérification par email
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading || !email}>
                    {loading ? 'Envoi en cours...' : 'Envoyer le code'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="phone" className="space-y-4 mt-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Pays</Label>
                    <Select
                      value={selectedCountry}
                      onValueChange={(value) => {
                        setSelectedCountry(value as CountryCode);
                        setPhone('');
                      }}
                    >
                      <SelectTrigger id="country">
                        <SelectValue>
                          {selectedCountryConfig && (
                            <span className="flex items-center gap-2">
                              <span>{selectedCountryConfig.flag}</span>
                              <span>{selectedCountryConfig.name}</span>
                              <span className="text-muted-foreground">
                                ({selectedCountryConfig.dialCode})
                              </span>
                            </span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            <span className="flex items-center gap-2">
                              <span>{country.flag}</span>
                              <span>{country.name}</span>
                              <span className="text-muted-foreground">({country.dialCode})</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Numéro de téléphone</Label>
                    <div className="flex gap-2">
                      <div className="flex items-center px-3 border border-input rounded-md bg-muted text-sm text-muted-foreground">
                        {selectedCountryConfig?.dialCode}
                      </div>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder={getPhoneExample(selectedCountry)}
                          value={phone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Format: {getPhoneExample(selectedCountry)} ({selectedCountryConfig?.name})
                    </p>
                    {normalizedPhone && (
                      <p className="text-xs text-primary">
                        Numéro formaté: {normalizedPhone}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading || !phone}>
                    {loading ? 'Envoi en cours...' : 'Envoyer le code'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
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
                  Entrez le code à 6 chiffres reçu par {authMethod === 'email' ? 'email' : 'SMS'}
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
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Vous n'avez pas de compte ?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Créer un compte
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

