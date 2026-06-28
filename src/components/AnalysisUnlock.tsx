'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { TeamLogo } from './TeamLogo';
import type { Match, MatchAnalysis } from '@/types';
import { KeyPlayersSection } from './KeyPlayersSection';
import { BettingMarketsSection } from './BettingMarketsSection';
import { HeadToHeadSection } from './HeadToHeadSection';
import { ContextSection } from './ContextSection';

const STRENGTH_STYLES = {
  strong: 'bg-green/10 text-green',
  variable: 'bg-orange-glow text-orange',
  uncertain: 'bg-red/10 text-red',
} as const;

const STRENGTH_LABELS = {
  strong: 'Fort',
  variable: 'Variable',
  uncertain: 'Incertain',
} as const;

const PROCESSING_MS = 1100;
const CELEBRATION_MS = 1700;

type Phase = 'locked' | 'processing' | 'celebrating' | 'done';

const CONFETTI_COLORS = ['var(--orange)', 'var(--green)', 'var(--bone)', 'var(--red)'];

function ConfettiCurtain() {
  const [pieces] = useState(() =>
    Array.from({ length: 28 }, (_, i) => {
      const side: 'left' | 'right' = i % 2 === 0 ? 'left' : 'right';
      const travelX = side === 'left' ? 60 + Math.random() * 220 : -(60 + Math.random() * 220);
      return {
        id: i,
        side,
        top: Math.random() * 35,
        delay: Math.random() * 250,
        duration: 900 + Math.random() * 700,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        travelX,
        rotated: Math.random() > 0.5,
      };
    })
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className={p.rotated ? 'absolute h-1.5 w-3 rounded-sm' : 'absolute h-3 w-1.5 rounded-sm'}
          style={{
            left: p.side === 'left' ? '-2%' : '102%',
            top: `${p.top}%`,
            backgroundColor: p.color,
            animation: `hoopium-confetti-fall ${p.duration}ms ease-in ${p.delay}ms forwards`,
            ['--confetti-x' as string]: `${p.travelX}px`,
          }}
        />
      ))}
    </div>
  );
}

function BouncingCrown() {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 -ml-7 -mt-7"
      style={{ animation: `hoopium-crown-bounce ${CELEBRATION_MS}ms ease-in-out forwards` }}
    >
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" strokeWidth={1.5}>
        <path
          d="M3 18h18l-1.5-9-4 3-2.5-5-2.5 5-4-3L3 18z"
          fill="var(--orange-glow)"
        />
      </svg>
    </div>
  );
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

