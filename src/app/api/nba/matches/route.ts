import { NextResponse } from 'next/server';
import { fetchGamesByDateAllLeagues } from '@/lib/nba-provider';
import { MOCK_UPCOMING_MATCHES } from '@/lib/mock-data';

/**
 * GET /api/nba/matches
 *
 * Sert les matchs du jour, toutes ligues couvertes confondues (NBA, WNBA,
 * EuroLeague, NCAA) — combiner les ligues maximise les chances d'avoir du
 * contenu réel à afficher tout au long de l'année, la NBA étant en pause
 * l'été pendant que la WNBA tourne, etc.
 *
 * Coût : jusqu'à 4 requêtes API par appel (une par ligue), mises en cache
 * 15 minutes ensemble.
 *
 *  - source: 'live'  → au moins une ligue a renvoyé des matchs aujourd'hui
 *  - source: 'demo'  → aucune ligue n'a de match programmé — mode démo
 *  - source: 'error' → l'appel a échoué entièrement (clé invalide, etc.)
 */
export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const matches = await fetchGamesByDateAllLeagues(today);

    if (matches.length === 0) {
      return NextResponse.json(
        { matches: MOCK_UPCOMING_MATCHES, source: 'demo' as const },
        { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=60' } }
      );
    }

    return NextResponse.json(
      { matches, source: 'live' as const },
      { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=60' } }
    );
  } catch (error) {
    console.error('[api/nba/matches] Échec de l\'appel API-Basketball :', error);
    return NextResponse.json(
      { matches: [], source: 'error' as const },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
