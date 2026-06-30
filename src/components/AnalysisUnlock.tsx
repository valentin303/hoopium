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
  strong: 'bg-green-500/10 text-green-400',
  variable: 'bg-orange-500/10 text-orange-400',
  uncertain: 'bg-red-500/10 text-red-400',
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
    <div className="flex gap-1">
      {form.results.map((r, i) => (
        <span
          key={i}
          className={
            r === 'w'
              ? 'flex h-6 w-6 items-center justify-center rounded-md bg-green-500/20 text-[10px] font-black text-green-400'
              : 'flex h-6 w-6 items-center justify-center rounded-md bg-red-500/15 text-[10px] font-black text-red-400'
          }
        >
          {r === 'w' ? 'V' : 'D'}
        </span>
      ))}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 font-black uppercase tracking-tight text-white" style={{ fontSize: 'clamp(1.25rem, 5vw, 1.75rem)', lineHeight: 1.1 }}>
      {children}
    </h2>
  );
}

function ProbRow({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 flex-shrink-0 text-xs leading-tight text-zinc-400">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-9 flex-shrink-0 text-right text-sm font-bold text-white">{pct}%</span>
    </div>
  );
}

export function AnalysisUnlock({ analysis }: { analysis: MatchAnalysis }) {
  const [phase, setPhase] = useState<Phase>('locked');

  const { match } = analysis;
  const unlocking = phase === 'processing';
  const unlocked = phase === 'done';

  const predictedHome = Math.round((analysis.totalPointsPredicted + analysis.spreadPredicted) / 2);
  const predictedAway = analysis.totalPointsPredicted - predictedHome;

  const homeColor = homeTeamColor(match.homeTeam.id);
  const awayColor = awayTeamColor(match.awayTeam.id);

  function handleUnlock() {
    setPhase('processing');
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
    <div className="relative min-h-screen bg-[#080808] pb-24">

      {/* HERO */}
      <div className="relative overflow-hidden" style={{ minHeight: 200 }}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/arena-bg.jpg'), radial-gradient(ellipse at 50% 0%, #1a1a1a 0%, #080808 100%)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#080808]" />
        <div className="pointer-events-none absolute -left-20 top-0 h-48 w-48 rounded-full opacity-20 blur-3xl" style={{ background: homeColor }} />
        <div className="pointer-events-none absolute -right-20 top-0 h-48 w-48 rounded-full opacity-20 blur-3xl" style={{ background: awayColor }} />

        <div className="relative z-10 px-4 pb-6 pt-4">
          <p className="mb-4 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
            {match.league.toUpperCase()} · {match.status === 'finished' ? 'HISTORICAL — FINAL' : match.status === 'live' ? 'EN DIRECT' : 'À VENIR'}
          </p>
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-1 flex-col items-center gap-2">
              <TeamLogo team={match.homeTeam} size={56} shape="circle" />
              <div className="text-center">
                <p className="text-[11px] font-black uppercase tracking-wider text-white">{match.homeTeam.name}</p>
                <p className="text-[9px] uppercase tracking-widest text-zinc-500">Domicile</p>
              </div>
              <FormDots form={match.homeTeam.form} />
            </div>

            <div className="flex flex-col items-center gap-1">
              {match.status === 'finished' && match.finalScore ? (
                <>
                  <span className="font-black tabular-nums text-white" style={{ fontSize: 'clamp(2rem, 10vw, 3rem)', lineHeight: 1 }}>
                    {match.finalScore.home}<span className="mx-1 text-zinc-600">-</span>{match.finalScore.away}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-zinc-500">Score final</span>
                </>
              ) : unlocked ? (
                <>
                  <span className="font-black tabular-nums" style={{ fontSize: 'clamp(2rem, 10vw, 3rem)', lineHeight: 1, color: homeColor }}>
                    {predictedHome}<span className="mx-1 text-zinc-600">-</span>{predictedAway}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-zinc-500">Score prédit</span>
                </>
              ) : (
                <>
                  <span className="font-black text-zinc-600" style={{ fontSize: 'clamp(1.5rem, 8vw, 2.5rem)' }}>VS</span>
                  <span className="text-[9px] uppercase tracking-widest text-zinc-600">Prédiction</span>
                </>
              )}
            </div>

            <div className="flex flex-1 flex-col items-center gap-2">
              <TeamLogo team={match.awayTeam} size={56} shape="circle" />
              <div className="text-center">
                <p className="text-[11px] font-black uppercase tracking-wider text-white">{match.awayTeam.name}</p>
                <p className="text-[9px] uppercase tracking-widest text-zinc-500">Extérieur</p>
              </div>
              <FormDots form={match.awayTeam.form} />
            </div>
          </div>
        </div>
      </div>

      {/* TAUX DE REUSSITE */}
      <div className="mx-4 mt-3 overflow-hidden rounded-2xl border border-zinc-800 bg-[#0f0f0f]">
        <div className="flex items-center gap-4 p-4">
          <TeamLogo team={match.homeTeam} size={52} shape="circle" className="flex-shrink-0" />
          <div className="flex-1">
            <p className="mb-0.5 font-black uppercase tracking-widest text-white" style={{ fontSize: 'clamp(0.85rem, 3.5vw, 1.1rem)' }}>
              Taux de réussite
            </p>
            <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-wide text-zinc-500">
              <span>Confiance</span>
              <span>Véracité · {MOCK_SITE_STATS.successRate}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-2xl tabular-nums" style={{ color: homeColor }}>{match.confidence}%</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${match.confidence}%`, background: homeColor, boxShadow: `0 0 8px ${homeColor}80` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENU VERROUILLE */}
      <div className="relative mt-4">
        {(phase === 'locked' || phase === 'processing') && (
          <div className="absolute inset-0 z-20 flex items-start justify-center pt-16">
            <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f0f0f]/95 p-7 text-center shadow-2xl">
              <p className="mb-2 text-[15px] font-bold text-white">
                Tu n&apos;as accès qu&apos;à <span className="text-orange-400">15%</span> de l&apos;analyse
              </p>
              <p className="mb-5 text-xs text-zinc-500">Score prédit, statistiques, graphiques et gagnant prédit</p>
              <button
                onClick={handleUnlock}
                disabled={unlocking}
                className="w-full rounded-full bg-white py-3 text-sm font-black uppercase tracking-wider text-black transition hover:bg-orange-400 hover:text-white disabled:opacity-60"
              >
                {unlocking ? 'Analyse en cours…' : 'Débloquer l\'analyse'}
              </button>
            </div>
          </div>
        )}

        <div className={`transition-[filter] duration-700 ${unlocked ? '' : 'pointer-events-none select-none blur-[3px] brightness-50'}`}>

          {/* STATISTIQUES AVANCEES */}
          <div className="mx-4 mt-2 rounded-2xl border border-zinc-800 bg-[#0f0f0f] p-4">
            <SectionTitle>Statistiques avancées</SectionTitle>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statsData} margin={{ bottom: 28 }}>
                <CartesianGrid stroke="#1f1f1f" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#52525b', fontSize: 10 }} angle={-30} textAnchor="end" height={48} interval={0} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 8 }} labelStyle={{ color: '#fff', fontWeight: 700 }} />
                <Legend verticalAlign="top" align="left" wrapperStyle={{ fontSize: 11, paddingBottom: 8, color: '#a1a1aa' }} />
                <Bar dataKey={match.homeTeam.name} fill={homeColor} radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey={match.awayTeam.name} fill={awayColor} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* FACTEURS */}
          <div className="mx-4 mt-4 rounded-2xl border border-zinc-800 bg-[#0f0f0f] p-4">
            <SectionTitle>Avantage {match.homeTeam.name}</SectionTitle>
            <div className="flex flex-col divide-y divide-zinc-800">
              {analysis.factors.map((factor, i) => (
                <div key={i} className="flex gap-3 py-3.5 first:pt-0 last:pb-0">
                  <span className={`mt-0.5 flex-shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${STRENGTH_STYLES[factor.strength]}`}>
                    {STRENGTH_LABELS[factor.strength]}
                  </span>
                  <p className="text-sm leading-relaxed text-zinc-300">{personalizeText(factor.text, match)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* JOUEURS CLES */}
          <div className="mx-4 mt-4">
            <SectionTitle>Joueurs clés</SectionTitle>
            <KeyPlayersSection players={analysis.keyPlayers} match={match} />
          </div>

          {/* TENDANCE OFFENSIVE */}
          <div className="mx-4 mt-4 rounded-2xl border border-zinc-800 bg-[#0f0f0f] p-4">
            <SectionTitle>Tendance offensive</SectionTitle>
            <p className="mb-3 text-xs text-zinc-500">Points marqués sur les 10 derniers matchs.</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trendData}>
                <CartesianGrid stroke="#1f1f1f" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 8 }} />
                <Legend verticalAlign="top" align="left" wrapperStyle={{ fontSize: 11, paddingBottom: 6, color: '#a1a1aa' }} />
                <Line type="monotone" dataKey={match.homeTeam.name} stroke={homeColor} strokeWidth={2.5} dot={{ r: 3, fill: homeColor }} />
                <Line type="monotone" dataKey={match.awayTeam.name} stroke={awayColor} strokeWidth={2.5} dot={{ r: 3, fill: awayColor }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* PROFIL RADAR */}
          <div className="mx-4 mt-4 rounded-2xl border border-zinc-800 bg-[#0f0f0f] p-4">
            <SectionTitle>Profil de jeu</SectionTitle>
            <p className="mb-3 text-xs text-zinc-500">Attaque · Défense · Rebonds · Passes · Forme · Domicile</p>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1f1f1f" />
                <PolarAngleAxis dataKey="label" tick={{ fill: '#52525b', fontSize: 10 }} />
                <Legend verticalAlign="top" align="left" wrapperStyle={{ fontSize: 11, paddingBottom: 6, color: '#a1a1aa' }} />
                <Radar dataKey={match.homeTeam.name} stroke={homeColor} fill={homeColor} fillOpacity={0.2} strokeWidth={2} />
                <Radar dataKey={match.awayTeam.name} stroke={awayColor} fill={awayColor} fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* PARIS */}
          <div className="mx-4 mt-4">
            <SectionTitle>Marchés paris</SectionTitle>
            <BettingMarketsSection markets={analysis.bettingMarkets} match={match} />
          </div>

          {/* FACE A FACE */}
          <div className="mx-4 mt-4">
            <SectionTitle>Face-à-face</SectionTitle>
            <HeadToHeadSection games={analysis.headToHeadDetailed} match={match} />
          </div>

          {/* CONTEXTE */}
          <div className="mx-4 mt-4">
            <SectionTitle>Contexte du match</SectionTitle>
            <ContextSection factors={analysis.contextFactors} match={match} />
          </div>

          {/* PROBABILITES */}
          <div className="mx-4 mt-4 rounded-2xl border border-zinc-800 bg-[#0f0f0f] p-4">
            <SectionTitle>Probabilités de victoire</SectionTitle>
            <div className="flex flex-col gap-3.5">
              <ProbRow label={`Victoire ${match.homeTeam.name}`} pct={analysis.winProbabilities.homeWinPct} color="bg-green-500" />
              <ProbRow label="Match serré" pct={analysis.winProbabilities.closeGamePct} color="bg-zinc-500" />
              <ProbRow label={`Victoire ${match.awayTeam.name}`} pct={analysis.winProbabilities.awayWinPct} color="bg-red-500" />
            </div>
          </div>

          {/* VERDICT */}
          <div className="mx-4 mt-4 rounded-2xl border-l-4 bg-zinc-900 px-5 py-5" style={{ borderColor: homeColor }}>
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">Verdict HOOPIUM</p>
            <p className="text-sm leading-relaxed text-zinc-200">{personalizeText(analysis.verdict, match)}</p>
          </div>

          {/* GAGNANT PREDIT */}
          <div
            className="mx-4 mt-4 mb-2 rounded-2xl p-6 text-center"
            style={{ background: `radial-gradient(ellipse at 50% 0%, ${homeColor}22 0%, transparent 70%), #0f0f0f`, border: `1px solid ${homeColor}40` }}
          >
            <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">Gagnant prédit</p>
            <p className="font-black uppercase tracking-tight text-white" style={{ fontSize: 'clamp(1.8rem, 8vw, 2.5rem)', lineHeight: 1.05 }}>
              {analysis.winProbabilities.homeWinPct > analysis.winProbabilities.awayWinPct ? match.homeTeam.name : match.awayTeam.name}
            </p>
            <p className="mt-1 font-mono text-xs text-zinc-500">Confiance · {match.confidence}%</p>
          </div>

        </div>
      </div>

      {/* NAV FIXE */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800 bg-[#080808]/95 backdrop-blur-md">
        <div className="flex items-center justify-around px-2 py-2">
          <Link href="/matchs" className="flex flex-col items-center gap-0.5 px-3 py-1 text-zinc-600 transition hover:text-zinc-300">
            <span className="text-base leading-none">▦</span>
            <span className="text-[9px] uppercase tracking-wider">Matchs</span>
          </Link>
          <span className="flex flex-col items-center gap-0.5 px-3 py-1" style={{ color: homeColor }}>
            <span className="text-base leading-none">↑↓</span>
            <span className="text-[9px] uppercase tracking-wider">Analyse</span>
          </span>
          <Link href="/historique" className="flex flex-col items-center gap-0.5 px-3 py-1 text-zinc-600 transition hover:text-zinc-300">
            <span className="text-base leading-none">↺</span>
            <span className="text-[9px] uppercase tracking-wider">Historique</span>
          </Link>
          <Link href="/tarifs" className="flex flex-col items-center gap-0.5 px-3 py-1 text-zinc-600 transition hover:text-zinc-300">
            <span className="text-base leading-none">⚙</span>
            <span className="text-[9px] uppercase tracking-wider">Paramètres</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
