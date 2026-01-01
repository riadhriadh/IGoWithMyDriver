# GoWithMyDriver - Monorepo

Plateforme complète de gestion de courses VTC (Taxi/Driver) avec backend NestJS et applications mobiles React Native.

## 🏗️ Architecture du Monorepo

```
IGoWithMyDriver/
├── backend/                    # Backend NestJS + MongoDB + Redis
│   ├── src/                    # Code source NestJS
│   ├── docker-compose.yml      # MongoDB + Redis
│   └── package.json
├── gowithmydriver/             # Application mobile Driver (React Native/Expo)
│   ├── app/                    # Écrans Expo Router
│   ├── services/               # Services backend API
│   ├── contexts/               # React Contexts
│   └── package.json
├── gowithmydriverclient/       # Application mobile Passager (React Native/Expo)
│   ├── app/                    # Écrans Expo Router
│   ├── services/               # Services backend API
│   ├── contexts/               # React Contexts
│   └── package.json
└── docs/                       # Documentation globale
```

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+
- Docker & Docker Compose
- npm ou yarn
- Expo CLI (pour les apps mobiles)

### 1. Backend API

```bash
cd backend

# Démarrer MongoDB + Redis
docker-compose up -d mongo redis

# Installer les dépendances
npm install

# Démarrer le serveur
npm run start:dev
```

Backend disponible sur : http://localhost:3000

### 2. Application Driver

```bash
cd gowithmydriver

# Installer les dépendances
npm install

# Démarrer l'app
npm run dev
```

Scanner le QR code avec Expo Go sur votre téléphone.

### 3. Application Passager

```bash
cd gowithmydriverclient

# Installer les dépendances
npm install

# Démarrer l'app
npm run dev
```

## 📦 Technologies

### Backend
- **NestJS** - Framework Node.js
- **MongoDB** - Base de données NoSQL
- **Redis** - Cache et sessions
- **JWT** - Authentication
- **Socket.IO** - WebSockets temps réel
- **Mongoose** - ODM MongoDB

### Applications Mobiles
- **React Native** - Framework mobile
- **Expo** - Tooling et build
- **TypeScript** - Typage statique
- **React Navigation** - Navigation
- **Axios** - Requêtes HTTP
- **Google Maps** - Cartes et localisation

## 🎯 Fonctionnalités

### Backend API (43 endpoints)
- ✅ Authentication JWT (login, register, refresh)
- ✅ Gestion des courses (CRUD, accept, start, complete, cancel)
- ✅ Profils drivers (status, localisation GPS, gains)
- ✅ Profils passagers
- ✅ Paiements
- ✅ Notations
- ✅ Cache Redis pour performances
- ✅ WebSocket pour temps réel

### App Driver (gowithmydriver)
- ✅ Login/Register
- ✅ Voir courses disponibles
- ✅ Accepter/Démarrer/Terminer courses
- ✅ Carte Google Maps interactive
- ✅ Navigation (Waze, Google Maps, Apple Maps)
- ✅ Swiper pour changer statut (style Uber)
- ✅ Tracking GPS en temps réel
- ✅ Historique et gains
- ✅ Gestion véhicules
- ✅ Planning
- ✅ 100% sans Supabase (Backend API uniquement)

### App Passager (gowithmydriverclient)
- ✅ Réserver une course
- ✅ Suivre le chauffeur en temps réel
- ✅ Paiement intégré
- ✅ Notation des courses
- ⏳ Migration backend API en cours

## 🔐 Credentials de Test

```
Email:    farhatired2@gmail.com
Password: 367045Aa?
```

Voir `PASSWORD_REMINDER.txt` et `CREDENTIALS.md` pour plus de détails.

## 📚 Documentation

### Générale
- [Architecture Overview](docs/01-architecture-overview.md)
- [Setup Guide](docs/02-setup-guide.md)
- [Backend API Status](BACKEND_API_STATUS.md)

### Backend
- [Backend Architecture](backend/ARCHITECTURE.md)
- [Backend README](backend/README.md)
- [API Documentation](http://localhost:3000/api/v1/docs) (Swagger)

### App Driver
- [Migration Supabase → Backend](gowithmydriver/NO_SUPABASE_COMPLETE.md)
- [Backend Integration](gowithmydriver/BACKEND_INTEGRATION.md)
- [Services Documentation](gowithmydriver/services/README.md)

### App Passager
- [Backend Migration Guide](gowithmydriverclient/BACKEND_MIGRATION.md)

## 🔄 Workflow de Développement

### Structure Monorepo

Tous les projets sont maintenant dans un seul repo Git :
- **Avantages** : Commits atomiques, versions synchronisées, CI/CD simplifié
- **Branches** : `main` pour production, feature branches pour développement

### Commits

```bash
# À la racine du projet
git add backend/ gowithmydriver/ gowithmydriverclient/
git commit -m "feat: Description du changement"
git push origin main
```

### Développement Parallèle

```bash
# Terminal 1 - Backend
cd backend && npm run start:dev

# Terminal 2 - App Driver
cd gowithmydriver && npm run dev

# Terminal 3 - App Passager
cd gowithmydriverclient && npm run dev
```

## 📊 Statistiques du Projet

- **Commits** : 30+
- **Fichiers** : 120+
- **Lignes de code** : 60,000+
- **Services backend** : 7
- **Endpoints API** : 43
- **Écrans mobiles** : 25+

## 🎉 État de la Migration Supabase

### App Driver (gowithmydriver)
✅ **100% Migrée** - 0 dépendance Supabase
- 22 fichiers migrés
- 7 services backend créés
- Tous les écrans fonctionnels

### App Passager (gowithmydriverclient)
⏳ **En cours** - Utilise encore Supabase
- À migrer vers backend API

## 🚀 Déploiement

### Backend
- Docker Compose pour développement
- À déployer sur : AWS, GCP, Azure, DigitalOcean
- MongoDB Atlas pour production

### Applications Mobiles
- Expo EAS Build pour iOS/Android
- Over-the-air updates avec Expo
- App Store / Google Play

## 🤝 Contribution

Ce projet est privé. Pour contribuer :
1. Créer une branche feature
2. Faire vos modifications
3. Créer une Pull Request
4. Attendre la review

## 📝 Licence

Propriétaire - Tous droits réservés

## 📧 Contact

Pour toute question : [Votre email]

---

**Dernière mise à jour** : Janvier 2026  
**Status** : ✅ Production Ready (Backend + App Driver)

