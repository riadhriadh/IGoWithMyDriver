# Application Passager - VTC Mobile

Application mobile de réservation de courses VTC construite avec React Native et Expo.

## Fonctionnalités

- Authentification des passagers (inscription/connexion)
- Réservation de courses avec carte interactive
- Suivi en temps réel du chauffeur
- Historique des courses
- Profil utilisateur
- Estimation automatique du prix
- Géolocalisation en temps réel

## Technologies

- React Native avec Expo
- Supabase (base de données et authentification)
- React Native Maps (cartes interactives)
- Expo Location (géolocalisation)
- TypeScript

## Structure du projet

```
app/
├── (tabs)/
│   ├── _layout.tsx          # Navigation par onglets
│   ├── index.tsx            # Écran d'accueil avec carte
│   ├── rides.tsx            # Historique des courses
│   └── profile.tsx          # Profil utilisateur
├── auth/
│   ├── login.tsx            # Connexion
│   └── register.tsx         # Inscription
├── ride/
│   └── tracking.tsx         # Suivi en temps réel
└── _layout.tsx              # Layout principal

contexts/
└── AuthContext.tsx          # Contexte d'authentification

services/
├── rideService.ts           # Service de réservation
├── driverTrackingService.ts # Suivi du chauffeur
└── geocodingService.ts      # Géocodage d'adresses

lib/
└── supabase.ts              # Client Supabase
```

## Démarrage

### Installation

```bash
npm install
```

### Lancer l'application

```bash
npm run dev
```

### Build Web

```bash
npm run build:web
```

## Base de données

La base de données Supabase contient les tables suivantes :

- `passengers` - Profils des passagers
- `ride_requests` - Demandes de courses
- `favorite_places` - Lieux favoris
- `ratings` - Système de notation
- `rides` - Courses (partagée avec l'app chauffeur)

## Variables d'environnement

Les variables d'environnement sont déjà configurées dans `.env` :

- `EXPO_PUBLIC_SUPABASE_URL` - URL du projet Supabase
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Clé anonyme Supabase

## Fonctionnalités principales

### Réservation de course

1. L'utilisateur voit sa position actuelle sur la carte
2. Il sélectionne une destination en appuyant sur la carte
3. Le prix est calculé automatiquement
4. Il peut réserver la course
5. Le système recherche un chauffeur disponible

### Suivi en temps réel

- Position du chauffeur mise à jour en temps réel
- Estimation du temps d'arrivée
- Informations sur le chauffeur et son véhicule
- Possibilité d'appeler le chauffeur
- Annulation de la course

### Historique

- Liste de toutes les courses passées
- Statut de chaque course
- Prix et adresses
- Date et heure

### Profil

- Informations personnelles
- Note moyenne
- Nombre total de courses
- Paramètres
- Déconnexion

## Sécurité

- Row Level Security (RLS) activé sur toutes les tables
- Les passagers ne peuvent voir que leurs propres données
- Authentification sécurisée avec Supabase Auth
- Tokens JWT pour les API

## Prochaines étapes

- Ajouter la recherche d'adresses avec autocomplétion
- Implémenter les paiements avec Stripe
- Ajouter les notifications push
- Système de notation des chauffeurs
- Gestion des lieux favoris
- Mode sombre

## Support

Pour toute question ou problème, consultez la documentation dans le dossier `doc/`.
