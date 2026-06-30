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

  const matchDateLabel = new Date(match.startTime).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <main className="relative flex-1 pt-16">
      <div className="mx-auto max-w-[480px] border-x border-surface-line/60 bg-night sm:my-4 sm:rounded-3xl sm:border sm:shadow-2xl sm:shadow-black/40">
        <div className="flex items-center justify-between border-b border-surface-line px-4 py-4">
          <p className="text-[11px] text-bone-dim">
            <Link href="/matchs" className="hover:text-orange">
              Matchs
            </Link>{' '}
            / {match.homeTeam.name} vs {match.awayTeam.name}
          </p>
          <span className="font-display text-[10px] uppercase tracking-wide text-bone-dim">
            {matchDateLabel}
          </span>
        </div>

        <AnalysisUnlock analysis={analysis} />

        <p className="px-4 pb-8 text-[11px] text-bone-dim/60">
          Analyse à titre informatif. HOOPIUM ne fournit aucun conseil en matière de jeux d&apos;argent.
        </p>
      </div>
    </main>
  );
}
