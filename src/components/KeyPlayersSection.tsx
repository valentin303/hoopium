'use client';

import { useState } from 'react';
import { AnalysisOverlay } from './AnalysisOverlay';
import type { Match, PlayerStat } from '@/types';

const STATUS_DOT: Record<string, string> = {
  Absent: 'bg-red',
  Incertain: 'bg-orange',
  Probable: 'bg-green',
};

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="font-display text-xl font-bold text-orange">{value}</div>
      <div className="text-[9px] uppercase tracking-widest text-bone-dim">{label}</div>
    </div>
  );
}

function PlayerRow({ player, onSelect, align = 'left' }: {
  player: PlayerStat | undefined;
  onSelect: (p: PlayerStat) => void;
  align?: 'left' | 'right';
}) {
  if (!player) return <div />;
  const dot = player.injuryStatus ? STATUS_DOT[player.injuryStatus] ?? 'bg-green' : 'bg-green';
  return (
    <button onClick={() => onSelect(player)}
      className={`flex items-center gap-2.5 rounded-xl border border-surface-line bg-surface px-3 py-2.5 transition hover:border-orange-dim hover:bg-night-soft w-full ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${dot}`} />
      <div className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'}`}>
        <span className="text-sm font-bold text-bone">{player.name}</span>
        <span className="text-[10px] text-bone-dim">{player.position}</span>
      </div>
      {player.injuryStatus && (
        <span className={`ml-auto text-[9px] font-bold uppercase tracking-wide flex-shrink-0 ${
          player.injuryStatus === 'Absent' ? 'text-red' :
          player.injuryStatus === 'Incertain' ? 'text-orange' : 'text-green'
        }`}>{player.injuryStatus}</span>
      )}
    </button>
  );
}

export function KeyPlayersSection({ players, match }: { players: PlayerStat[]; match: Match }) {
  const [selected, setSelected] = useState<PlayerStat | null>(null);
  const homeP = players.filter((p) => p.teamSide === 'home');
  const awayP = players.filter((p) => p.teamSide === 'away');
  const maxRows = Math.max(homeP.length, awayP.length);

  return (
    <div>
      <div className="mb-4 flex items-center gap-5 text-[10px] uppercase tracking-widest text-bone-dim">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green" />Présent</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange" />Questionnable</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red" />Absent</span>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-widest">
        <span className="text-bone-dim">{match.homeTeam.name}</span>
        <span className="text-right text-bone-dim">{match.awayTeam.name}</span>
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: maxRows }).map((_, i) => (
          <div key={i} className="grid grid-cols-2 gap-3">
            <PlayerRow player={homeP[i]} onSelect={setSelected} />
            <PlayerRow player={awayP[i]} onSelect={setSelected} align="right" />
          </div>
        ))}
      </div>

      <AnalysisOverlay open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ''}>
        {selected && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-bone-dim">{selected.position}</span>
              {selected.injuryStatus && (
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  selected.injuryStatus === 'Absent' ? 'bg-red/10 text-red' :
                  selected.injuryStatus === 'Incertain' ? 'bg-orange-glow text-orange' :
                  'bg-green/10 text-green'
                }`}>{selected.injuryStatus}</span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-3 rounded-2xl border border-surface-line bg-surface p-5">
              <Stat label="Pts" value={selected.pointsPerGame} />
              <Stat label="Reb" value={selected.reboundsPerGame} />
              <Stat label="Ast" value={selected.assistsPerGame} />
              <Stat label="Min" value={selected.minutesPerGame} />
            </div>
            <p className="text-sm leading-relaxed text-bone">{selected.note}</p>
          </div>
        )}
      </AnalysisOverlay>
    </div>
  );
}
