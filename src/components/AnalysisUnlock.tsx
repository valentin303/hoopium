'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { TeamLogo } from './TeamLogo';
import { personalizeText } from '@/lib/personalize';
import { MOCK_SITE_STATS } from '@/lib/mock-data';
import type { Match, MatchAnalysis, Team } from '@/types';
import { KeyPlayersSection } from './KeyPlayersSection';
import { BettingMarketsSection } from './BettingMarketsSection';
import { HeadToHeadSection } from './HeadToHeadSection';
import { ContextSection } from './ContextSection';
import { AIEye } from './AIEye';

const STRENGTH_STYLES = {
  strong: 'bg-green/10 text-green border border-green/20',
  variable: 'bg-orange-glow text-orange border border-orange-dim',
  uncertain: 'bg-red/10 text-red border border-red/20',
} as const;
const STRENGTH_LABELS = { strong: 'Fort', variable: 'Variable', uncertain: 'Incertain' } as const;
const PROCESSING_MS = 900;
type Phase = 'locked' | 'processing' | 'done';

function FormDots({ form }: { form: Match['homeTeam']['form'] }) {
  return (
    <div className="flex gap-1">
      {form.results.map((r, i) => (
        <span key={i} className={
          r === 'w'
            ? 'flex h-6 w-6 items-center justify-center rounded-md bg-green/15 text-[10px] font-black text-green'
            : 'flex h-6 w-6 items-center justify-center rounded-md bg-red/10 text-[10px] font-black text-red'
        }>{r === 'w' ? 'V' : 'D'}</span>
      ))}
    </div>
  );
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-5">
      <h2 className="font-display font-black uppercase text-bone" style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)', lineHeight: 1.05 }}>
        {children}
      </h2>
      {sub && <p className="mt-1.5 text-[10px] uppercase tracking-[0.2em] text-bone-dim">{sub}</p>}
    </div>
  );
}

function ProbRow({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-48 flex-shrink-0 text-sm text-bone-dim">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-line">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 flex-shrink-0 text-right text-sm font-bold text-bone">{pct}%</span>
    </div>
  );
}

