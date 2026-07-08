import Image from 'next/image';
import { VerifiedMatchCard } from '@/components/VerifiedMatchCard';
import { MOCK_FINISHED_MATCHES, MOCK_SITE_STATS } from '@/lib/mock-data';

const LEAGUES = [
  { abv: 'NBA', name: 'NBA', count: '5 matchs analysés', logo: '/images/leagues/nba.svg' },
  { abv: 'WNBA', name: 'WNBA', count: '3 matchs analysés', logo: '/images/leagues/wnba.svg' },
  { abv: 'EL', name: 'EuroLeague', count: '2 matchs analysés', logo: '/images/leagues/euroleague.png' },
  { abv: 'NCAA', name: 'NCAA', count: 'Couverture en cours', logo: '/images/leagues/ncaa.svg' },
];

export default function HomePage() {
  const verifiedMatch = MOCK_FINISHED_MATCHES[0];

  return (
    <main className="flex-1">
      {/* ===== HERO ===== */}
      <section className="relative flex min-h-[78vh] items-center justify-center overflow-hidden px-6 pt-16 pb-10">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-[0.75] saturate-[0.8]"
          style={{ backgroundImage: "url('/images/terrain.jpg')" }}
        />
        <div className="absolute inset-0 -z-[5] bg-gradient-to-b from-night/55 via-night/30 to-night/75" />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-6 mt-7 inline-flex items-center gap-2 font-display text-[11px] uppercase tracking-[2px] text-orange">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange" />
              Analyse en direct · Taux de réussite publié après chaque match
            </div>

            <h1 className="max-w-xl text-[clamp(40px,6vw,78px)] font-bold leading-[0.98] tracking-tight">
              Les données <span className="text-orange">voient</span>{' '}
              <span className="text-transparent [-webkit-text-stroke:1px_var(--surface-line)]">
                ce que tu manques.
              </span>
            </h1>

            <p className="mt-6 max-w-md text-[17px] text-bone-dim">
              38 variables croisées par match. Un taux de réussite publié en temps réel,
              sans filtre. Tu lis, tu décides.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href="/matchs"
                className="rounded-full bg-orange px-8 py-4 text-[15px] font-semibold text-night transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                Voir les matchs du soir
              </a>
              <a
                href="/analyse/lal-bos-2026-06-17"
                className="rounded-full border border-orange-dim bg-orange-glow px-8 py-4 text-[15px] font-semibold text-orange transition hover:bg-orange hover:text-night"
              >
                Voir un exemple d'analyse
              </a>
              <a
                href="/a-propos"
                className="rounded-full border border-surface-line px-8 py-4 text-[15px] font-medium transition hover:border-bone-dim hover:bg-surface"
              >
                Comment ça marche
              </a>
            </div>
          </div>

          <VerifiedMatchCard
            match={verifiedMatch}
            preMatchConfidence={verifiedMatch.confidence}
            siteSuccessRate={MOCK_SITE_STATS.successRate}
          />
        </div>
      </section>

      {/* ===== BANDEAU LIGUES ===== */}
      <section className="overflow-hidden border-b border-surface-line bg-court py-9">
        <p className="mb-6 text-center font-display text-[11px] uppercase tracking-[2px] text-bone-dim">
          Ligues couvertes par l&apos;analyse HOOPIUM
        </p>
        {/* Marquee défilant — contenu dupliqué pour boucle infinie */}
        <div className="relative">
          <div className="animate-marquee flex w-max items-center gap-16 px-8">
            {[...LEAGUES, ...LEAGUES, ...LEAGUES].map((league, i) => (
              <div key={`${league.abv}-${i}`} className="flex flex-shrink-0 items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-surface-line bg-surface p-2">
                  <Image src={league.logo} alt={league.name} width={32} height={32} className="object-contain opacity-90" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{league.name}</div>
                  <span className="block text-[11px] text-bone-dim">{league.count}</span>
              </div>
            </div>
          ))}
          </div>
        </div>
      </section>
    </main>
  );
}
