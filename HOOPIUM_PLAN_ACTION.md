# HOOPIUM — Plan d'action et vision

*Document de référence — à mettre à jour au fil de l'avancement. Rédigé le 28 juin 2026.*

---

## Où on en est réellement (état des lieux honnête)

**Fait :**
- Prototype HTML complet (preuve de concept UX) puis migration propre vers Next.js 16 / TypeScript / Tailwind v4
- Connexion à API-Basketball (NBA, WNBA, EuroLeague, NCAA) avec cache HTTP et système anti-données-inventées (live/demo/error toujours distingués)
- Registre de 736 équipes (logos + noms) pour les 4 ligues, robuste aux échecs partiels
- Page Analyse : design, déblocage payant (UI), graphiques avec couleurs d'équipe réelles, textes personnalisés par équipe
- Identité de marque posée (couleurs, typo, ton honnête vs concurrence)

**Pas fait — et c'est le plus important :**
- **Étape 1 du modèle (calcul statistique) : faite et fonctionnelle** (29 juin). `src/lib/stats-engine.ts` calcule confiance, score prédit, écart, probabilités, profil radar à partir de vraies données API-Basketball (saison de test 2023-2024, le plan gratuit ne donnant pas accès à la saison en cours). 23 tests automatisés (`npm test`), validés contre un vrai match (Minnesota-Dallas, 05/10/2023). Branché en direct sur la page Analyse (`src/lib/real-analysis.ts`), avec repli silencieux sur le mock si la récupération échoue.
- **Étape 2 du modèle (narration IA) : pas commencée.** Le verdict et les facteurs affichés aujourd'hui sont des phrases factuelles simples générées par template (pas par IA) — fonctionnels mais pas le rendu naturel visé.
- `keyPlayers` reste mock — pas d'endpoint blessures disponible dans l'API (vérifié). `contextFactors` et `bettingMarkets` sont réels depuis le 29/30 juin (repos, classement, série, fuseau horaire ; total/écart dérivés du score prédit, mi-temps calculée à partir des vrais quart-temps déjà récupérés — jamais de cotes externes, contraire au positionnement du produit).
- Aucun paiement réel (Stripe), aucune authentification utilisateur
- Aucun test sur mobile
- Aucune marque déposée (décision : repoussé tant qu'il n'y a pas de traction)
- **Confirmé** : `/games` (les vrais matchs) a la même restriction de saison que `/teams` sur le plan gratuit (2022-2024 seulement, jamais la saison en cours). **Solution identifiée** : le plan Pro (15€/mois, 7 500 req/jour) lève cette restriction — abonnement prévu en septembre/octobre, juste avant le besoin réel, pour ne pas payer pour rien pendant l'intersaison.
- **Corrigé** (30 juin) : `nba-provider.ts` utilise désormais une vraie table d'abréviations officielles NBA (LAL au lieu de LOS), vérifiée via ESPN — plus une formule devinée.

---

## Modèle d'analyse — spec verrouillée (28 juin 2026)

Décisions prises, prêtes à construire (demain ou dès maintenant) :

**Pipeline en deux étapes, jamais fusionnées :**
1. **Calcul statistique** — le vrai "modèle". Produit les chiffres réels (confiance %, score prédit, facteurs, probabilités) à partir des données API-Basketball. C'est la seule étape qui a le droit de décider *quoi* dire.
2. **Narration IA** (Claude) — une couche de rédaction, pas un modèle de prédiction. Reçoit les chiffres calculés à l'étape 1 comme contexte figé et les met en language naturel (verdict, facteurs en phrases) **sans jamais les modifier**. Objectif explicite du produit : graphiques + chiffres clés + analyse racontée en langage naturel, pour simplifier la lecture côté client.

Pourquoi cet ordre est non négociable : si l'IA générait les chiffres et le texte en même temps, rien ne garantirait que le texte dise "82%" pendant que le graphique affiche "76%" — exactement le type d'incohérence que le principe "jamais de données inventées" (déjà appliqué au mode démo/live) doit aussi couvrir ici.

