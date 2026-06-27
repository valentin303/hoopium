'use client';

import Link from 'next/link';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/matchs', label: 'Matchs' },
  { href: '/historique', label: 'Historique' },
  { href: '/tarifs', label: 'Tarifs' },
  { href: '/a-propos', label: 'À propos' },
] as const;

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className={`fixed top-0 left-0 right-0 z-50 flex items-center gap-4 px-6 py-3 bg-gradient-to-b from-night/85 to-transparent transition-opacity ${
          open ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <button
          aria-label="Menu"
          onClick={() => setOpen(true)}
          className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10"
        >
          <span className="block h-[1.5px] w-[18px] rounded bg-bone" />
          <span className="block h-[1.5px] w-[18px] rounded bg-bone" />
          <span className="block h-[1.5px] w-[18px] rounded bg-bone" />
        </button>
        <Link href="/" className="font-display text-lg font-semibold tracking-tight">
          HOOP<span className="text-orange">IUM</span>
        </Link>
      </div>

      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[48] bg-black/60 backdrop-blur-sm transition-opacity ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-[49] flex w-[280px] flex-col bg-night-soft border-r border-surface-line py-6 transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-4 flex items-center justify-between border-b border-surface-line px-5 pb-6">
          <span className="font-display text-lg font-semibold tracking-tight">
            HOOP<span className="text-orange">IUM</span>
          </span>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-line text-bone-dim"
          >
            ✕
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-3 text-[15px] text-bone-dim transition hover:bg-surface hover:text-bone"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/tarifs"
          onClick={() => setOpen(false)}
          className="mx-3 mt-4 rounded-xl bg-orange py-3.5 text-center text-[15px] font-semibold text-night transition hover:opacity-90"
        >
          S&apos;abonner — 9,99€/mois
        </Link>
      </aside>
    </>
  );
}
