'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AnalysisOverlay } from './AnalysisOverlay';
import { personalizeText } from '@/lib/personalize';
import type { BettingMarket, Match } from '@/types';

export function BettingMarketsSection({ markets, match }: { markets: BettingMarket[]; match: Match }) {
  const [selected, setSelected] = useState<BettingMarket | null>(null);

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {markets.map((m) => (
          <button key={m.id} onClick={() => setSelected(m)}
            className="flex flex-col gap-2 rounded-2xl border border-surface-line bg-surface p-4 text-left transition hover:border-orange-dim hover:bg-night-soft">
            <span className="text-[9px] font-bold uppercase tracking-widest text-bone-dim">{m.label}</span>
            <span className="font-display text-xl font-black leading-tight text-bone">{personalizeText(m.line, match)}</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] font-bold text-orange">Voir le détail →</span>
              <span className="text-[10px] font-bold text-bone-dim">{m.confidence}%</span>
            </div>
          </button>
        ))}
      </div>

      <AnalysisOverlay open={!!selected} onClose={() => setSelected(null)} title={selected?.label ?? ''}>
        {selected && (
          <div className="flex flex-col gap-5">
            <p className="text-sm text-bone">{personalizeText(selected.teaser, match)}</p>
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-line">
                <div className="h-full rounded-full bg-orange transition-all" style={{ width: `${selected.confidence}%` }} />
              </div>
              <span className="text-sm font-black text-orange">{selected.confidence}%</span>
            </div>
            <div className="rounded-2xl border border-surface-line bg-surface p-4">
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={selected.detail.trend.labels.map((l, i) => ({ label: l, value: selected.detail.trend.values[i] }))}>
                  <CartesianGrid stroke="#232323" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#6b6b68', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b6b68', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#161616', border: '1px solid #232323', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="value" stroke="#FF6B1A" strokeWidth={2.5} dot={{ r: 3, fill: '#FF6B1A' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm leading-relaxed text-bone">{personalizeText(selected.detail.explanation, match)}</p>
          </div>
        )}
      </AnalysisOverlay>
    </div>
  );
}
