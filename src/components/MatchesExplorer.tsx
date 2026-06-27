'use client';

import { useState, useMemo } from 'react';
import type { League, Match } from '@/types';
import { MatchCard } from './MatchCard';

const LEAGUE_OPTIONS: { value: League | 'all'; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'nba', label: 'NBA' },
  { value: 'wnba', label: 'WNBA' },
  { value: 'euroleague', label: 'EuroLeague' },
  { value: 'ncaa', label: 'NCAA' },
];

const CONFIDENCE_OPTIONS: { value: Match['confidenceLevel'] | null; label: string }[] = [
  { value: 'high', label: 'Haute' },
  { value: 'mid', label: 'Modérée' },
];

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

export function MatchesExplorer({ matches }: { matches: Match[] }) {
  const [league, setLeague] = useState<League | 'all'>('all');
  const [confidence, setConfidence] = useState<Match['confidenceLevel'] | null>(null);

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      const leagueOk = league === 'all' || m.league === league;
      const confOk = !confidence || m.confidenceLevel === confidence;
      return leagueOk && confOk;
    });
  }, [matches, league, confidence]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  return (
    <>
      <div className="flex flex-wrap gap-8 border-b border-surface-line px-6 py-5 md:px-12">
        <div className="flex flex-col gap-2.5">
          <span className="font-display text-[10px] uppercase tracking-wider text-bone-dim/70">
            Ligue
          </span>
          <div className="flex flex-wrap gap-2">
            {LEAGUE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLeague(opt.value)}
                className={`relative px-1 pb-2 font-display text-xs font-semibold uppercase tracking-wide transition after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:transition ${
                  league === opt.value
                    ? 'text-bone after:bg-orange'
                    : 'text-bone-dim after:bg-transparent hover:text-bone'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="font-display text-[10px] uppercase tracking-wider text-bone-dim/70">
            Confiance
          </span>
          <div className="flex flex-wrap gap-2">
            {CONFIDENCE_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => setConfidence(confidence === opt.value ? null : opt.value)}
                className={`relative px-1 pb-2 font-display text-xs font-semibold uppercase tracking-wide transition after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:transition ${
                  confidence === opt.value
                    ? 'text-bone after:bg-orange'
                    : 'text-bone-dim after:bg-transparent hover:text-bone'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[800px] flex-col gap-2 px-6 py-10 md:px-12">
        {grouped.size === 0 && (
          <p className="py-16 text-center text-sm text-bone-dim">
            Aucun match ne correspond à ces filtres
          </p>
        )}
        {Array.from(grouped.entries()).map(([day, dayMatches]) => (
          <div key={day}>
            <h3 className="mb-1 mt-7 font-display text-xs uppercase tracking-[2px] text-orange first:mt-0">
              {day}
            </h3>
            <div className="flex flex-col gap-3.5">
              {dayMatches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
