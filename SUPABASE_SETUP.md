# Configuration Supabase pour l'Authentification par Téléphone

## ⚠️ Erreur "Unsupported phone provider"

Cette erreur indique que Supabase n'a pas de provider SMS configuré. Voici comment le configurer.

## 📋 Étapes de Configuration

### Option 1 : Twilio (Recommandé)

1. **Créer un compte Twilio**
   - Aller sur [twilio.com](https://www.twilio.com)
   - Créer un compte gratuit (crédits de test disponibles)
   - Noter votre `Account SID` et `Auth Token`

2. **Configurer dans Supabase Dashboard**
   - Aller dans votre projet Supabase
   - Navigation : **Authentication** → **Providers** → **Phone**
   - Activer "Enable phone provider"
   - Sélectionner **Twilio** comme provider
   - Entrer vos identifiants Twilio :
     - `Account SID`
     - `Auth Token`
     - `From` (numéro Twilio au format E.164, ex: +1234567890)

3. **Configurer les numéros de téléphone**
   - Dans Twilio, vous pouvez utiliser des numéros de test pour le développement
   - Pour la production, acheter un numéro Twilio dans les pays supportés

### Option 2 : MessageBird

1. **Créer un compte MessageBird**
   - Aller sur [messagebird.com](https://www.messagebird.com)
   - Créer un compte
   - Obtenir votre `API Key`

2. **Configurer dans Supabase**
   - Dans **Authentication** → **Providers** → **Phone**
   - Sélectionner **MessageBird**
   - Entrer votre `API Key`

### Option 3 : Vonage (Nexmo)

1. **Créer un compte Vonage**
   - Aller sur [vonage.com](https://www.vonage.com)
   - Créer un compte
   - Obtenir `API Key` et `API Secret`

2. **Configurer dans Supabase**
   - Dans **Authentication** → **Providers** → **Phone**
   - Sélectionner **Vonage**
   - Entrer vos identifiants

## 🔧 Configuration Alternative : Mode Développement

Si vous êtes en développement et ne voulez pas configurer un provider SMS immédiatement, vous pouvez :

### Option A : Utiliser l'email temporairement
Modifier temporairement le code pour utiliser l'email au lieu du téléphone pour les tests.

### Option B : Utiliser Supabase Local Development
Utiliser Supabase en local avec des numéros de test.

### Option C : Mock du service SMS
Créer un mock pour le développement qui simule l'envoi de SMS.

## 📱 Support des Pays

Assurez-vous que votre provider SMS supporte les pays suivants :
- 🇲🇱 Mali (+223)
- 🇸🇳 Sénégal (+221)
- 🇨🇮 Côte d'Ivoire (+225)
- 🇧🇯 Bénin (+229)
- 🇹🇬 Togo (+228)

### Vérification Twilio
Twilio supporte tous ces pays. Vérifiez la disponibilité des numéros dans chaque pays sur le [Twilio Console](https://console.twilio.com/).

## 🧪 Test de Configuration

Après configuration, testez avec :

1. Un numéro de test Twilio (si vous utilisez Twilio) :
   - Format : `+15005550006` (numéro de test Twilio)
   - Code OTP : `123456` (code de test)

2. Votre propre numéro :
   - Utiliser un numéro réel dans un des pays supportés
   - Vérifier que le SMS arrive

## 🔍 Vérification

Pour vérifier que la configuration fonctionne :

1. Allez dans **Supabase Dashboard** → **Authentication** → **Logs**
2. Tentez une connexion
3. Vérifiez les logs pour voir si le SMS est envoyé

## 📝 Notes Importantes

- **Coûts** : Les SMS ont un coût (environ $0.01-0.05 par SMS selon le pays)
- **Limites** : Les comptes gratuits ont souvent des limites
- **Production** : Pour la production, utilisez un provider fiable avec support 24/7
- **Sécurité** : Ne partagez jamais vos clés API publiquement

## 🚨 Dépannage

### Erreur "Invalid phone number"
- Vérifiez que le numéro est au format E.164 : `+221771234567`
- Pas d'espaces, pas de tirets

### Erreur "Provider not configured"
- Vérifiez que vous avez bien activé le provider dans Supabase
- Vérifiez que vos identifiants sont corrects
- Vérifiez que le provider est bien sauvegardé

### SMS non reçu
- Vérifiez les logs Supabase
- Vérifiez votre compte provider (Twilio, etc.)
- Vérifiez que le numéro est valide et actif
- Vérifiez que vous avez des crédits disponibles

## 📚 Ressources

- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth/phone-login)
- [Documentation Twilio](https://www.twilio.com/docs)
- [Format E.164](https://en.wikipedia.org/wiki/E.164)

