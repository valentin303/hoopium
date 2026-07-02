'use client';

import { useState } from 'react';
import { AnalysisOverlay } from './AnalysisOverlay';
import type { HeadToHeedGame, Match } from '@/types';

export function HeadToHeadSection({ games, match }: { games: HeadToHeedGame[]; match: Match }) {
  const [open, setOpen] = useState(false);
  const homeWins = games.filter((g) => g.homeTeamWon).length;

  return (
    <div>
      <div className="mb-4 flex items-center gap-6">
        <div className="text-center">
          <div className="font-display text-3xl font-black text-bone">{homeWins}</div>
          <div className="text-[9px] uppercase tracking-widest text-bone-dim">{match.homeTeam.name}</div>
        </div>
        <div className="flex-1 h-px bg-surface-line" />
        <div className="text-center">
          <div className="font-display text-3xl font-black text-bone-dim">{games.length - homeWins}</div>
          <div className="text-[9px] uppercase tracking-widest text-bone-dim">{match.awayTeam.name}</div>
        </div>
      </div>
      <div className="flex flex-col gap-2 mb-4">
        {games.slice(0, 5).map((g, i) => (
          <div key={i} className="flex items-center justify-between gap-2 rounded-xl border border-surface-line bg-surface px-3 py-3">
            <span className="text-[10px] text-bone-dim flex-shrink-0">{g.date}</span>
            <span className="font-display font-black text-sm tabular-nums flex-shrink-0 whitespace-nowrap">
              <span className={g.homeTeamWon ? 'text-bone' : 'text-bone-dim'}>{g.homeScore}</span>
              <span className="mx-1 text-surface-line">—</span>
              <span className={!g.homeTeamWon ? 'text-bone' : 'text-bone-dim'}>{g.awayScore}</span>
            </span>
            <span className="text-[9px] text-bone-dim text-right truncate">{g.venue}</span>
          </div>
        ))}
      </div>
      <button onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-surface-line py-3 text-xs font-bold uppercase tracking-widest text-bone-dim transition hover:border-orange-dim hover:text-orange">
        Voir les {games.length} confrontations →
      </button>
      <AnalysisOverlay open={open} onClose={() => setOpen(false)} title="Historique complet">
        <div className="flex flex-col gap-2">
          {games.map((g, i) => (
            <div key={i} className="flex items-center justify-between gap-2 rounded-xl border border-surface-line bg-surface px-3 py-3">
              <span className="text-[10px] text-bone-dim flex-shrink-0">{g.date}</span>
              <span className="font-display font-black text-sm tabular-nums flex-shrink-0 whitespace-nowrap">
                <span className={g.homeTeamWon ? 'text-bone' : 'text-bone-dim'}>{g.homeScore}</span>
                <span className="mx-1 text-surface-line">—</span>
                <span className={!g.homeTeamWon ? 'text-bone' : 'text-bone-dim'}>{g.awayScore}</span>
              </span>
              <span className="text-[9px] text-bone-dim text-right truncate">{g.venue}</span>
            </div>
          ))}
        </div>
      </AnalysisOverlay>
    </div>
  );
}
