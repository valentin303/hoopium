'use client';

import { useState } from 'react';
import { AnalysisOverlay } from './AnalysisOverlay';
import type { HeadToHeedGame, Match } from '@/types';

export function HeadToHeadSection({ games, match }: { games: HeadToHeedGame[]; match: Match }) {
  const [open, setOpen] = useState(false);
  const homeWins = games.filter((g) => g.homeTeamWon).length;

  return (
    <section>
      <h3 className="mb-1 font-display text-xs uppercase tracking-wider text-orange">
        — Historique des confrontations
      </h3>
      <p className="mb-4 text-xs text-bone-dim">
        Bilan de {match.homeTeam.name} sur les confrontations directes (à domicile comme à
        l&apos;extérieur).
      </p>
      <div className="flex items-center justify-between rounded-xl border border-surface-line bg-night-soft/80 p-4">
        <div>
          <span className="font-display text-lg font-bold">
            {match.homeTeam.name} : {homeWins}V — {games.length - homeWins}D
          </span>
          <span className="ml-2 text-xs text-bone-dim">sur les {games.length} dernières rencontres</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-full border border-surface-line px-4 py-2 text-xs font-semibold transition hover:border-orange-dim hover:bg-surface"
        >
          Voir le détail
        </button>
      </div>

      <AnalysisOverlay open={open} onClose={() => setOpen(false)} title="Historique des confrontations">
        <div className="flex flex-col gap-2">
          {games.map((g, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-surface-line px-3 py-2.5 text-sm"
            >
              <span className="text-bone-dim">{g.date}</span>
              <span className="font-display font-semibold">
                <span className={g.homeTeamWon ? 'text-bone' : 'text-bone-dim'}>{g.homeScore}</span>
                {' — '}
                <span className={!g.homeTeamWon ? 'text-bone' : 'text-bone-dim'}>{g.awayScore}</span>
              </span>
              <span className="text-xs text-bone-dim">{g.venue}</span>
            </div>
          ))}
        </div>
      </AnalysisOverlay>
    </section>
  );
}
