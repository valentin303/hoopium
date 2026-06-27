'use client';

import { useState, useMemo } from 'react';
import { TeamLogo } from './TeamLogo';
import type { Match } from '@/types';

type ResultFilter = 'all' | 'correct' | 'wrong';

function groupByDay(matches: Match[]) {
  const groups = new Map<string, Match[]>();
  for (const match of matches) {
    const day = new Date(match.startTime).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const list = groups.get(day) ?? [];
    list.push(match);
    groups.set(day, list);
  }
  return groups;
}

export function HistoryExplorer({ matches }: { matches: Match[] }) {
  const [filter, setFilter] = useState<ResultFilter>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return matches;
    return matches.filter((m) =>
      filter === 'correct' ? m.predictionCorrect : m.predictionCorrect === false
    );
  }, [matches, filter]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  return (
    <>
      <div className="flex flex-wrap gap-2.5 border-b border-surface-line px-6 py-5 md:px-12">
        <span className="mr-2 self-center font-display text-[10px] uppercase tracking-wider text-bone-dim/70">
          Résultat
        </span>
        {([
          ['all', 'Tous'],
          ['correct', 'Justes'],
          ['wrong', 'Ratées'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`relative px-1 pb-2 font-display text-xs font-semibold uppercase tracking-wide transition after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:transition ${
              filter === value
                ? 'text-bone after:bg-orange'
                : 'text-bone-dim after:bg-transparent hover:text-bone'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mx-auto flex max-w-[800px] flex-col gap-2 px-6 py-10 md:px-12">
        {grouped.size === 0 && (
          <p className="py-16 text-center text-sm text-bone-dim">
            Aucun résultat ne correspond à ce filtre
          </p>
        )}
        {Array.from(grouped.entries()).map(([day, dayMatches]) => (
          <div key={day}>
            <h3 className="mb-1 mt-7 font-display text-xs uppercase tracking-[2px] text-orange first:mt-0">
              {day}
            </h3>
            <div className="flex flex-col gap-3.5">
              {dayMatches.map((m) => (
                <FinishedMatchRow key={m.id} match={m} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function FinishedMatchRow({ match }: { match: Match }) {
  if (!match.finalScore) return null;
  const homeWon = match.finalScore.home > match.finalScore.away;
  const correct = match.predictionCorrect;

  return (
    <div className="group relative flex overflow-hidden rounded-lg border border-surface-line bg-surface/70">
      <span className={`w-1 flex-shrink-0 ${correct ? 'bg-green' : 'bg-red'}`} />

      <div className="flex flex-1 items-center gap-6 px-6 py-4">
        <div className="flex w-14 flex-shrink-0 flex-col gap-1">
          <span className="font-display text-[11px] font-bold uppercase leading-none text-bone-dim">Terminé</span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-bone-dim/70">
            {match.league.toUpperCase()}
          </span>
        </div>

        <div className="h-9 w-px flex-shrink-0 bg-surface-line" />

        <div className="flex flex-1 items-center gap-4">
          <ScoreBlock team={match.homeTeam} score={match.finalScore.home} winner={homeWon} />
          <span className="flex-shrink-0 font-display text-[10px] text-bone-dim/50">F</span>
          <ScoreBlock team={match.awayTeam} score={match.finalScore.away} winner={!homeWon} align="right" />
        </div>

        <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
          <span className={`flex items-center gap-1.5 font-display text-sm font-bold ${correct ? 'text-green' : 'text-red'}`}>
            {correct ? '✓ Juste' : '✕ Ratée'}
          </span>
          <span className="text-[10px] text-bone-dim">
            {match.confidence}% sur {match.predictedWinnerId === match.homeTeam.id ? match.homeTeam.name : match.awayTeam.name}
          </span>
        </div>
      </div>
    </div>
  );
}

function ScoreBlock({
  team,
  score,
  winner,
  align = 'left',
}: {
  team: Match['homeTeam'];
  score: number;
  winner: boolean;
  align?: 'left' | 'right';
}) {
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-3 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
      <TeamLogo team={team} size={40} />
      <div className={`flex min-w-0 items-baseline gap-2.5 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        <span className={`truncate text-[14px] font-bold ${winner ? 'text-bone' : 'text-bone-dim'}`}>{team.name}</span>
        <span className={`font-display text-2xl font-bold leading-none ${winner ? 'text-bone' : 'text-bone-dim'}`}>
          {score}
        </span>
      </div>
    </div>
  );
}
