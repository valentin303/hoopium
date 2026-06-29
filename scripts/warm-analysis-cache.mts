/**
 * Préchauffe le cache disque pour un ou plusieurs matchs du mock, en
 * appelant exactement le même chemin de code que la page Analyse
 * (buildRealMatchAnalysis). Une fois ce script terminé, visiter la page
 * correspondante est instantané (tout vient du cache).
 *
 * Pourquoi un script séparé plutôt que de laisser la page le faire : la
 * vraie limite du plan gratuit est 10 requêtes/minute (chiffre publié par
 * le fournisseur, pas une estimation) — avec ~21 appels nécessaires par
 * match, un premier chargement à froid prend 2-3 minutes. Trop long pour
 * la requête d'une page web ; un script qu'on lance et qu'on laisse tourner
 * est plus adapté.
 *
 * Usage :
 *   npx tsx --env-file=.env.local scripts/warm-analysis-cache.mts
 *   npx tsx --env-file=.env.local scripts/warm-analysis-cache.mts lal-bos-2026-06-17
 *
 * Sans argument : préchauffe les 8 matchs du mock (compter ~15-20 minutes,
 * peut tourner en arrière-plan). Avec un ou plusieurs ids de match en
 * argument : ne préchauffe que ceux-là (~2-3 min chacun).
 */

import { MOCK_UPCOMING_MATCHES } from '../src/lib/mock-data';
import { buildRealMatchAnalysis } from '../src/lib/real-analysis';

async function main() {
  const requestedIds = process.argv.slice(2);
  const matches =
    requestedIds.length > 0
      ? MOCK_UPCOMING_MATCHES.filter((m) => requestedIds.includes(m.id))
      : MOCK_UPCOMING_MATCHES;

  if (requestedIds.length > 0 && matches.length !== requestedIds.length) {
    const found = matches.map((m) => m.id);
    const missing = requestedIds.filter((id) => !found.includes(id));
    console.warn(`⚠ Id(s) introuvable(s) dans le mock, ignoré(s) : ${missing.join(', ')}`);
  }

  console.log(`Préchauffage de ${matches.length} match(s) — ~2-3 min chacun, ça peut tourner un moment.\n`);

  for (const match of matches) {
    const label = `${match.homeTeam.name} vs ${match.awayTeam.name}`;
    console.log(`→ ${label}...`);
    const start = Date.now();
    try {
      await buildRealMatchAnalysis(match);
      const seconds = Math.round((Date.now() - start) / 1000);
      console.log(`  ✓ ${label} préchauffé (${seconds}s)\n`);
    } catch (err) {
      console.error(`  ✗ ${label} a échoué :`, err, '\n');
    }
  }

  console.log('Terminé.');
}

main();
