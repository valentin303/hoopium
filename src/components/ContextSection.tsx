'use client';

import { useState } from 'react';
import { AnalysisOverlay } from './AnalysisOverlay';
import type { ContextFactor } from '@/types';

const ICONS: Record<ContextFactor['icon'], string> = {
  rest: '🛌',
  travel: '✈️',
  standing: '🏆',
  streak: '🔥',
};

export function ContextSection({ factors }: { factors: ContextFactor[] }) {
  const [selected, setSelected] = useState<ContextFactor | null>(null);

  return (
    <section>
      <h3 className="mb-4 font-display text-xs uppercase tracking-wider text-orange">
        — Contexte du match
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        {factors.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelected(f)}
            className="flex flex-col items-start gap-1.5 rounded-xl border border-surface-line bg-night-soft/80 p-4 text-left transition hover:border-orange-dim hover:bg-surface"
          >
            <span className="text-xl">{ICONS[f.icon]}</span>
            <span className="text-xs uppercase tracking-wide text-bone-dim">{f.label}</span>
            <span className="text-sm font-semibold">{f.value}</span>
          </button>
        ))}
      </div>

      <AnalysisOverlay open={!!selected} onClose={() => setSelected(null)} title={selected?.label ?? ''}>
        {selected && <p className="text-sm leading-relaxed text-bone-dim">{selected.explanation}</p>}
      </AnalysisOverlay>
    </section>
  );
}