/** Arc de cercle (demi-cercle) animé */
function ArcProgress({ pct }: { pct: number }) {
  const arcPath = "M 16 60 A 54 54 0 0 1 124 60";
  const totalLen = Math.PI * 54;
  const fillLen = totalLen * pct / 100;

  return (
    <svg width="140" height="80" viewBox="0 0 140 80" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', margin: '0 auto' }}>
      <path d={arcPath} fill="none" stroke="#232323" strokeWidth="10" strokeLinecap="round" />
      <path
        d={arcPath}
        fill="none"
        stroke="#FF6B1A"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${fillLen} ${totalLen}`}
        style={{ filter: 'drop-shadow(0 0 6px #FF6B1A80)' }}
      />
      <text x="70" y="46" textAnchor="middle" fill="#FF6B1A" fontFamily="Oswald, sans-serif" fontWeight="900" fontSize="22">{pct}%</text>
      <text x="70" y="60" textAnchor="middle" fill="#6b6b68" fontFamily="Space Grotesk, sans-serif" fontSize="8" letterSpacing="2">CONFIANCE</text>
    </svg>
  );
}

/** Logo flouté en fond */
function BlurredLogo({ team, opacity = 0.18 }: { team: Team; opacity?: number }) {
  if (!team.logoUrl) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden">
      <Image
        src={team.logoUrl}
        alt=""
        width={420}
        height={420}
        className="object-contain"
        style={{ opacity, filter: 'blur(5px)', transform: 'scale(1.3)' }}
        aria-hidden
      />
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
  const predictedWinner = analysis.winProbabilities.homeWinPct >= analysis.winProbabilities.awayWinPct
    ? match.homeTeam : match.awayTeam;

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
    <div className="relative min-h-screen bg-night pb-24">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden border-b border-surface-line transition-all duration-700" style={{ minHeight: 220 }}>
        {/* Fond arène (toujours) */}
        <div className="absolute inset-0 bg-cover bg-center brightness-40"
          style={{ backgroundImage: "url('/arena-bg.jpg'), radial-gradient(ellipse at 50% 0%, #1a1a1a 0%, #0a0a0a 100%)" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-night" />

        {/* Quand débloqué : logo gagnant flouté en fond */}
        {unlocked && <BlurredLogo team={predictedWinner} opacity={0.25} />}

        <div className="pointer-events-none absolute -left-32 top-0 h-64 w-64 rounded-full opacity-10 blur-3xl bg-orange" />
        <div className="pointer-events-none absolute -right-32 top-0 h-64 w-64 rounded-full opacity-10 blur-3xl bg-orange" />

        <div className="relative z-10 mx-auto max-w-5xl px-6 pb-8 pt-6">
          {/* Bandeau équipes style maquette */}
          <div className="mb-6 flex items-center justify-between gap-2">
            <div className="flex flex-col items-start">
              <span className="font-display text-xs font-bold uppercase tracking-widest text-bone">{match.homeTeam.name}</span>
              <span className="text-[9px] uppercase tracking-widest text-bone-dim">Domicile</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-display text-[10px] uppercase tracking-[0.25em] text-bone-dim">
                {match.league.toUpperCase()}
              </span>
              <span className="font-display text-[9px] uppercase tracking-[0.2em] text-orange">
                {match.status === 'finished' ? 'HISTORICAL — FINAL' : match.status === 'live' ? 'EN DIRECT' : 'À VENIR'}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-display text-xs font-bold uppercase tracking-widest text-bone">{match.awayTeam.name}</span>
              <span className="text-[9px] uppercase tracking-widest text-bone-dim">Extérieur</span>
            </div>
          </div>

          {/* Badge exemple si match de démonstration */}
          {match.status === 'scheduled' && (
            <div className="mb-5 flex justify-center">
              <span className="rounded-full border border-orange-dim bg-orange-glow px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-orange">
                Exemple d&apos;analyse — données de démonstration
              </span>
            </div>
          )}

          {/* Version VERROUILLÉE : deux équipes */}
          {!unlocked && (
            <div className="flex items-center justify-between gap-6 transition-opacity duration-500">
              <div className="flex flex-1 flex-col items-center gap-3">
                <TeamLogo team={match.homeTeam} size={52} shape="circle" />
                <div className="text-center">
                  <p className="text-sm font-black uppercase tracking-wider text-bone">{match.homeTeam.name}</p>
                  <p className="text-[9px] uppercase tracking-widest text-bone-dim">Domicile</p>
                </div>
                <FormDots form={match.homeTeam.form} />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="font-display font-black text-surface-line" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>VS</span>
                <span className="font-display font-black text-orange" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>{match.confidence}%</span>
                <span className="text-[9px] uppercase tracking-widest text-bone-dim">Confiance IA</span>
              </div>
              <div className="flex flex-1 flex-col items-center gap-3">
                <TeamLogo team={match.awayTeam} size={52} shape="circle" />
                <div className="text-center">
                  <p className="text-sm font-black uppercase tracking-wider text-bone">{match.awayTeam.name}</p>
                  <p className="text-[9px] uppercase tracking-widest text-bone-dim">Extérieur</p>
                </div>
                <FormDots form={match.awayTeam.form} />
              </div>
            </div>
          )}

          {/* Version DÉBLOQUÉE : gros logo gagnant + score prédit */}
          {unlocked && (
            <div className="flex flex-col items-center gap-4 transition-opacity duration-500">
              <TeamLogo team={predictedWinner} size={96} shape="circle" />
              <div className="text-center">
                <p className="font-display font-black uppercase tracking-wider text-bone" style={{ fontSize: 'clamp(1.2rem, 3vw, 1.8rem)' }}>
                  {predictedWinner.name}
                </p>
                <p className="text-[9px] uppercase tracking-widest text-bone-dim">Gagnant prédit</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="font-display font-black tabular-nums text-orange" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', lineHeight: 1, textShadow: '0 0 24px rgba(255,107,26,.35)' }}>
                  {predictedHome}<span className="mx-2 text-surface-line">-</span>{predictedAway}
                </span>
                <span className="text-[9px] uppercase tracking-widest text-bone-dim">Score prédit</span>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* ── TAUX DE RÉUSSITE ── */}
      {unlocked && (
      <div className="mx-auto max-w-5xl px-6 mt-5">
        <div className="rounded-2xl border border-surface-line bg-night-soft p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <TeamLogo team={predictedWinner} size={48} shape="circle" className="flex-shrink-0" />
              <div>
                <p className="font-display font-black uppercase tracking-widest text-bone text-sm">Taux de réussite</p>
                <p className="text-[10px] uppercase tracking-wide text-bone-dim">Véracité vérifiée · {MOCK_SITE_STATS.successRate}%</p>
              </div>
            </div>
            <div style={{ width: 140, height: 80, flexShrink: 0 }}>
              <ArcProgress pct={match.confidence} />
            </div>
          </div>
        </div>
      </div>
      )}




      {/* ── CONTENU VERROUILLÉ ── */}
      <div className="relative mt-6">
        {(phase === 'locked' || phase === 'processing') && (
          <div className="absolute inset-0 z-20 flex items-start justify-center pt-20">
            <div className="mx-6 w-full max-w-md rounded-2xl border border-surface-line bg-night/95 p-8 text-center shadow-2xl">
              <p className="mb-2 text-base font-bold text-bone">
                Tu n&apos;as accès qu&apos;à <span className="text-orange">15%</span> de l&apos;analyse
              </p>
              <p className="mb-6 text-sm text-bone-dim">Score prédit · Statistiques · Graphiques · Gagnant prédit</p>
              <button onClick={handleUnlock} disabled={unlocking}
                className="w-full rounded-full bg-bone py-3.5 text-sm font-black uppercase tracking-wider text-night transition hover:bg-orange disabled:opacity-60">
                {unlocking ? 'Analyse en cours…' : "Débloquer l'analyse"}
              </button>
            </div>
          </div>
        )}

        <div className={`mx-auto max-w-5xl px-6 transition-[filter] duration-700 ${unlocked ? '' : 'pointer-events-none select-none blur-[3px] brightness-50'}`}>

          {/* STATISTIQUES */}
          <div className="rounded-2xl border border-surface-line bg-night-soft p-6 mb-5">
            <SectionTitle sub="Moyennes saison régulière">Statistiques avancées du match.</SectionTitle>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statsData} margin={{ bottom: 32 }}>
                <CartesianGrid stroke="#232323" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#6b6b68', fontSize: 11 }} angle={-25} textAnchor="end" height={52} interval={0} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b6b68', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#161616', border: '1px solid #232323', borderRadius: 10 }} labelStyle={{ color: '#EDEAE3', fontWeight: 700 }} />
                <Legend verticalAlign="top" align="left" wrapperStyle={{ fontSize: 12, paddingBottom: 12, color: '#6b6b68' }} />
                <Bar dataKey={match.homeTeam.name} fill="#FF6B1A" radius={[5, 5, 0, 0]} maxBarSize={32} />
                <Bar dataKey={match.awayTeam.name} fill="#6b6b68" radius={[5, 5, 0, 0]} maxBarSize={32} fillOpacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AVANTAGE */}
          <div className="rounded-2xl border border-surface-line bg-night-soft p-6 mb-5">
            <SectionTitle sub="Facteurs déterminants">Avantage {match.homeTeam.name} (off &amp; def)</SectionTitle>
            <div className="flex flex-col divide-y divide-surface-line">
              {analysis.factors.map((factor, i) => (
                <div key={i} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                  <span className={`mt-0.5 flex-shrink-0 rounded-full px-3 py-1 font-display text-[9px] font-bold uppercase tracking-wider ${STRENGTH_STYLES[factor.strength]}`}>
                    {STRENGTH_LABELS[factor.strength]}
                  </span>
                  <p className="text-sm leading-relaxed text-bone">{personalizeText(factor.text, match)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* TENDANCE + RADAR */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-5">
            <div className="rounded-2xl border border-surface-line bg-night-soft p-6">
              <SectionTitle sub="10 derniers matchs">Tendance offensive.</SectionTitle>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                  <CartesianGrid stroke="#232323" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#6b6b68', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b6b68', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#161616', border: '1px solid #232323', borderRadius: 10 }} />
                  <Legend verticalAlign="top" align="left" wrapperStyle={{ fontSize: 11, paddingBottom: 8, color: '#6b6b68' }} />
                  <Line type="monotone" dataKey={match.homeTeam.name} stroke="#FF6B1A" strokeWidth={2.5} dot={{ r: 3, fill: '#FF6B1A' }} />
                  <Line type="monotone" dataKey={match.awayTeam.name} stroke="#6b6b68" strokeWidth={2} dot={{ r: 3, fill: '#6b6b68' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-2xl border border-surface-line bg-night-soft p-6">
              <SectionTitle sub="Attaque · Défense · Rebonds · Passes · Forme">Profil de jeu.</SectionTitle>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#232323" />
                  <PolarAngleAxis dataKey="label" tick={{ fill: '#6b6b68', fontSize: 10 }} />
                  <Legend verticalAlign="top" align="left" wrapperStyle={{ fontSize: 11, paddingBottom: 8, color: '#6b6b68' }} />
                  <Radar dataKey={match.homeTeam.name} stroke="#FF6B1A" fill="#FF6B1A" fillOpacity={0.15} strokeWidth={2} />
                  <Radar dataKey={match.awayTeam.name} stroke="#6b6b68" fill="#6b6b68" fillOpacity={0.1} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ALIGNEMENT */}
          <div className="rounded-2xl border border-surface-line bg-night-soft p-6 mb-5">
            <SectionTitle sub="Présent · Questionnable · Absent">Comparaison d'alignement.</SectionTitle>
            <KeyPlayersSection players={analysis.keyPlayers} match={match} />
          </div>

          {/* MARCHÉS */}
          <div className="rounded-2xl border border-surface-line bg-night-soft p-6 mb-5">
            <SectionTitle sub="Marchés analysés">Analyse des marchés Hoopium.</SectionTitle>
            <BettingMarketsSection markets={analysis.bettingMarkets} match={match} />
          </div>

          {/* FACE-À-FACE */}
          <div className="rounded-2xl border border-surface-line bg-night-soft p-6 mb-5">
            <SectionTitle sub="Historique des confrontations directes">Face-à-face.</SectionTitle>
            <HeadToHeadSection games={analysis.headToHeadDetailed} match={match} />
          </div>

          {/* CONTEXTE */}
          <div className="rounded-2xl border border-surface-line bg-night-soft p-6 mb-5">
            <SectionTitle sub="Repos · Déplacement · Enjeu · Série">Contexte du match.</SectionTitle>
            <ContextSection factors={analysis.contextFactors} match={match} />
          </div>

          {/* PROBABILITÉS */}
          <div className="rounded-2xl border border-surface-line bg-night-soft p-6 mb-5">
            <SectionTitle>Probabilités de victoire.</SectionTitle>
            <div className="flex flex-col gap-4">
              <ProbRow label={`Victoire ${match.homeTeam.name}`} pct={analysis.winProbabilities.homeWinPct} color="bg-orange" />
              <ProbRow label="Match serré" pct={analysis.winProbabilities.closeGamePct} color="bg-bone-dim" />
              <ProbRow label={`Victoire ${match.awayTeam.name}`} pct={analysis.winProbabilities.awayWinPct} color="bg-red" />
            </div>
          </div>

          {/* VERDICT */}
          <div className="rounded-2xl border-l-[3px] border-orange bg-surface px-6 py-6 mb-5">
            <p className="mb-3 font-display text-[9px] uppercase tracking-[0.25em] text-orange">Verdict HOOPIUM</p>
            <p className="text-sm leading-relaxed text-bone">{personalizeText(analysis.verdict, match)}</p>
          </div>



        </div>
      </div>

      {/* ── NAV ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-surface-line bg-night/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-around px-6 py-2.5">
          <Link href="/matchs" className="flex flex-col items-center gap-0.5 px-4 py-1 text-bone-dim transition hover:text-bone">
            <span className="text-base leading-none">▦</span>
            <span className="text-[9px] uppercase tracking-wider">Matchs</span>
          </Link>
          <span className="flex flex-col items-center gap-0.5 px-4 py-1 text-orange">
            <span className="text-base leading-none">↑↓</span>
            <span className="text-[9px] uppercase tracking-wider">Analyse</span>
          </span>
          <Link href="/historique" className="flex flex-col items-center gap-0.5 px-4 py-1 text-bone-dim transition hover:text-bone">
            <span className="text-base leading-none">↺</span>
            <span className="text-[9px] uppercase tracking-wider">Historique</span>
          </Link>
          <Link href="/tarifs" className="flex flex-col items-center gap-0.5 px-4 py-1 text-bone-dim transition hover:text-bone">
            <span className="text-base leading-none">⚙</span>
            <span className="text-[9px] uppercase tracking-wider">Paramètres</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