**Points de rafraîchissement (gèrent les changements de dernière minute — blessures, compositions) :**
- À la création du match (apparition au calendrier)
- ~24h avant (stats à jour, blessures encore provisoires)
- ~2-3h avant le coup d'envoi (statuts officiels probable/questionable/out publiés par les équipes — le rafraîchissement le plus important)
- *(optionnel)* ~30 min avant, à l'annonce des 5 majeurs

Chaque rafraîchissement recalcule l'étape 1. L'étape 2 (l'appel IA, qui coûte) ne se redéclenche que si l'étape 1 a vraiment changé quelque chose de significatif — pas de regénération de texte si rien n'a bougé.

**Politique d'accès à l'achat — Option A retenue :** l'accès est lié au match, pas à un instantané figé. Un acheteur (unité ou abonnement) voit toujours la version la plus à jour de l'analyse, même après son achat — cohérent avec le positionnement honnêteté déjà posé (66% vérifiable). Pas de versionnage/archivage à gérer : juste un timestamp de dernière mise à jour sur l'analyse. Piste d'amélioration : notifier l'acheteur quand l'analyse change significativement après son achat ("Mise à jour : tel joueur forfait, confiance ajustée").

**Coûts associés (ordres de grandeur) :**
- Requêtes API-Basketball : ~8 matchs NBA/soir × 2-4 appels = 20-30 requêtes/jour pour toute la NBA — sans rapport avec le nombre de visiteurs (cache partagé), largement sous le quota même gratuit. Le volume n'est pas le facteur limitant ; seule la restriction de saison (voir plus haut) l'est.
- **Le cache des matchs terminés est permanent** (un match joué ne change plus jamais ses stats) — donc le coût ne dépend pas du nombre de rafraîchissements ni du nombre de matchs à analyser, mais uniquement du nombre de *nouveaux* matchs joués depuis le dernier passage. Sur 10 matchs suivis par équipe, 9 sont presque toujours déjà en cache ; un seul appel réseau réel par équipe et par soirée, même avec plusieurs rafraîchissements/jour. Confirmé viable à l'échelle d'une vraie soirée NBA complète (10-15 matchs) avec le plan Pro (300 req/min, 7500/jour).
- Appels IA : un par match (pas par visiteur), uniquement quand l'étape 1 change significativement — même logique d'économie que le cache HTTP actuel.

---

## Court terme — d'ici le lancement NBA (mi-octobre 2026, ~15 semaines)

L'objectif n'est pas "plus de fonctionnalités", c'est "un produit qui dit vrai sur ce qu'il vend". Tout le reste est secondaire si le modèle d'analyse n'existe pas.

1. **Étape 2 du modèle (narration IA)** — brancher Claude pour rédiger verdict/facteurs en langage naturel à partir des chiffres déjà calculés (étape 1 terminée). Ne jamais laisser l'IA recalculer les chiffres, seulement les mettre en mots.
   - Décider du périmètre de couverture réelle : NBA seule au lancement, ou les 4 ligues d'un coup ?
   - Brancher `keyPlayers` sur de vraies données (`contextFactors` et `bettingMarkets` faits depuis le 29-30 juin)
   - Republier le taux de réussite (66%) seulement une fois qu'il provient de vraies prédictions, pas du chiffre de démonstration actuel
2. **S'abonner au plan Pro API-Basketball (15€/mois)** avant le besoin réel (septembre/octobre) pour lever la restriction de saison sur `/games`, puis revérifier avec le même test qu'aujourd'hui. **Ne pas oublier** : mettre à jour `MIN_INTERVAL_MS` dans `src/lib/nba-provider.ts` (actuellement 6500ms, calé sur la limite gratuite de 10 req/min) vers ~200ms (limite Pro : 300 req/min) — sinon le site continue à se brider lui-même au rythme gratuit sans profiter du plan payé.
3. **Stripe** — paiement à l'unité (0,99€) et abonnement (9,99€)
4. **Authentification** — comptes abonnés
5. **Test mobile sérieux** — jamais fait à ce stade
6. **Finir la direction artistique** sur les pages encore non traitées (accueil, tarifs)
7. **Cron de rafraîchissement automatique** des analyses (au-delà du cache HTTP actuel)
8. **Bases légales** — mentions légales, CGU/CGV, vérifier que le disclaimer jeux d'argent est juridiquement suffisant
9. **Construire l'audience en parallèle** (le plan initial le prévoyait déjà — ne pas attendre le lancement pour commencer)
10. **Lancement progressif** — idéalement un test avec un petit nombre d'utilisateurs avant le grand public, pour repérer ce qui casse en conditions réelles

---

## Moyen terme — Année 1 (lancement → 12–18 mois)

Objectif : passer de "ça marche" à "ça tient debout économiquement".

- Atteindre les paliers déjà définis : 6 abonnés (rentable) → 140 (équivalent SMIC) → 250 (revenu permettant de quitter un emploi)
- Suivre et publier le taux de réussite réel match après match, sans l'arranger — c'est la différenciation face à Visifoot et son 92,2% peu crédible
- Étendre la couverture réelle (pas mock) à WNBA / EuroLeague / NCAA si la NBA seule fonctionne
- Industrialiser ce qui a été fait à la main pendant le développement (logos, couleurs d'équipe) au fur et à mesure que de nouvelles équipes apparaissent réellement dans des matchs, plutôt que tout précharger
- Réévaluer le fournisseur de données si les limites du plan gratuit (quota, saisons) deviennent un frein réel à la croissance
- Commencer à tester une présence de contenu (TikTok/X) en parallèle, même modestement — pas besoin d'attendre l'an 3 pour semer
- Décider du dépôt de marque une fois la traction réelle (le coût — ~310€ INPI — n'est plus le facteur limitant à ce stade)

---

## Long terme — ~3 ans

Vision déjà posée dans le projet, à concrétiser :

- Évolution vers un **média de contenu** : TikTok/X en priorité, podcast
- **Merchandising**
- Évaluation sérieuse d'un pivot multi-sport (préalable à toute ambition au-delà du marché actuel)
- Si la croissance organique plafonne et que l'ambition dépasse le lifestyle business : étudier une levée de fonds — mais seulement si les chiffres de l'an 1-2 le justifient, pas par anticipation

---

## Très très long terme — ~10 ans

L'ambition déclarée d'une **"HOOPIUM League"** reste aujourd'hui une étoile polaire, pas un plan — sa nature exacte (ligue fantasy, événement, propriété média, vraie compétition) reste à définir quand le reste aura mûri. Ce n'est pas un manque : à ce stade du projet, le définir trop tôt serait un pari sur du vent.

Deux trajectoires distinctes, honnêtes sur leurs chances respectives (déjà évaluées ensemble) :
- **Trajectoire lifestyle business** : rester en solo/petite équipe, rentabilité de niche durable. ~100k MRR atteignable en 4-5 ans avec bonne exécution — probabilité estimée 30-40%.
- **Trajectoire venture** : pivot B2B multi-sport + levée de fonds. ~1M MRR sur 8-10 ans — probabilité estimée 5-10%, et qui suppose d'avoir réussi la trajectoire précédente d'abord.

Le choix entre les deux ne se fait pas aujourd'hui — il se fera naturellement selon ce que l'année 1 révèle.

---

## Risques et points de vigilance (à ne pas perdre de vue)

- **Le plus gros risque n'est pas technique, c'est temporel** : construire un vrai modèle d'analyse statistique prend probablement plus de temps que tout le reste de la liste court terme combiné. Si mi-octobre approche sans modèle réel, mieux vaut repousser le lancement complet que publier des prédictions qui ne sont que de la mise en scène — ça contredirait directement le positionnement "taux de réussite honnête" qui fait toute la différenciation du produit.
- **Ne pas oublier l'abonnement Pro API-Basketball** avant octobre — la restriction de saison est confirmée et la solution (15€/mois) est connue, il reste juste à ne pas zapper l'action elle-même au bon moment (rappel à se poser, pas un risque technique).
- **Dépôt de marque repoussé** : risque de squat resté acceptable tant que HOOPIUM reste invisible — à reconsidérer dès la première mention publique un peu visible (lancement de contenu, presse).
- **Ne pas se mentir sur le marché** : les probabilités de succès (30-40% / 5-10%) citées plus haut viennent d'une discussion antérieure du projet — elles ne sont pas une prédiction garantie, juste un ordre de grandeur pour calibrer les efforts sans excès d'optimisme ni de pessimisme.
