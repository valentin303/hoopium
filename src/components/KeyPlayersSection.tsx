'use client';

import { useState } from 'react';
import { AnalysisOverlay } from './AnalysisOverlay';
import type { Match, PlayerStat } from '@/types';

const INJURY_STYLES: Record<string, string> = {
  Absent: 'text-red bg-red/10',
  Incertain: 'text-orange bg-orange-glow',
  Probable: 'text-green bg-green/10',
};

export function KeyPlayersSection({ players, match }: { players: PlayerStat[]; match: Match }) {
  const [selected, setSelected] = useState<PlayerStat | null>(null);
  const homeP = players.filter((p) => p.teamSide === 'home');
  const awayP = players.filter((p) => p.teamSide === 'away');

  return (
    <section>
      <h3 className="mb-4 font-display text-xs uppercase tracking-wider text-orange">
        — Joueurs clés
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        <PlayerColumn teamName={match.homeTeam.name} players={homeP} onSelect={setSelected} />
        <PlayerColumn teamName={match.awayTeam.name} players={awayP} onSelect={setSelected} />
      </div>

      <AnalysisOverlay open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ''}>
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-bone-dim">{selected.position}</span>
              {selected.injuryStatus && (
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${INJURY_STYLES[selected.injuryStatus] ?? ''}`}>
                  {selected.injuryStatus}
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-3 rounded-xl border border-surface-line bg-surface p-4 text-center">
              <Stat label="Pts" value={selected.pointsPerGame} />
              <Stat label="Reb" value={selected.reboundsPerGame} />
              <Stat label="Pas" value={selected.assistsPerGame} />
              <Stat label="Min" value={selected.minutesPerGame} />
            </div>
            <p className="text-sm leading-relaxed text-bone-dim">{selected.note}</p>
          </div>
        )}
      </AnalysisOverlay>
    </section>
  );
}

function PlayerColumn({
  teamName,
  players,
  onSelect,
}: {
  teamName: string;
  players: PlayerStat[];
  onSelect: (p: PlayerStat) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-bone-dim">{teamName}</span>
      {players.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p)}
          className="flex items-center justify-between rounded-xl border border-surface-line bg-night-soft/80 px-4 py-3 text-left transition hover:border-orange-dim hover:bg-surface"
        >
          <div>
            <div className="text-sm font-semibold">{p.name}</div>
            <div className="text-xs text-bone-dim">{p.position}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-display text-sm font-bold text-orange">{p.pointsPerGame} pts</span>
            {p.injuryStatus && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${INJURY_STYLES[p.injuryStatus] ?? ''}`}>
                {p.injuryStatus}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-display text-lg font-bold text-orange">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-bone-dim">{label}</div>
    </div>
  );
}
