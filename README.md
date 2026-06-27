# HOOPIUM — Next.js

## Démarrage rapide

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Ouvre http://localhost:3000

Tant que `NBA_API_KEY` n'est pas renseignée dans `.env.local`, le site
fonctionne avec des données de démonstration (`src/lib/mock-data.ts`) —
les mêmes matchs que sur le prototype HTML, pour garder une continuité
visuelle pendant qu'on construit le reste.

## Obtenir une clé API NBA (gratuite)

1. Crée un compte sur https://api-sports.io
2. Va sur ton dashboard, section "NBA"
3. Copie la clé API et colle-la dans `.env.local` :
   ```
   NBA_API_KEY=ta_clé_ici
   ```
4. Palier gratuit : 100 requêtes/jour — largement suffisant en phase de
   test. Upgrade à 15$/mois (palier Pro, aucune fonctionnalité verrouillée)
   le jour où le site a des vrais visiteurs.

## Structure du projet

```
src/
  app/
    page.tsx              → page d'accueil
    matchs/                → page calendrier (à construire)
    historique/            → page bilan/historique (à construire)
    analyse/[slug]/        → page détail d'un match (à construire)
    tarifs/                → page abonnement (à construire)
    a-propos/              → page à propos (à construire)
    api/nba/matches/       → route API qui sert les matchs (mise en cache 15 min)
  components/
    SiteNav.tsx            → menu hamburger + drawer
    VerifiedMatchCard.tsx  → carte "preuve sociale" du hero
  lib/
    nba-provider.ts        → toute la logique d'appel à l'API NBA (isolée
                             ici pour pouvoir changer de fournisseur facilement)
    mock-data.ts           → données de démonstration
  types/
    index.ts               → tous les types partagés (Match, Team, MatchAnalysis...)
```

## Ce qui reste à faire (prochaines étapes)

- [ ] Construire les pages Matchs, Historique, Analyse, Tarifs, À propos
      (le contenu existe déjà dans le prototype HTML — il s'agit de le
      porter en composants React)
- [ ] Brancher une vraie clé NBA_API_KEY et tester les appels réels
- [ ] Transformer les réponses brutes d'API-NBA (RawGame) vers nos types
      internes (Match) dans nba-provider.ts
- [ ] Construire le vrai modèle d'analyse (pour l'instant, les facteurs/
      probabilités/verdict sont encore des données de démonstration —
      voir mock-data.ts → MOCK_ANALYSIS)
- [ ] Intégrer Stripe pour les paiements (0,99€ à l'unité / 9,99€ abonnement)
- [ ] Ajouter une vraie authentification (pour les abonnés)
- [ ] Mettre en place le cron de rafraîchissement automatique des analyses
      toutes les 15 minutes (actuellement, le cache HTTP s-maxage=900
      suffit en phase de test, mais un vrai cron + base de données sera
      nécessaire à l'échelle)

## Notes sur les polices

Les polices Google (Space Grotesk, Oswald) sont importées en CSS classique
dans `globals.css` plutôt qu'avec `next/font/google`, car l'environnement
de développement utilisé pour générer ce projet n'avait pas d'accès réseau
à `fonts.googleapis.com`. Une fois en local avec un accès internet normal,
tu peux repasser sur `next/font/google` pour de meilleures performances
(polices auto-hébergées, pas de requête externe au runtime) — voir le
commentaire dans `src/app/layout.tsx` pour le code exact à utiliser.
