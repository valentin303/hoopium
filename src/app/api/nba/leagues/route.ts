import { NextResponse } from 'next/server';

/**
 * GET /api/nba/leagues
 *
 * Route de diagnostic — liste toutes les ligues disponibles chez le
 * fournisseur avec leur ID exact, pour vérifier que les IDs codés en dur
 * dans nba-provider.ts (LEAGUE_CONFIG) sont corrects. Coûte 1 requête API.
 * À supprimer une fois les IDs confirmés.
 */
export async function GET() {
  const apiKey = process.env.NBA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'NBA_API_KEY manquante' }, { status: 500 });
  }

  const res = await fetch('https://v1.basketball.api-sports.io/leagues', {
    headers: { 'x-apisports-key': apiKey },
  });
  const data = await res.json();

  // On ne garde que les ligues qui nous intéressent pour alléger la réponse
  const relevant = (data.response ?? []).filter((l: { name: string }) =>
    ['NBA', 'WNBA', 'Euroleague', 'NCAA'].some((name) =>
      l.name.toLowerCase().includes(name.toLowerCase())
    )
  );

  return NextResponse.json({ relevant, totalCount: data.response?.length ?? 0 });
}