export function AnalysisUnlock({ analysis }: { analysis: MatchAnalysis }) {
  const [phase, setPhase] = useState<Phase>('locked');
  const [displayHome, setDisplayHome] = useState(0);
  const [displayAway, setDisplayAway] = useState(0);

  const { match } = analysis;
  const unlocking = phase === 'processing';
  const celebrating = phase === 'celebrating';
  const unlocked = phase === 'done';

  // Score prédit par équipe, dérivé du total + écart — c'est précisément ce
  // qu'on verrouille, donc ces deux chiffres ne doivent jamais apparaître
  // ailleurs en clair avant le déblocage (cf. grille de stats plus bas).
  const predictedHome = Math.round((analysis.totalPointsPredicted + analysis.spreadPredicted) / 2);
  const predictedAway = analysis.totalPointsPredicted - predictedHome;

  function handleUnlock() {
    setPhase('processing');
    // Le vrai déblocage (vérification d'abonnement ou paiement Stripe) sera
    // branché ici. Pour l'instant, on simule le temps de traitement.
    setTimeout(() => setPhase('celebrating'), PROCESSING_MS);
  }

  useEffect(() => {
    if (phase !== 'celebrating') return;

    // Le score (pas la confiance, déjà publique) compte de 0 jusqu'à la
    // prédiction réelle pendant la célébration — c'est la valeur qu'on débloque.
    const start = performance.now();
    let frame: number;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / (CELEBRATION_MS * 0.7));
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayHome(Math.round(eased * predictedHome));
      setDisplayAway(Math.round(eased * predictedAway));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    const doneTimer = setTimeout(() => setPhase('done'), CELEBRATION_MS);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(doneTimer);
    };
  }, [phase, predictedHome, predictedAway]);

  const trendData = analysis.scoringTrend.labels.map((label, i) => ({
    label,
    [match.homeTeam.name]: analysis.scoringTrend.homeValues[i],
    [match.awayTeam.name]: analysis.scoringTrend.awayValues[i],
  }));

  const radarData = analysis.radarProfile.labels.map((label, i) => ({
    label,
    [match.homeTeam.name]: analysis.radarProfile.homeValues[i],
    [match.awayTeam.name]: analysis.radarProfile.awayValues[i],
  }));

  const statsData = analysis.statsComparison.map((row) => ({
    label: row.label,
    [match.homeTeam.name]: typeof row.homeValue === 'string' ? parseFloat(row.homeValue) : row.homeValue,
    [match.awayTeam.name]: typeof row.awayValue === 'string' ? parseFloat(row.awayValue) : row.awayValue,
  }));

  return (
    <>
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
          ) : unlocked ? (
            <>
              <span className="font-display text-[44px] font-bold leading-none tracking-tight text-orange">
                {predictedHome} - {predictedAway}
              </span>
              <span className="font-display text-[11px] tracking-widest text-bone-dim">
                Score prédit · Confiance {match.confidence}%
              </span>
            </>
          ) : (
            <>
              <span className="font-display text-[11px] tracking-widest text-bone-dim">VS</span>
              <span className="rounded-full bg-orange-glow px-3 py-1.5 font-display text-xs text-orange">
                Confiance {match.confidence}%
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
        <QuickStat value={unlocked ? analysis.totalPointsPredicted : '🔒'} label="Total pts prédit" />
        <QuickStat value={unlocked ? `+${analysis.spreadPredicted}` : '🔒'} label="Écart prédit" />
        <QuickStat value={`${match.confidence}%`} label="Indice IA" />
        <QuickStat value={analysis.variablesUsed} label="Variables" />
      </div>

      <div className="relative mx-6 mb-10 mt-8 rounded-2xl border border-surface-line md:mx-12">
        {(phase === 'locked' || phase === 'processing') && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="mx-4 max-w-sm rounded-2xl border border-white/10 bg-night/95 p-7 text-center">
              <p className="mb-2 text-[15px] font-bold">
                Tu n&apos;as accès qu&apos;à <strong className="text-orange">15%</strong> de
                l&apos;analyse
              </p>
              <p className="mb-5 text-xs text-bone-dim">
                Score prédit, statistiques, graphiques et gagnant prédit
              </p>
              <button
                onClick={handleUnlock}
                disabled={unlocking}
                className="rounded-full bg-bone px-11 py-3 text-base font-bold text-night transition hover:bg-orange disabled:opacity-70"
              >
                {unlocking ? 'Analyse en cours...' : 'Débloquer'}
              </button>
            </div>
          </div>
        )}

        {celebrating && (
          <div className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden rounded-2xl bg-night/90">
            <ConfettiCurtain />
            <BouncingCrown />
            <div className="text-center">
              <span className="font-display text-[56px] font-bold leading-none tracking-tight text-orange">
                {displayHome} - {displayAway}
              </span>
              <p className="mt-2 font-display text-xs uppercase tracking-widest text-bone-dim">
                Score prédit débloqué
              </p>
            </div>
          </div>
        )}

        <div
          className={`relative overflow-hidden transition-[filter] duration-700 ${
            unlocked ? '' : 'pointer-events-none max-h-[900px] blur-[2.5px] brightness-[0.8]'
          }`}
        >
          <div className="flex flex-col gap-10 px-6 py-8 md:px-10">
            <section>
              <h3 className="mb-4 font-display text-xs uppercase tracking-wider text-orange">
                — Comparaison statistique
              </h3>
              <div className="rounded-xl border border-surface-line bg-night-soft/80 p-4">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={statsData}>
                    <CartesianGrid stroke="#232323" />
                    <XAxis dataKey="label" tick={{ fill: '#6b6b68', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6b6b68', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#161616', border: '1px solid #232323' }} />
                    <Legend verticalAlign="top" align="left" wrapperStyle={{ fontSize: 12, paddingBottom: 8 }} />
                    <Bar dataKey={match.homeTeam.name} fill="#FF6B1A" radius={[4, 4, 0, 0]} />
                    <Bar dataKey={match.awayTeam.name} fill="#ffffff1f" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <KeyPlayersSection players={analysis.keyPlayers} match={match} />

            <BettingMarketsSection markets={analysis.bettingMarkets} />

            <section>
              <h3 className="mb-4 font-display text-xs uppercase tracking-wider text-orange">
                — Tendance offensive & Profil
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-surface-line bg-night-soft/80 p-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trendData}>
                      <CartesianGrid stroke="#232323" />
                      <XAxis dataKey="label" tick={{ fill: '#6b6b68', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#6b6b68', fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: '#161616', border: '1px solid #232323' }} />
                      <Line type="monotone" dataKey={match.homeTeam.name} stroke="#FF6B1A" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey={match.awayTeam.name} stroke="#6b6b68" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="rounded-xl border border-surface-line bg-night-soft/80 p-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#232323" />
                      <PolarAngleAxis dataKey="label" tick={{ fill: '#6b6b68', fontSize: 10 }} />
                      <Radar dataKey={match.homeTeam.name} stroke="#FF6B1A" fill="#FF6B1A" fillOpacity={0.15} />
                      <Radar dataKey={match.awayTeam.name} stroke="#6b6b68" fill="#6b6b68" fillOpacity={0.08} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <HeadToHeadSection games={analysis.headToHeadDetailed} match={match} />

            <ContextSection factors={analysis.contextFactors} />

            <section>
              <h3 className="mb-4 font-display text-xs uppercase tracking-wider text-orange">
                — Facteurs déterminants
              </h3>
              <div className="flex flex-col">
                {analysis.factors.map((factor, i) => (
                  <div key={i} className="flex gap-4 border-b border-surface-line py-4 last:border-none">
                    <span
                      className={`flex-shrink-0 rounded-full px-2.5 py-1 font-display text-[10px] font-semibold uppercase tracking-wide ${STRENGTH_STYLES[factor.strength]}`}
                    >
                      {STRENGTH_LABELS[factor.strength]}
                    </span>
                    <p className="text-[14px] leading-relaxed text-bone">{factor.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-4 font-display text-xs uppercase tracking-wider text-orange">
                — Probabilités de victoire
              </h3>
              <div className="flex flex-col gap-3">
                <ProbRow label={`Victoire ${match.homeTeam.name}`} pct={analysis.winProbabilities.homeWinPct} color="bg-orange" />
                <ProbRow label="Match serré" pct={analysis.winProbabilities.closeGamePct} color="bg-bone-dim" />
                <ProbRow label={`Victoire ${match.awayTeam.name}`} pct={analysis.winProbabilities.awayWinPct} color="bg-red/60" />
              </div>
            </section>

            <section className="rounded-2xl border-l-[3px] border-orange bg-surface px-7 py-6">
              <p className="mb-3 font-display text-[11px] uppercase tracking-widest text-orange">
                Verdict HOOPIUM
              </p>
              <p className="text-[15px] leading-relaxed">{analysis.verdict}</p>
            </section>

            <section className="rounded-2xl border border-orange-dim bg-gradient-to-br from-orange-glow to-transparent px-8 py-7 text-center">
              <p className="mb-2 font-display text-[10px] uppercase tracking-widest text-orange">
                Gagnant prédit
              </p>
              <p className="mb-1 text-[34px] font-bold tracking-tight">
                {analysis.winProbabilities.homeWinPct > analysis.winProbabilities.awayWinPct
                  ? match.homeTeam.name
                  : match.awayTeam.name}
              </p>
              <p className="font-display text-xs text-bone-dim">Confiance · {match.confidence}%</p>
            </section>
          </div>
        </div>
      </div>
    </>
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

function ProbRow({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-40 flex-shrink-0 text-xs text-bone-dim">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded bg-surface-line">
        <div className={`h-full rounded ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-9 text-right text-[13px] font-semibold">{pct}%</span>
    </div>
  );
}
