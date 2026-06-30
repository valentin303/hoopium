'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { AnalysisOverlay } from './AnalysisOverlay';
import { personalizeText } from '@/lib/personalize';
import type { BettingMarket, Match } from '@/types';

export function BettingMarketsSection({ markets, match }: { markets: BettingMarket[]; match: Match }) {
  const [selected, setSelected] = useState<BettingMarket | null>(null);

  return (
    <section>
      <h3 className="mb-1 font-display text-xs uppercase tracking-wider text-orange">
        — Marchés analysés
      </h3>
      <p className="mb-4 text-xs text-bone-dim">
        Lignes courantes et tendance HOOPIUM pour chaque marché — clique pour le détail.
      </p>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {markets.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelected(m)}
            className="flex flex-col gap-1.5 rounded-2xl border border-surface-line bg-night-soft/80 p-3 text-left transition hover:border-orange-dim hover:bg-surface sm:p-4"
          >
            <span className="text-[9px] uppercase tracking-wide text-bone-dim sm:text-[10px]">{m.label}</span>
            <span className="font-display text-base font-bold leading-tight sm:text-xl">{personalizeText(m.line, match)}</span>
            <span className="font-display text-[10px] font-semibold text-orange">Voir le détail →</span>
          </button>
        ))}
      </div>

      <AnalysisOverlay open={!!selected} onClose={() => setSelected(null)} title={selected?.label ?? ''}>
        {selected && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-sm text-bone-dim">{personalizeText(selected.teaser, match)}</p>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded bg-surface-line">
                  <div className="h-full rounded bg-orange" style={{ width: `${selected.confidence}%` }} />
                </div>
                <span className="font-display text-xs font-semibold text-orange">{selected.confidence}%</span>
              </div>
            </div>
            <div className="rounded-xl border border-surface-line bg-surface p-4">
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={selected.detail.trend.labels.map((l, i) => ({ label: l, value: selected.detail.trend.values[i] }))}>
                  <CartesianGrid stroke="#232323" />
                  <XAxis dataKey="label" tick={{ fill: '#6b6b68', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#6b6b68', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#161616', border: '1px solid #232323' }} />
                  <Line type="monotone" dataKey="value" stroke="#FF6B1A" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm leading-relaxed text-bone-dim">
              {personalizeText(selected.detail.explanation, match)}
            </p>
          </div>
        )}
      </AnalysisOverlay>
    </section>
  );
}
