# Documentation Backend NestJS + MongoDB

Cette documentation décrit comment créer un backend NestJS avec MongoDB pour remplacer Supabase dans l'application de gestion de courses de taxi.

## Table des Matières

1. **[Architecture Overview](./01-architecture-overview.md)**
   - Vue d'ensemble de l'architecture
   - Stack technique
   - Modules principaux
   - Avantages/Inconvénients vs Supabase

2. **[Setup Guide](./02-setup-guide.md)**
   - Installation et configuration initiale
   - Configuration de MongoDB
   - Configuration de l'environnement
   - Structure du projet
   - Docker setup

3. **[Authentication](./03-authentication.md)**
   - Système d'authentification JWT
   - Schéma Driver (Utilisateur)
   - Registration et Login
   - Refresh tokens
   - Guards et Strategies Passport

4. **[Rides Implementation](./04-rides-implementation.md)**
   - Schéma Ride complet avec tous les statuts
   - Service de gestion des courses
   - WebSocket pour temps réel
   - API REST complète
   - Validation des transitions de statuts

## Guide de Migration

### Étapes Principales

1. **Développement Backend** (2-3 semaines)
   - Suivre le [Setup Guide](./02-setup-guide.md)
   - Implémenter [Authentication](./03-authentication.md)
   - Créer le [Module Rides](./04-rides-implementation.md)
   - Implémenter les autres modules (Documents, Vehicles, etc.)

2. **Migration des Données** (1 semaine)
   - Exporter les données de Supabase
   - Transformer les données pour MongoDB
   - Importer dans MongoDB
   - Valider l'intégrité

3. **Adaptation Frontend** (1-2 semaines)
   - Remplacer les appels Supabase par des appels HTTP
   - Implémenter WebSocket client
   - Gérer l'authentification JWT
   - Tester toutes les fonctionnalités

4. **Tests et Déploiement** (1 semaine)
   - Tests d'intégration
   - Tests de charge
   - Déploiement en production
   - Monitoring

## Comparaison Rapide

### Supabase (Actuel)
```typescript
// Client Supabase
const { data, error } = await supabase
  .from('rides')
  .select('*')
  .eq('driver_id', driverId);
```

### NestJS Backend (Nouveau)
```typescript
// Client HTTP
const response = await fetch('http://api.example.com/api/v1/rides', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});
const rides = await response.json();
```

## Avantages de la Migration

✅ **Contrôle Total**: Vous contrôlez 100% de votre backend
✅ **Logique Métier**: Plus facile d'implémenter des règles complexes
✅ **Flexibilité**: Pas de limitations imposées par Supabase
✅ **Performance**: Optimisations personnalisées
✅ **Évolutivité**: Scale selon vos besoins réels
✅ **Indépendance**: Pas de vendor lock-in

## Considérations

❌ **Temps de développement**: ~6-8 semaines pour une migration complète
❌ **Maintenance**: Plus de code à maintenir
❌ **Infrastructure**: Besoin de gérer serveurs et base de données
❌ **Coûts**: Possiblement plus élevés (serveur + DB + CDN)

## Recommandations

### Quand Migrer
- Vous avez besoin de logique métier complexe
- Vous voulez le contrôle total
- Vous avez les ressources pour maintenir
- Vous prévoyez une forte croissance

### Quand Rester sur Supabase
- Application simple sans logique complexe
- Équipe réduite
- Budget limité
- Besoin de développer rapidement

## Support

Pour toute question sur l'implémentation:
1. Consultez la documentation NestJS: https://docs.nestjs.com
2. Documentation MongoDB: https://docs.mongodb.com
3. Documentation Mongoose: https://mongoosejs.com

## Prochaines Étapes

1. Lire l'[Architecture Overview](./01-architecture-overview.md)
2. Suivre le [Setup Guide](./02-setup-guide.md)
3. Implémenter [Authentication](./03-authentication.md)
4. Développer le [Module Rides](./04-rides-implementation.md)
5. Créer les autres modules nécessaires
6. Planifier la migration des données
7. Adapter le frontend React Native
8. Tester et déployer

Bonne chance avec votre migration ! 🚀
