'use client';

import { useState } from 'react';
import { AnalysisOverlay } from './AnalysisOverlay';
import { personalizeText } from '@/lib/personalize';
import type { ContextFactor, Match } from '@/types';

const ICONS: Record<ContextFactor['icon'], string> = {
  rest: '🛌',
  travel: '✈️',
  standing: '🏆',
  streak: '🔥',
};

export function ContextSection({ factors, match }: { factors: ContextFactor[]; match: Match }) {
  const [selected, setSelected] = useState<ContextFactor | null>(null);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {factors.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelected(f)}
            className="flex flex-col items-start gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-left transition hover:border-orange-500/40 hover:bg-zinc-800/60"
          >
            <span className="text-2xl">{ICONS[f.icon]}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{f.label}</span>
            <span className="text-sm font-black text-white">{f.value}</span>
            <span className="text-[10px] text-orange-400">Détail →</span>
          </button>
        ))}
      </div>

      <AnalysisOverlay open={!!selected} onClose={() => setSelected(null)} title={selected?.label ?? ''}>
        {selected && (
          <p className="text-sm leading-relaxed text-zinc-300">{personalizeText(selected.explanation, match)}</p>
        )}
      </AnalysisOverlay>
    </div>
  );
}
