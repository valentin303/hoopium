'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { TeamLogo } from './TeamLogo';
import { personalizeText } from '@/lib/personalize';
import { MOCK_SITE_STATS } from '@/lib/mock-data';
import type { Match, MatchAnalysis } from '@/types';
import { KeyPlayersSection } from './KeyPlayersSection';
import { BettingMarketsSection } from './BettingMarketsSection';
import { HeadToHeadSection } from './HeadToHeadSection';
import { ContextSection } from './ContextSection';

const ORANGE = '#FF6B1A';
const ORANGE_DIM = '#FF6B1A30';
const BONE = '#a8a8a0';

const STRENGTH_STYLES = {
  strong: 'bg-green-500/10 text-green-400 border border-green-500/20',
  variable: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  uncertain: 'bg-red-500/10 text-red-400 border border-red-500/20',
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
        <span key={i} className={
          r === 'w'
            ? 'flex h-6 w-6 items-center justify-center rounded-md bg-green-500/20 text-[10px] font-black text-green-400'
            : 'flex h-6 w-6 items-center justify-center rounded-md bg-red-500/15 text-[10px] font-black text-red-400'
        }>{r === 'w' ? 'V' : 'D'}</span>
      ))}
    </div>
  );
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-5">
      <h2 className="font-black uppercase text-white" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', lineHeight: 1.05, letterSpacing: '-0.01em' }}>
        {children}
      </h2>
      {sub && <p className="mt-1 text-xs text-zinc-500 uppercase tracking-widest">{sub}</p>}
    </div>
  );
}

