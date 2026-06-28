import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AnalysisUnlock } from '@/components/AnalysisUnlock';
import { MOCK_ANALYSIS, MOCK_UPCOMING_MATCHES } from '@/lib/mock-data';
import { buildRealMatchAnalysis } from '@/lib/real-analysis';
import type { Match } from '@/types';

async function buildAnalysisForMatch(match: Match) {
  try {
    return await buildRealMatchAnalysis(match);
  } catch (err) {
    // Repli sur le mock si la récupération réelle échoue (réseau, id manquant...)
    // — jamais d'écran cassé, mais on logue pour ne pas rater le problème.
    console.warn('[analyse] Repli sur le mock pour', match.id, ':', err);
    return { ...MOCK_ANALYSIS, match };
  }
}

export default async function AnalysePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const match = MOCK_UPCOMING_MATCHES.find((m) => m.id === slug);

  if (!match) {
    notFound();
  }

  const analysis = await buildAnalysisForMatch(match);

  return (
    <main className="relative flex-1 pt-16">
      <div className="px-6 pt-6 text-xs text-bone-dim md:px-12">
        <Link href="/matchs" className="hover:text-orange">
          Matchs
        </Link>{' '}
        / {match.homeTeam.name} vs {match.awayTeam.name}
      </div>

      <AnalysisUnlock analysis={analysis} />

      <p className="px-6 pb-10 text-[11px] text-bone-dim/60 md:px-12">
        Analyse à titre informatif. HOOPIUM ne fournit aucun conseil en matière de jeux d&apos;argent.
      </p>
    </main>
  );
}
