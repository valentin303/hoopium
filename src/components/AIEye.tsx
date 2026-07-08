'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * L'œil de l'IA — verdict écrit en direct, effet machine à écrire.
 * Se déclenche quand `active` passe à true (déblocage de l'analyse).
 */
export function AIEye({ text, variablesUsed, active }: { text: string; variablesUsed: number; active: boolean }) {
  const [shown, setShown] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(timer);
    }, 18);
    return () => clearInterval(timer);
  }, [active, text]);

  const done = shown.length >= text.length;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-orange-dim bg-night-soft p-7"
      style={{ background: 'linear-gradient(160deg, rgba(255,107,26,.06), transparent 40%), var(--night-soft)' }}>
      {/* Badge */}
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange px-4 py-1.5 font-display text-[11px] font-bold uppercase tracking-widest text-night">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-night" />
        L&apos;œil de l&apos;IA
      </div>

      {/* Texte tapé en direct */}
      <p className="min-h-[96px] text-base leading-relaxed text-bone">
        {shown}
        {!done && <span className="ml-0.5 inline-block h-[1.1em] w-[2px] animate-pulse bg-orange align-[-2px]" />}
      </p>

      {/* Méta */}
      <div className="mt-4 flex flex-wrap gap-5 border-t border-surface-line pt-4 text-xs text-bone-dim">
        <span>Données croisées : <b className="text-bone">{variablesUsed}</b></span>
        <span>Modèle : <b className="text-bone">Hoopium v2</b></span>
        <span>Mis à jour : <b className="text-bone">il y a 2h</b></span>
      </div>
    </div>
  );
}
