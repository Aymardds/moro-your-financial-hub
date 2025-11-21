# MORO - Guide des Fonctionnalités Implémentées

## 🎯 Fonctionnalités Principales

### 1. Authentification par Téléphone + OTP
- **Page de connexion** (`/login`) avec authentification via numéro de téléphone
- Intégration avec Supabase Auth pour l'envoi et la vérification des codes OTP
- **Support multi-pays** : Mali, Sénégal, Côte d'Ivoire, Bénin, Togo
  - Sélecteur de pays avec drapeaux
  - Formatage automatique selon le pays
  - Validation des numéros par pays
  - Normalisation automatique avec code pays
- Interface utilisateur avec composant InputOTP pour la saisie du code
- Utilitaire de formatage (`src/utils/phoneFormatter.ts`) pour gérer tous les formats

### 2. Dashboard Entrepreneur
- **Route**: `/dashboard` (redirige automatiquement selon le rôle)
- **Sections principales**:
  - **Opérations**: Gestion des revenus et dépenses avec historique
  - **Projets**: Suivi des projets avec progression et statuts
  - **Épargne**: Objectifs d'épargne avec suivi de progression
- Statistiques en temps réel (solde, projets actifs, épargne totale)
- Interface avec onglets pour naviguer entre les sections

### 3. Interfaces Multi-Rôles
- **Entrepreneur**: Dashboard complet avec opérations, projets et épargne
- **Agent**: Gestion des clients et transactions
- **Coopérative**: Gestion des membres et prêts
- **Institution**: Gestion des demandes de financement avec scoring IA
- Redirection automatique vers le bon dashboard selon le rôle de l'utilisateur

### 4. Intégration Wave Mobile Money
- **Service** (`src/services/waveService.ts`):
  - Initialisation de paiements
  - Vérification du statut des paiements
  - Création et gestion d'abonnements
  - Annulation d'abonnements
- **Page d'abonnement** (`/subscription`):
  - 3 plans disponibles (Basique, Professionnel, Premium)
  - Options mensuelles et annuelles (10% de réduction)
  - Paiement via Wave Mobile Money
  - Enregistrement des abonnements dans Supabase

### 5. Scoring IA pour le Financement
- **Service** (`src/services/scoringService.ts`):
  - Calcul de score basé sur 5 facteurs:
    - Stabilité financière (30%)
    - Activité commerciale (25%)
    - Comportement d'épargne (20%)
    - Taux de succès des projets (15%)
    - Maturité du compte (10%)
  - Ajustement selon le montant demandé par rapport aux revenus
  - Génération de recommandations (approve/review/reject)
  - Raisonnement détaillé pour chaque score
- **Page de demande** (`/financing/apply`):
  - Formulaire de demande de financement
  - Calcul du score en temps réel
  - Affichage du score et recommandations
  - Soumission de la demande à une institution

## 📁 Structure des Fichiers

```
src/
├── contexts/
│   └── AuthContext.tsx          # Contexte d'authentification
├── components/
│   ├── ProtectedRoute.tsx       # Composant de protection des routes
│   └── Header.tsx                # Header avec gestion d'authentification
├── pages/
│   ├── Login.tsx                 # Page de connexion
│   ├── DashboardEntrepreneur.tsx # Dashboard entrepreneur
│   ├── DashboardAgent.tsx        # Dashboard agent
│   ├── DashboardCooperative.tsx  # Dashboard coopérative
│   ├── DashboardInstitution.tsx # Dashboard institution
│   ├── Subscription.tsx          # Page d'abonnement Wave
│   ├── FinancingApplication.tsx  # Demande de financement
│   └── Unauthorized.tsx          # Page d'accès non autorisé
├── services/
│   ├── waveService.ts            # Service Wave Mobile Money
│   └── scoringService.ts         # Service de scoring IA
├── utils/
│   └── phoneFormatter.ts         # Formatage et validation des numéros de téléphone multi-pays
└── App.tsx                       # Routes principales
```

## 🗄️ Base de Données

Le fichier `supabase/migrations/001_initial_schema.sql` contient:
- Toutes les tables nécessaires
- Index pour les performances
- Row Level Security (RLS) pour la sécurité
- Triggers pour la mise à jour automatique des timestamps

### Tables principales:
- `user_profiles`: Profils utilisateurs avec rôles
- `operations`: Opérations financières (revenus/dépenses)
- `projects`: Projets avec suivi de progression
- `savings`: Objectifs d'épargne
- `subscriptions`: Abonnements Wave
- `agent_clients`: Clients des agents
- `agent_transactions`: Transactions des agents
- `cooperative_members`: Membres de coopérative
- `cooperative_loans`: Prêts de coopérative
- `financing_applications`: Demandes de financement

## 🔐 Sécurité

- Authentification via Supabase Auth
- Row Level Security (RLS) activé sur toutes les tables
- Routes protégées avec vérification des rôles
- Validation des données côté client et serveur

## 🚀 Configuration Requise

### Variables d'environnement
Créer un fichier `.env` avec:
```
VITE_WAVE_API_KEY=votre_clé_api_wave
VITE_WAVE_MERCHANT_KEY=votre_clé_merchant_wave
```

### Supabase
1. Créer un projet Supabase
2. Exécuter le script de migration SQL
3. Configurer l'authentification par téléphone dans Supabase Dashboard
4. Mettre à jour les clés dans `src/integrations/supabase/client.ts`

## 📝 Notes Importantes

1. **Wave Mobile Money**: Les appels API sont simulés. Pour la production, remplacer par les vrais endpoints Wave.
2. **Scoring IA**: L'algorithme peut être amélioré avec du machine learning pour plus de précision.
3. **RLS**: Les politiques de sécurité peuvent être ajustées selon les besoins spécifiques.
4. **Formatage téléphone**: Support complet pour 5 pays d'Afrique de l'Ouest avec validation et normalisation automatique.

## ⚙️ Configuration Requise

### Supabase - Authentification par Téléphone

**IMPORTANT** : L'authentification par téléphone nécessite la configuration d'un provider SMS dans Supabase.

1. Aller dans **Supabase Dashboard** → **Authentication** → **Providers** → **Phone**
2. Activer le provider et choisir :
   - **Twilio** (recommandé)
   - **MessageBird**
   - **Vonage**
3. Entrer les identifiants du provider
4. Voir `SUPABASE_SETUP.md` pour les instructions détaillées

**Erreur "Unsupported phone provider"** : Cela signifie qu'aucun provider SMS n'est configuré. Suivez les instructions dans `SUPABASE_SETUP.md`.

## 🔄 Prochaines Étapes

- [ ] Implémenter les formulaires de création d'opérations, projets et épargne
- [ ] Ajouter des graphiques et visualisations
- [ ] Implémenter les notifications
- [ ] Ajouter la gestion des fichiers (documents de financement)
- [ ] Améliorer l'algorithme de scoring avec ML
- [ ] Ajouter des tests unitaires et d'intégration

