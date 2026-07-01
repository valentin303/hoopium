'use client';

import { useState } from 'react';
import { AnalysisOverlay } from './AnalysisOverlay';
import type { HeadToHeedGame, Match } from '@/types';

export function HeadToHeadSection({ games, match }: { games: HeadToHeedGame[]; match: Match }) {
  const [open, setOpen] = useState(false);
  const homeWins = games.filter((g) => g.homeTeamWon).length;
  const preview = games.slice(0, 5);

  return (
    <div>
      {/* Bilan résumé */}
      <div className="mb-4 flex items-center gap-6">
        <div className="text-center">
          <div className="text-3xl font-black text-white">{homeWins}</div>
          <div className="text-[9px] uppercase tracking-widest text-zinc-500">{match.homeTeam.name}</div>
        </div>
        <div className="flex-1 h-px bg-zinc-800" />
        <div className="text-center">
          <div className="text-3xl font-black text-zinc-500">{games.length - homeWins}</div>
          <div className="text-[9px] uppercase tracking-widest text-zinc-500">{match.awayTeam.name}</div>
        </div>
      </div>

      {/* Preview 5 derniers */}
      <div className="flex flex-col gap-2 mb-4">
        {preview.map((g, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
            <span className="text-xs text-zinc-500 w-28">{g.date}</span>
            <span className="font-black text-base tabular-nums">
              <span className={g.homeTeamWon ? 'text-white' : 'text-zinc-600'}>{g.homeScore}</span>
              <span className="mx-2 text-zinc-700">—</span>
              <span className={!g.homeTeamWon ? 'text-white' : 'text-zinc-600'}>{g.awayScore}</span>
            </span>
            <span className="text-[10px] text-zinc-600 text-right w-28">{g.venue}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-zinc-800 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 transition hover:border-orange-500/40 hover:text-orange-400"
      >
        Voir les {games.length} confrontations →
      </button>

      <AnalysisOverlay open={open} onClose={() => setOpen(false)} title="Historique complet">
        <div className="flex flex-col gap-2">
          {games.map((g, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
              <span className="text-xs text-zinc-500 w-28">{g.date}</span>
              <span className="font-black text-base tabular-nums">
                <span className={g.homeTeamWon ? 'text-white' : 'text-zinc-600'}>{g.homeScore}</span>
                <span className="mx-2 text-zinc-700">—</span>
                <span className={!g.homeTeamWon ? 'text-white' : 'text-zinc-600'}>{g.awayScore}</span>
              </span>
              <span className="text-[10px] text-zinc-600 text-right w-28">{g.venue}</span>
            </div>
          ))}
        </div>
      </AnalysisOverlay>
    </div>
  );
}
