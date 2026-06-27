'use client';

import { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { MatchAnalysis } from '@/types';
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

export function AnalysisUnlock({ analysis }: { analysis: MatchAnalysis }) {
  const [unlocked, setUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  const { match } = analysis;

  function handleUnlock() {
    setUnlocking(true);
    // Le vrai déblocage (vérification d'abonnement ou paiement Stripe) sera
    // branché ici. Pour l'instant, on simule le temps de traitement.
    setTimeout(() => {
      setUnlocking(false);
      setUnlocked(true);
    }, 1200);
  }

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
    <div className="mx-6 mb-10 rounded-2xl border border-surface-line md:mx-12">
      {!unlocked && (
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
              disabled={unlocking}
              className="rounded-full bg-bone px-11 py-3 text-base font-bold text-night transition hover:bg-orange disabled:opacity-70"
            >
              {unlocking ? 'Analyse en cours...' : 'Débloquer'}
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
