import { NextResponse } from 'next/server';
import { fetchApiStatus } from '@/lib/nba-provider';

/**
 * GET /api/nba/test
 *
 * Route de diagnostic uniquement — vérifie que NBA_API_KEY est valide en
 * appelant l'endpoint /status, qui ne consomme aucun quota journalier.
 * À supprimer (ou protéger) avant la mise en production.
 */
export async function GET() {
  try {
    const status = await fetchApiStatus();
    return NextResponse.json({ ok: true, status });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
