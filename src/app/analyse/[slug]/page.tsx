import { TeamLogo } from '@/components/TeamLogo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AnalysisUnlock } from '@/components/AnalysisUnlock';
import { MOCK_ANALYSIS, MOCK_UPCOMING_MATCHES } from '@/lib/mock-data';
import type { Match } from '@/types';

function buildAnalysisForMatch(match: Match) {
  // Pour l'instant, toutes les analyses réutilisent les mêmes graphiques/facteurs
  // de démonstration (MOCK_ANALYSIS), seules les infos d'en-tête changent.
  // À remplacer par un vrai calcul une fois le modèle d'analyse construit.
  return { ...MOCK_ANALYSIS, match };
}

function FormDots({ form }: { form: Match['homeTeam']['form'] }) {
  return (
    <div className="flex gap-1.5">
      {form.results.map((r, i) => (
        <span
          key={i}
          className={
            r === 'w'
              ? 'flex h-7 w-7 items-center justify-center rounded-lg bg-green/15 text-[11px] font-bold text-green'
              : 'flex h-7 w-7 items-center justify-center rounded-lg border border-red/25 bg-red/10 text-[11px] font-bold text-red'
          }
        >
          {r === 'w' ? 'V' : 'D'}
        </span>
      ))}
    </div>
  );
}

export default async function AnalysePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const match = MOCK_UPCOMING_MATCHES.find((m) => m.id === slug);

  if (!match) {
    notFound();
  }

  const analysis = buildAnalysisForMatch(match);

  // Score prédit par équipe, dérivé du total + écart déjà calculés
  // (pas encore de vrai score prédit par équipe — à remplacer avec le vrai modèle).
  const predictedHome = Math.round((analysis.totalPointsPredicted + analysis.spreadPredicted) / 2);
  const predictedAway = analysis.totalPointsPredicted - predictedHome;

  return (
    <main className="relative flex-1 pt-16">
      <div className="px-6 pt-6 text-xs text-bone-dim md:px-12">
        <Link href="/matchs" className="hover:text-orange">
          Matchs
        </Link>{' '}
        / {match.homeTeam.name} vs {match.awayTeam.name}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-10 border-b border-surface-line px-6 py-8 md:px-12">
        <div className="flex flex-col items-center gap-2 text-center">
          <TeamLogo team={match.homeTeam} size={132} shape="circle" />
          <span className="text-xl font-bold tracking-tight">{match.homeTeam.name}</span>
          <span className="font-display text-xs text-bone-dim">{match.homeTeam.record}</span>
          <FormDots form={match.homeTeam.form} />
        </div>

        <div className="flex flex-col items-center gap-2">
          {match.status === 'finished' && match.finalScore ? (
            <>
              <span className="font-display text-[44px] font-bold leading-none tracking-tight text-orange">
                {match.finalScore.home} - {match.finalScore.away}
              </span>
              <span className="font-display text-[11px] tracking-widest text-bone-dim">FINAL</span>
            </>
          ) : (
            <>
              <span className="font-display text-[44px] font-bold leading-none tracking-tight text-orange">
                {predictedHome} - {predictedAway}
              </span>
              <span className="font-display text-[11px] tracking-widest text-bone-dim">
                Score prédit · Confiance {match.confidence}%
              </span>
              <span className="font-display text-[10px] uppercase tracking-wide text-bone-dim">
                {new Date(match.startTime).toLocaleString('fr-FR', {
                  weekday: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <TeamLogo team={match.awayTeam} size={132} shape="circle" />
          <span className="text-xl font-bold tracking-tight">{match.awayTeam.name}</span>
          <span className="font-display text-xs text-bone-dim">{match.awayTeam.record}</span>
          <FormDots form={match.awayTeam.form} />
        </div>
      </div>

      <div className="grid grid-cols-2 border-b border-surface-line md:grid-cols-4">
        <QuickStat value={analysis.totalPointsPredicted} label="Total pts prédit" />
        <QuickStat value={`+${analysis.spreadPredicted}`} label="Écart prédit" />
        <QuickStat value={`${match.confidence}%`} label="Indice IA" />
        <QuickStat value={analysis.variablesUsed} label="Variables" />
      </div>

      <div className="relative mt-8">
        <AnalysisUnlock analysis={analysis} />
      </div>

      <p className="px-6 pb-10 text-[11px] text-bone-dim/60 md:px-12">
        Analyse à titre informatif. HOOPIUM ne fournit aucun conseil en matière de jeux d&apos;argent.
      </p>
    </main>
  );
}

function QuickStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="border-r border-surface-line px-4 py-6 text-center last:border-none">
      <div className="font-display text-2xl font-bold text-orange">{value}</div>
      <div className="mt-1.5 text-[10px] uppercase tracking-wider text-bone-dim">{label}</div>
    </div>
  );
}
