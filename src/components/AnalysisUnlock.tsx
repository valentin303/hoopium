'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { TeamLogo } from './TeamLogo';
import { personalizeText } from '@/lib/personalize';
import { homeTeamColor, awayTeamColor } from '@/lib/team-colors';
import { MOCK_SITE_STATS } from '@/lib/mock-data';
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

const PROCESSING_MS = 900;

type Phase = 'locked' | 'processing' | 'done';

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

  const { match } = analysis;
  const unlocking = phase === 'processing';
  const unlocked = phase === 'done';

  // Score prédit par équipe, dérivé du total + écart — c'est précisément ce
  // qu'on verrouille, donc ces deux chiffres ne doivent jamais apparaître
  // ailleurs en clair avant le déblocage (cf. grille de stats plus bas).
  const predictedHome = Math.round((analysis.totalPointsPredicted + analysis.spreadPredicted) / 2);
  const predictedAway = analysis.totalPointsPredicted - predictedHome;

  const homeColor = homeTeamColor(match.homeTeam.id);
  const awayColor = awayTeamColor(match.awayTeam.id);

  function handleUnlock() {
    setPhase('processing');
    // Le vrai déblocage (vérification d'abonnement ou paiement Stripe) sera
    // branché ici. Pour l'instant, on simule le temps de traitement.
    setTimeout(() => setPhase('done'), PROCESSING_MS);
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
    <>
      <div className="flex items-center justify-between px-4 pb-1 pt-5">
        <span className="truncate font-display text-base font-extrabold uppercase tracking-tight">
          {match.homeTeam.name}
        </span>
        <span className="flex-shrink-0 px-2 font-display text-[10px] uppercase tracking-widest text-bone-dim">
          {match.status === 'finished' ? 'Final' : unlocked ? 'Prédiction' : 'VS'}
        </span>
        <span className="truncate text-right font-display text-base font-extrabold uppercase tracking-tight">
          {match.awayTeam.name}
        </span>
      </div>

      <div className="flex items-center justify-between px-4 pb-3">
        <FormDots form={match.homeTeam.form} />
        <FormDots form={match.awayTeam.form} />
      </div>

      <div className="flex items-center justify-center gap-3 px-4 pb-5">
        <div className="flex items-center gap-3 rounded-full border border-surface-line bg-night-soft/60 px-4 py-2.5">
          <TeamLogo team={match.homeTeam} size={36} shape="circle" />
          <span className="font-display text-lg font-bold text-bone-dim">VS</span>
          <TeamLogo team={match.awayTeam} size={36} shape="circle" />
        </div>
      </div>

      <div className="px-4 pb-2">
        <div className="rounded-3xl border border-orange-dim bg-gradient-to-br from-orange-glow to-transparent px-4 py-4">
          <div className="flex items-center gap-3">
            <TeamLogo team={match.confidence >= 50 ? match.homeTeam : match.awayTeam} size={48} shape="circle" />
            <div className="flex-1">
              <p className="font-display text-[13px] font-bold uppercase tracking-wide">Taux de réussite</p>
              <div className="mt-1 flex items-end justify-between gap-3">
                <div>
                  <span className="font-display text-[10px] uppercase tracking-widest text-bone-dim">Confiance</span>
                  <p className="font-display text-2xl font-bold leading-none text-orange">{match.confidence}%</p>
                </div>
                <div className="text-right">
                  <span className="font-display text-[10px] uppercase tracking-widest text-bone-dim">Véracité</span>
                  <p className="font-display text-base font-bold leading-none text-bone">{MOCK_SITE_STATS.successRate}%</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-night/60">
            <div className="h-full rounded-full bg-orange transition-all" style={{ width: `${match.confidence}%` }} />
          </div>
          {unlocked && (
            <p className="mt-3 text-center font-display text-sm font-semibold text-bone">
              Score prédit : {predictedHome} - {predictedAway}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-around border-y border-surface-line px-4 py-3 text-[10px] uppercase tracking-wide text-bone-dim">
        <Link href="/matchs" className="flex flex-col items-center gap-1 hover:text-orange">
          <span>📋</span>
          <span>Matchs</span>
        </Link>
        <span className="flex flex-col items-center gap-1 text-orange">
          <span>📊</span>
          <span>Analyse</span>
        </span>
        <Link href="/historique" className="flex flex-col items-center gap-1 hover:text-orange">
          <span>🕒</span>
          <span>Historique</span>
        </Link>
        <Link href="/tarifs" className="flex flex-col items-center gap-1 hover:text-orange">
          <span>⚙️</span>
          <span>Paramètres</span>
        </Link>
      </div>

      <div className="relative mx-3 mb-6 mt-2 rounded-3xl border border-surface-line">
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

        <div
          className={`relative overflow-hidden transition-[filter] duration-700 ${
            unlocked ? '' : 'pointer-events-none max-h-[900px] blur-[2.5px] brightness-[0.8]'
          }`}
        >
          <div className="flex flex-col gap-10 px-4 py-6">
            <section>
              <h3 className="mb-1 font-display text-xs uppercase tracking-wider text-orange">
                — Comparaison statistique
              </h3>
              <p className="mb-4 text-xs text-bone-dim">
                Moyennes de la saison régulière, équipe par équipe.
              </p>
              <div className="rounded-2xl border border-surface-line bg-night-soft/80 p-4">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={statsData} margin={{ bottom: 24 }}>
                    <CartesianGrid stroke="#232323" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#6b6b68', fontSize: 10 }}
                      angle={-35}
                      textAnchor="end"
                      height={50}
                      interval={0}
                    />
                    <YAxis tick={{ fill: '#6b6b68', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#161616', border: '1px solid #232323' }} />
                    <Legend verticalAlign="top" align="left" wrapperStyle={{ fontSize: 12, paddingBottom: 8 }} />
                    <Bar dataKey={match.homeTeam.name} fill={homeColor} radius={[4, 4, 0, 0]} />
                    <Bar dataKey={match.awayTeam.name} fill={awayColor} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <KeyPlayersSection players={analysis.keyPlayers} match={match} />

            <BettingMarketsSection markets={analysis.bettingMarkets} match={match} />

            <section>
              <h3 className="mb-1 font-display text-xs uppercase tracking-wider text-orange">
                — Tendance offensive & Profil
              </h3>
              <p className="mb-4 text-xs text-bone-dim">
                À gauche : points marqués sur les 10 derniers matchs. À droite : profil de jeu
                global (attaque, défense, rebonds, passes, forme du moment, solidité à domicile).
              </p>
              <div className="grid gap-3">
                <div className="rounded-2xl border border-surface-line bg-night-soft/80 p-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trendData}>
                      <CartesianGrid stroke="#232323" />
                      <XAxis dataKey="label" tick={{ fill: '#6b6b68', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#6b6b68', fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: '#161616', border: '1px solid #232323' }} />
                      <Legend verticalAlign="top" align="left" wrapperStyle={{ fontSize: 11, paddingBottom: 6 }} />
                      <Line type="monotone" dataKey={match.homeTeam.name} stroke={homeColor} strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey={match.awayTeam.name} stroke={awayColor} strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="rounded-2xl border border-surface-line bg-night-soft/80 p-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#232323" />
                      <PolarAngleAxis dataKey="label" tick={{ fill: '#6b6b68', fontSize: 10 }} />
                      <Legend verticalAlign="top" align="left" wrapperStyle={{ fontSize: 11, paddingBottom: 6 }} />
                      <Radar dataKey={match.homeTeam.name} stroke={homeColor} fill={homeColor} fillOpacity={0.2} />
                      <Radar dataKey={match.awayTeam.name} stroke={awayColor} fill={awayColor} fillOpacity={0.35} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <HeadToHeadSection games={analysis.headToHeadDetailed} match={match} />

            <ContextSection factors={analysis.contextFactors} match={match} />

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
                    <p className="text-[14px] leading-relaxed text-bone">{personalizeText(factor.text, match)}</p>
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

            <section className="rounded-3xl border-l-[3px] border-orange bg-surface px-7 py-6">
              <p className="mb-3 font-display text-[11px] uppercase tracking-widest text-orange">
                Verdict HOOPIUM
              </p>
              <p className="text-[15px] leading-relaxed">{personalizeText(analysis.verdict, match)}</p>
            </section>

            <section className="rounded-3xl border border-orange-dim bg-gradient-to-br from-orange-glow to-transparent px-8 py-7 text-center">
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

function ProbRow({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <span className="w-24 flex-shrink-0 text-[11px] leading-tight text-bone-dim sm:w-40 sm:text-xs">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded bg-surface-line">
        <div className={`h-full rounded ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-9 flex-shrink-0 text-right text-[13px] font-semibold">{pct}%</span>
    </div>
  );
}
