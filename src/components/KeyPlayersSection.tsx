'use client';

import { useState } from 'react';
import { AnalysisOverlay } from './AnalysisOverlay';
import type { Match, PlayerStat } from '@/types';

const INJURY_STYLES: Record<string, string> = {
  Absent: 'text-red bg-red/10',
  Incertain: 'text-orange bg-orange-glow',
  Probable: 'text-green bg-green/10',
};

/** Couleur de puce façon mockup "Comparaison d'alignement" : disponibilité du joueur. */
const STATUS_DOT: Record<string, string> = {
  Absent: 'bg-red',
  Incertain: 'bg-orange',
  Probable: 'bg-green',
};
const STATUS_DOT_DEFAULT = 'bg-green'; // pas de souci connu = disponible

export function KeyPlayersSection({ players, match }: { players: PlayerStat[]; match: Match }) {
  const [selected, setSelected] = useState<PlayerStat | null>(null);
  const homeP = players.filter((p) => p.teamSide === 'home');
  const awayP = players.filter((p) => p.teamSide === 'away');
  const maxRows = Math.max(homeP.length, awayP.length);

  return (
    <section>
      <h3 className="mb-1 font-display text-xs uppercase tracking-wider text-orange">
        — Comparaison d&apos;alignement
      </h3>
      <p className="mb-4 text-xs text-bone-dim">
        Disponibilité estimée des joueurs clés — clique pour le détail.
      </p>
      <div className="rounded-2xl border border-surface-line bg-night-soft/80 p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-wide text-bone-dim">
          <span>{match.homeTeam.name}</span>
          <span>{match.awayTeam.name}</span>
        </div>
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: maxRows }).map((_, i) => (
            <div key={i} className="grid grid-cols-2 gap-3">
              <PlayerRow player={homeP[i]} onSelect={setSelected} />
              <PlayerRow player={awayP[i]} onSelect={setSelected} align="right" />
            </div>
          ))}
        </div>
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

function PlayerRow({
  player,
  onSelect,
  align = 'left',
}: {
  player: PlayerStat | undefined;
  onSelect: (p: PlayerStat) => void;
  align?: 'left' | 'right';
}) {
  if (!player) return <div />;
  const dotColor = player.injuryStatus ? STATUS_DOT[player.injuryStatus] ?? STATUS_DOT_DEFAULT : STATUS_DOT_DEFAULT;

  return (
    <button
      onClick={() => onSelect(player)}
      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-surface ${
        align === 'right' ? 'flex-row-reverse text-right' : ''
      }`}
    >
      <span className={`h-2 w-2 flex-shrink-0 rounded-full ${dotColor}`} />
      <span className="truncate text-[13px] font-medium">{player.name}</span>
    </button>
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