function ProbRow({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-48 flex-shrink-0 text-sm text-zinc-400">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-zinc-800/80">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 flex-shrink-0 text-right text-sm font-bold text-white">{pct}%</span>
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

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-zinc-800/60" style={{ minHeight: 220 }}>
        <div className="absolute inset-0 bg-cover bg-center brightness-40"
          style={{ backgroundImage: "url('/arena-bg.jpg'), radial-gradient(ellipse at 50% 0%, #1a1a1a 0%, #080808 100%)" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-[#080808]" />
        <div className="pointer-events-none absolute -left-32 top-0 h-64 w-64 rounded-full opacity-15 blur-3xl" style={{ background: ORANGE }} />
        <div className="pointer-events-none absolute -right-32 top-0 h-64 w-64 rounded-full opacity-10 blur-3xl" style={{ background: ORANGE }} />

        <div className="relative z-10 mx-auto max-w-5xl px-6 pb-8 pt-6">
          <p className="mb-6 text-center font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-500">
            {match.league.toUpperCase()} · {match.status === 'finished' ? 'HISTORICAL — FINAL' : match.status === 'live' ? 'EN DIRECT' : 'À VENIR'}
          </p>

          <div className="flex items-center justify-between gap-6">
            {/* Domicile */}
            <div className="flex flex-1 flex-col items-center gap-3">
              <TeamLogo team={match.homeTeam} size={72} shape="circle" />
              <div className="text-center">
                <p className="text-sm font-black uppercase tracking-wider text-white">{match.homeTeam.name}</p>
                <p className="text-[9px] uppercase tracking-widest text-zinc-500">Domicile</p>
              </div>
              <FormDots form={match.homeTeam.form} />
            </div>

            {/* Score */}
            <div className="flex flex-col items-center gap-2">
              {match.status === 'finished' && match.finalScore ? (
                <>
                  <span className="font-black tabular-nums text-white" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', lineHeight: 1 }}>
                    {match.finalScore.home}<span className="mx-2 text-zinc-700">-</span>{match.finalScore.away}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-zinc-500">Score final</span>
                </>
              ) : unlocked ? (
                <>
                  <span className="font-black tabular-nums" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', lineHeight: 1, color: ORANGE }}>
                    {predictedHome}<span className="mx-2 text-zinc-700">-</span>{predictedAway}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-zinc-500">Score prédit</span>
                </>
              ) : (
                <>
                  <span className="font-black text-zinc-700" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>VS</span>
                  <span className="text-[9px] uppercase tracking-widest text-zinc-600">Prédiction</span>
                </>
              )}
            </div>

            {/* Extérieur */}
            <div className="flex flex-1 flex-col items-center gap-3">
              <TeamLogo team={match.awayTeam} size={72} shape="circle" />
              <div className="text-center">
                <p className="text-sm font-black uppercase tracking-wider text-white">{match.awayTeam.name}</p>
                <p className="text-[9px] uppercase tracking-widest text-zinc-500">Extérieur</p>
              </div>
              <FormDots form={match.awayTeam.form} />
            </div>
          </div>
        </div>
      </div>

      {/* ── TAUX DE RÉUSSITE ─────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-6 mt-5">
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#0d0d0d]">
          <div className="flex items-center gap-5 p-5">
            <TeamLogo team={match.homeTeam} size={56} shape="circle" className="flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-baseline justify-between mb-2">
                <p className="font-black uppercase tracking-widest text-white" style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)' }}>
                  Taux de réussite
                </p>
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">Véracité · {MOCK_SITE_STATS.successRate}%</span>
              </div>
              <p className="mb-2 text-[10px] uppercase tracking-wide text-zinc-600">Confiance</p>
              <div className="flex items-center gap-3">
                <span className="font-black text-3xl tabular-nums" style={{ color: ORANGE }}>{match.confidence}%</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-800">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${match.confidence}%`, background: ORANGE, boxShadow: `0 0 12px ${ORANGE}60` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENU VERROUILLÉ ───────────────────────────────────────── */}
      <div className="relative mt-6">
        {(phase === 'locked' || phase === 'processing') && (
          <div className="absolute inset-0 z-20 flex items-start justify-center pt-20">
            <div className="mx-6 w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0d0d]/95 p-8 text-center shadow-2xl">
              <p className="mb-2 text-base font-bold text-white">
                Tu n&apos;as accès qu&apos;à <span style={{ color: ORANGE }}>15%</span> de l&apos;analyse
              </p>
              <p className="mb-6 text-sm text-zinc-500">Score prédit · Statistiques · Graphiques · Gagnant prédit</p>
              <button onClick={handleUnlock} disabled={unlocking}
                className="w-full rounded-full py-3.5 text-sm font-black uppercase tracking-wider text-black transition disabled:opacity-60"
                style={{ background: unlocking ? '#555' : 'white' }}>
                {unlocking ? 'Analyse en cours…' : 'Débloquer l\'analyse'}
              </button>
            </div>
          </div>
        )}

        <div className={`mx-auto max-w-5xl px-6 transition-[filter] duration-700 ${unlocked ? '' : 'pointer-events-none select-none blur-[3px] brightness-50'}`}>

          {/* ── STATISTIQUES AVANCÉES DU MATCH ─── */}
          <div className="rounded-2xl border border-zinc-800 bg-[#0d0d0d] p-6 mb-5">
            <SectionTitle sub="Moyennes saison régulière">Statistiques avancées du match.</SectionTitle>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statsData} margin={{ bottom: 32 }}>
                <CartesianGrid stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#52525b', fontSize: 11 }} angle={-25} textAnchor="end" height={52} interval={0} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 10 }} labelStyle={{ color: '#fff', fontWeight: 700 }} />
                <Legend verticalAlign="top" align="left" wrapperStyle={{ fontSize: 12, paddingBottom: 12, color: '#71717a' }} />
                <Bar dataKey={match.homeTeam.name} fill={ORANGE} radius={[5, 5, 0, 0]} maxBarSize={32} />
                <Bar dataKey={match.awayTeam.name} fill={BONE} radius={[5, 5, 0, 0]} maxBarSize={32} fillOpacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── AVANTAGE + FACTEURS ─── */}
          <div className="rounded-2xl border border-zinc-800 bg-[#0d0d0d] p-6 mb-5">
            <SectionTitle sub="Facteurs déterminants">Avantage {match.homeTeam.name} (off &amp; def)</SectionTitle>
            <div className="flex flex-col divide-y divide-zinc-800/80">
              {analysis.factors.map((factor, i) => (
                <div key={i} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                  <span className={`mt-0.5 flex-shrink-0 rounded-full px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-wider ${STRENGTH_STYLES[factor.strength]}`}>
                    {STRENGTH_LABELS[factor.strength]}
                  </span>
                  <p className="text-sm leading-relaxed text-zinc-300">{personalizeText(factor.text, match)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── TENDANCE + RADAR côte à côte sur desktop ─── */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-5">
            <div className="rounded-2xl border border-zinc-800 bg-[#0d0d0d] p-6">
              <SectionTitle sub="10 derniers matchs">Tendance offensive.</SectionTitle>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                  <CartesianGrid stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 10 }} />
                  <Legend verticalAlign="top" align="left" wrapperStyle={{ fontSize: 11, paddingBottom: 8, color: '#71717a' }} />
                  <Line type="monotone" dataKey={match.homeTeam.name} stroke={ORANGE} strokeWidth={2.5} dot={{ r: 3, fill: ORANGE }} />
                  <Line type="monotone" dataKey={match.awayTeam.name} stroke={BONE} strokeWidth={2.5} dot={{ r: 3, fill: BONE }} strokeOpacity={0.7} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-[#0d0d0d] p-6">
              <SectionTitle sub="Attaque · Défense · Rebonds · Passes · Forme">Profil de jeu.</SectionTitle>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1a1a1a" />
                  <PolarAngleAxis dataKey="label" tick={{ fill: '#52525b', fontSize: 10 }} />
                  <Legend verticalAlign="top" align="left" wrapperStyle={{ fontSize: 11, paddingBottom: 8, color: '#71717a' }} />
                  <Radar dataKey={match.homeTeam.name} stroke={ORANGE} fill={ORANGE} fillOpacity={0.18} strokeWidth={2} />
                  <Radar dataKey={match.awayTeam.name} stroke={BONE} fill={BONE} fillOpacity={0.12} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── COMPARAISON D'ALIGNEMENT (Joueurs) ─── */}
          <div className="rounded-2xl border border-zinc-800 bg-[#0d0d0d] p-6 mb-5">
            <SectionTitle sub="Présent · Questionnable · Absent">Comparaison d'alignement.</SectionTitle>
            <KeyPlayersSection players={analysis.keyPlayers} match={match} />
          </div>

          {/* ── MARCHÉS PARIS ─── */}
          <div className="rounded-2xl border border-zinc-800 bg-[#0d0d0d] p-6 mb-5">
            <SectionTitle sub="Marchés analysés">Analyse des marchés Hoopium.</SectionTitle>
            <BettingMarketsSection markets={analysis.bettingMarkets} match={match} />
          </div>

          {/* ── FACE-À-FACE ─── */}
          <div className="rounded-2xl border border-zinc-800 bg-[#0d0d0d] p-6 mb-5">
            <SectionTitle sub="Historique des confrontations directes">Face-à-face.</SectionTitle>
            <HeadToHeadSection games={analysis.headToHeadDetailed} match={match} />
          </div>

          {/* ── CONTEXTE ─── */}
          <div className="rounded-2xl border border-zinc-800 bg-[#0d0d0d] p-6 mb-5">
            <SectionTitle sub="Repos · Déplacement · Enjeu · Série">Contexte du match.</SectionTitle>
            <ContextSection factors={analysis.contextFactors} match={match} />
          </div>

          {/* ── PROBABILITÉS ─── */}
          <div className="rounded-2xl border border-zinc-800 bg-[#0d0d0d] p-6 mb-5">
            <SectionTitle>Probabilités de victoire.</SectionTitle>
            <div className="flex flex-col gap-4">
              <ProbRow label={`Victoire ${match.homeTeam.name}`} pct={analysis.winProbabilities.homeWinPct} color="bg-orange-500" />
              <ProbRow label="Match serré" pct={analysis.winProbabilities.closeGamePct} color="bg-zinc-500" />
              <ProbRow label={`Victoire ${match.awayTeam.name}`} pct={analysis.winProbabilities.awayWinPct} color="bg-red-500" />
            </div>
          </div>

          {/* ── VERDICT ─── */}
          <div className="rounded-2xl border-l-[3px] bg-zinc-900/80 px-6 py-6 mb-5" style={{ borderColor: ORANGE }}>
            <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.25em] text-zinc-500">Verdict HOOPIUM</p>
            <p className="text-sm leading-relaxed text-zinc-200">{personalizeText(analysis.verdict, match)}</p>
          </div>

          {/* ── GAGNANT PRÉDIT ─── */}
          <div className="rounded-2xl p-8 text-center mb-2"
            style={{ background: `radial-gradient(ellipse at 50% 0%, ${ORANGE_DIM} 0%, transparent 70%), #0d0d0d`, border: `1px solid ${ORANGE}35` }}>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">Gagnant prédit</p>
            <p className="font-black uppercase text-white" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
              {analysis.winProbabilities.homeWinPct > analysis.winProbabilities.awayWinPct ? match.homeTeam.name : match.awayTeam.name}
            </p>
            <p className="mt-2 font-mono text-xs text-zinc-500">Confiance · {match.confidence}%</p>
          </div>

        </div>
      </div>

      {/* ── NAV FIXE ─────────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800/80 bg-[#080808]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-around px-6 py-2.5">
          {[
            { href: '/matchs', icon: '▦', label: 'Matchs' },
            { href: null, icon: '↑↓', label: 'Analyse', active: true },
            { href: '/historique', icon: '↺', label: 'Historique' },
            { href: '/tarifs', icon: '⚙', label: 'Paramètres' },
          ].map((item) =>
            item.href ? (
              <Link key={item.label} href={item.href}
                className="flex flex-col items-center gap-0.5 px-4 py-1 text-zinc-600 transition hover:text-zinc-300">
                <span className="text-base leading-none">{item.icon}</span>
                <span className="text-[9px] uppercase tracking-wider">{item.label}</span>
              </Link>
            ) : (
              <span key={item.label} className="flex flex-col items-center gap-0.5 px-4 py-1" style={{ color: ORANGE }}>
                <span className="text-base leading-none">{item.icon}</span>
                <span className="text-[9px] uppercase tracking-wider">{item.label}</span>
              </span>
            )
          )}
        </div>
      </nav>
    </div>
  );
}
