'use client';

import { useState } from 'react';
import { AnalysisOverlay } from './AnalysisOverlay';
import type { Match, PlayerStat } from '@/types';

const STATUS_DOT: Record<string, string> = {
  Absent: 'bg-red-500',
  Incertain: 'bg-orange-400',
  Probable: 'bg-green-400',
};

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-xl font-black text-orange-400">{value}</div>
      <div className="text-[9px] uppercase tracking-widest text-zinc-500">{label}</div>
    </div>
  );
}

function PlayerRow({ player, onSelect, align = 'left' }: {
  player: PlayerStat | undefined;
  onSelect: (p: PlayerStat) => void;
  align?: 'left' | 'right';
}) {
  if (!player) return <div />;
  const dot = player.injuryStatus ? STATUS_DOT[player.injuryStatus] ?? 'bg-green-400' : 'bg-green-400';
  return (
    <button
      onClick={() => onSelect(player)}
      className={`flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 transition hover:border-orange-500/40 hover:bg-zinc-800/60 w-full ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}
    >
      <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${dot}`} />
      <div className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'}`}>
        <span className="text-sm font-bold text-white">{player.name}</span>
        <span className="text-[10px] text-zinc-500">{player.position}</span>
      </div>
      {player.injuryStatus && (
        <span className={`ml-auto text-[9px] font-bold uppercase tracking-wide flex-shrink-0 ${
          player.injuryStatus === 'Absent' ? 'text-red-400' :
          player.injuryStatus === 'Incertain' ? 'text-orange-400' : 'text-green-400'
        }`}>
          {player.injuryStatus}
        </span>
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
      {/* Légende */}
      <div className="mb-4 flex items-center gap-4 text-[10px] uppercase tracking-widest text-zinc-500">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-400" />Présent</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-400" />Questionnable</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" />Absent</span>
      </div>

      {/* En-tête équipes */}
      <div className="mb-3 grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-widest">
        <span className="text-zinc-400">{match.homeTeam.name}</span>
        <span className="text-right text-zinc-400">{match.awayTeam.name}</span>
      </div>

      {/* Lignes joueurs */}
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
              <span className="text-sm text-zinc-400">{selected.position}</span>
              {selected.injuryStatus && (
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  selected.injuryStatus === 'Absent' ? 'bg-red-500/10 text-red-400' :
                  selected.injuryStatus === 'Incertain' ? 'bg-orange-500/10 text-orange-400' :
                  'bg-green-500/10 text-green-400'
                }`}>{selected.injuryStatus}</span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <Stat label="Pts" value={selected.pointsPerGame} />
              <Stat label="Reb" value={selected.reboundsPerGame} />
              <Stat label="Ast" value={selected.assistsPerGame} />
              <Stat label="Min" value={selected.minutesPerGame} />
            </div>
            <p className="text-sm leading-relaxed text-zinc-300">{selected.note}</p>
          </div>
        )}
      </AnalysisOverlay>
    </div>
  );
}
