'use client';

import { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { TeamLogo } from './TeamLogo';
import { KeyPlayersSection } from './KeyPlayersSection';
import { BettingMarketsSection } from './BettingMarketsSection';
import { HeadToHeadSection } from './HeadToHeadSection';
import { ContextSection } from './ContextSection';
import type { Match, MatchAnalysis } from '@/types';

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

type Phase = 'locked' | 'processing' | 'revealing' | 'celebrating' | 'done';

const PROCESSING_MS = 900;
const SCROLL_DOWN_MS = 900;
const SCROLL_UP_MS = 500;
const COUNT_MS = SCROLL_DOWN_MS + SCROLL_UP_MS;
const CONFETTI_MS = 1000;

const CONFETTI_COLORS = ['var(--orange)', 'var(--green)', 'var(--bone)', 'var(--red)'];

function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}
function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Anime le scroll de la fenêtre vers `targetY`, sur `duration` ms. */
function animateScrollTo(targetY: number, duration: number) {
  return new Promise<void>((resolve) => {
    const startY = window.scrollY;
    const delta = targetY - startY;
    const start = performance.now();
    function step(now: number) {
      const progress = Math.min(1, (now - start) / duration);
      window.scrollTo(0, startY + delta * easeInOutQuad(progress));
      if (progress < 1) requestAnimationFrame(step);
      else resolve();
    }
    requestAnimationFrame(step);
  });
}

function SideConfetti({ side }: { side: 'left' | 'right' }) {
  const [pieces] = useState(() =>
    Array.from({ length: 14 }, (_, i) => ({
      id: i,
      top: Math.random() * 70,
      delay: Math.random() * 200,
      duration: 700 + Math.random() * 500,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      travelX: side === 'left' ? 40 + Math.random() * 120 : -(40 + Math.random() * 120),
      rotated: Math.random() > 0.5,
    }))
  );

  return (
    <div
      className={`pointer-events-none absolute inset-y-0 ${side === 'left' ? 'left-0' : 'right-0'} w-1/3 overflow-hidden`}
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className={p.rotated ? 'absolute h-1.5 w-3 rounded-sm' : 'absolute h-3 w-1.5 rounded-sm'}
          style={{
            [side]: '0%',
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

export function AnalysisExperience({ match, analysis }: { match: Match; analysis: MatchAnalysis }) {
  const [phase, setPhase] = useState<Phase>('locked');
  const [displayHome, setDisplayHome] = useState(0);
  const [displayAway, setDisplayAway] = useState(0);

  // Score prédit par équipe, dérivé du total + écart (les seules données
  // qu'on a aujourd'hui — pas encore de vrai score prédit par équipe).
  const total = analysis.totalPointsPredicted;
  const spread = analysis.spreadPredicted;
  const predictedHome = Math.round((total + spread) / 2);
  const predictedAway = total - predictedHome;

  async function handleUnlock() {
    setPhase('processing');
    await sleep(PROCESSING_MS);
    setPhase('revealing');

    const originalY = window.scrollY;

    // Le score compte de 0 jusqu'à la prédiction pendant TOUTE la descente + remontée.
    const countStart = performance.now();
    let frame: number;
    function tick(now: number) {
      const progress = Math.min(1, (now - countStart) / COUNT_MS);
      const eased = easeOutCubic(progress);
      setDisplayHome(Math.round(eased * predictedHome));
      setDisplayAway(Math.round(eased * predictedAway));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    const bottom = document.documentElement.scrollHeight - window.innerHeight;
    await animateScrollTo(bottom, SCROLL_DOWN_MS);
    await animateScrollTo(originalY, SCROLL_UP_MS);

    cancelAnimationFrame(frame);
    setDisplayHome(predictedHome);
    setDisplayAway(predictedAway);

    setPhase('celebrating');
    await sleep(CONFETTI_MS);
    setPhase('done');
  }

  const unlocked = phase === 'revealing' || phase === 'celebrating' || phase === 'done';
  const counting = phase === 'revealing' || phase === 'celebrating';

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
      <div className="relative flex flex-wrap items-center justify-center gap-10 overflow-hidden border-b border-surface-line px-6 py-8 md:px-12">
        {phase === 'celebrating' && (
          <>
            <SideConfetti side="left" />
            <SideConfetti side="right" />
          </>
        )}

        <div className="flex flex-col items-center gap-2 text-center">
          <TeamLogo team={match.homeTeam} size={96} shape="circle" />
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
          ) : counting || phase === 'done' ? (
            <>
              <span className="font-display text-[44px] font-bold leading-none tracking-tight text-orange">
                {displayHome} - {displayAway}
              </span>
              <span className="font-display text-[11px] tracking-widest text-bone-dim">
                {phase === 'done' ? `Score prédit · ${match.confidence}%` : 'Calcul en cours'}
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
          <TeamLogo team={match.awayTeam} size={96} shape="circle" />
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

      <div className="relative mx-6 mb-10 mt-8 rounded-2xl border border-surface-line md:mx-12">
        {(phase === 'locked' || phase === 'processing') && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="mx-4 max-w-sm rounded-2xl border border-white/10 bg-night/95 p-7 text-center">
              <p className="mb-2 text-[15px] font-bold">
                Tu n&apos;as accès qu&apos;à <strong className="text-orange">15%</strong> de
                l&apos;analyse
              </p>
              <p className="mb-5 text-xs text-bone-dim">
                Statistiques, graphiques, probabilités et gagnant prédit
              </p>
              <button
                onClick={handleUnlock}
                disabled={phase === 'processing'}
                className="rounded-full bg-bone px-11 py-3 text-base font-bold text-night transition hover:bg-orange disabled:opacity-70"
              >
                {phase === 'processing' ? 'Analyse en cours...' : 'Débloquer'}
              </button>
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
