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
      <div className="grid gap-3 md:grid-cols-3">
        {markets.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelected(m)}
            className="flex flex-col gap-2 rounded-xl border border-surface-line bg-night-soft/80 p-4 text-left transition hover:border-orange-dim hover:bg-surface"
          >
            <span className="text-xs uppercase tracking-wide text-bone-dim">{m.label}</span>
            <span className="font-display text-xl font-bold">{personalizeText(m.line, match)}</span>
            <span className="text-[12px] leading-snug text-bone-dim">{personalizeText(m.teaser, match)}</span>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded bg-surface-line">
                <div className="h-full rounded bg-orange" style={{ width: `${m.confidence}%` }} />
              </div>
              <span className="font-display text-xs font-semibold text-orange">{m.confidence}%</span>
            </div>
          </button>
        ))}
      </div>

      <AnalysisOverlay open={!!selected} onClose={() => setSelected(null)} title={selected?.label ?? ''}>
        {selected && (
          <div className="flex flex-col gap-4">
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
