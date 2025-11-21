/**
 * Utilitaire pour formater et valider les numéros de téléphone
 * Support: Mali, Sénégal, Côte d'Ivoire, Bénin, Togo
 */

export type CountryCode = 'ML' | 'SN' | 'CI' | 'BJ' | 'TG';

export interface CountryPhoneConfig {
  code: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
  format: (phone: string) => string;
  validate: (phone: string) => boolean;
  normalize: (phone: string) => string;
}

const countryConfigs: Record<CountryCode, CountryPhoneConfig> = {
  ML: {
    code: 'ML',
    name: 'Mali',
    dialCode: '+223',
    flag: '🇲🇱',
    format: (phone: string) => {
      // Format: +223 XX XX XX XX ou +223 X XX XX XX
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 8) {
        return `+223 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)}`;
      } else if (cleaned.length === 9) {
        return `+223 ${cleaned.slice(0, 1)} ${cleaned.slice(1, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)}`;
      }
      return phone;
    },
    validate: (phone: string) => {
      const cleaned = phone.replace(/\D/g, '');
      // Mali: 8 ou 9 chiffres après le code pays
      return cleaned.length >= 8 && cleaned.length <= 9;
    },
    normalize: (phone: string) => {
      // Nettoyer le numéro (garder seulement les chiffres)
      const cleaned = phone.replace(/\D/g, '');
      // Si le numéro commence déjà par le code pays, retourner avec +
      if (cleaned.startsWith('223')) {
        return `+${cleaned}`;
      }
      // Sinon, ajouter le code pays
      // Format E.164: +223XXXXXXXX (sans espaces)
      return `+223${cleaned}`;
    },
  },
  SN: {
    code: 'SN',
    name: 'Sénégal',
    dialCode: '+221',
    flag: '🇸🇳',
    format: (phone: string) => {
      // Format: +221 XX XXX XX XX
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 9) {
        return `+221 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)}`;
      }
      return phone;
    },
    validate: (phone: string) => {
      const cleaned = phone.replace(/\D/g, '');
      // Sénégal: 9 chiffres après le code pays (ex: 77 123 45 67)
      return cleaned.length === 9 || (cleaned.startsWith('221') && cleaned.length === 12);
    },
    normalize: (phone: string) => {
      // Nettoyer le numéro (garder seulement les chiffres)
      const cleaned = phone.replace(/\D/g, '');
      // Si le numéro commence déjà par le code pays, retourner avec +
      if (cleaned.startsWith('221')) {
        return `+${cleaned}`;
      }
      // Sinon, ajouter le code pays
      // Format E.164: +221XXXXXXXXX (sans espaces)
      return `+221${cleaned}`;
    },
  },
  CI: {
    code: 'CI',
    name: 'Côte d\'Ivoire',
    dialCode: '+225',
    flag: '🇨🇮',
    format: (phone: string) => {
      // Format: +225 XX XX XX XX XX
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 10) {
        return `+225 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
      }
      return phone;
    },
    validate: (phone: string) => {
      const cleaned = phone.replace(/\D/g, '');
      // Côte d'Ivoire: 10 chiffres après le code pays
      return cleaned.length === 10 || (cleaned.startsWith('225') && cleaned.length === 13);
    },
    normalize: (phone: string) => {
      // Nettoyer le numéro (garder seulement les chiffres)
      const cleaned = phone.replace(/\D/g, '');
      // Si le numéro commence déjà par le code pays, retourner avec +
      if (cleaned.startsWith('225')) {
        return `+${cleaned}`;
      }
      // Sinon, ajouter le code pays
      // Format E.164: +225XXXXXXXXXX (sans espaces)
      return `+225${cleaned}`;
    },
  },
  BJ: {
    code: 'BJ',
    name: 'Bénin',
    dialCode: '+229',
    flag: '🇧🇯',
    format: (phone: string) => {
      // Format: +229 XX XX XX XX
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 8) {
        return `+229 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)}`;
      }
      return phone;
    },
    validate: (phone: string) => {
      const cleaned = phone.replace(/\D/g, '');
      // Bénin: 8 chiffres après le code pays
      return cleaned.length === 8 || (cleaned.startsWith('229') && cleaned.length === 11);
    },
    normalize: (phone: string) => {
      // Nettoyer le numéro (garder seulement les chiffres)
      const cleaned = phone.replace(/\D/g, '');
      // Si le numéro commence déjà par le code pays, retourner avec +
      if (cleaned.startsWith('229')) {
        return `+${cleaned}`;
      }
      // Sinon, ajouter le code pays
      // Format E.164: +229XXXXXXXX (sans espaces)
      return `+229${cleaned}`;
    },
  },
  TG: {
    code: 'TG',
    name: 'Togo',
    dialCode: '+228',
    flag: '🇹🇬',
    format: (phone: string) => {
      // Format: +228 XX XX XX XX
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 8) {
        return `+228 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)}`;
      }
      return phone;
    },
    validate: (phone: string) => {
      const cleaned = phone.replace(/\D/g, '');
      // Togo: 8 chiffres après le code pays
      return cleaned.length === 8 || (cleaned.startsWith('228') && cleaned.length === 11);
    },
    normalize: (phone: string) => {
      // Nettoyer le numéro (garder seulement les chiffres)
      const cleaned = phone.replace(/\D/g, '');
      // Si le numéro commence déjà par le code pays, retourner avec +
      if (cleaned.startsWith('228')) {
        return `+${cleaned}`;
      }
      // Sinon, ajouter le code pays
      // Format E.164: +228XXXXXXXX (sans espaces)
      return `+228${cleaned}`;
    },
  },
};

/**
 * Obtenir la configuration d'un pays
 */
export const getCountryConfig = (code: CountryCode): CountryPhoneConfig => {
  return countryConfigs[code];
};

/**
 * Obtenir toutes les configurations de pays
 */
export const getAllCountries = (): CountryPhoneConfig[] => {
  return Object.values(countryConfigs);
};

/**
 * Détecter le pays depuis un numéro de téléphone
 */
export const detectCountry = (phone: string): CountryCode | null => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('223')) return 'ML';
  if (cleaned.startsWith('221')) return 'SN';
  if (cleaned.startsWith('225')) return 'CI';
  if (cleaned.startsWith('229')) return 'BJ';
  if (cleaned.startsWith('228')) return 'TG';
  
  return null;
};

/**
 * Formater un numéro de téléphone selon le pays
 */
export const formatPhoneNumber = (phone: string, countryCode: CountryCode): string => {
  const config = getCountryConfig(countryCode);
  return config.format(phone);
};

/**
 * Normaliser un numéro de téléphone (ajouter le code pays si absent)
 */
export const normalizePhoneNumber = (phone: string, countryCode: CountryCode): string => {
  const config = getCountryConfig(countryCode);
  return config.normalize(phone);
};

/**
 * Valider un numéro de téléphone selon le pays
 */
export const validatePhoneNumber = (phone: string, countryCode: CountryCode): boolean => {
  const config = getCountryConfig(countryCode);
  return config.validate(phone);
};

/**
 * Obtenir un exemple de format pour un pays
 */
export const getPhoneExample = (countryCode: CountryCode): string => {
  const config = getCountryConfig(countryCode);
  switch (countryCode) {
    case 'ML':
      return '20 12 34 56';
    case 'SN':
      return '77 123 45 67';
    case 'CI':
      return '07 12 34 56 78';
    case 'BJ':
      return '90 12 34 56';
    case 'TG':
      return '90 12 34 56';
    default:
      return '';
  }
};

