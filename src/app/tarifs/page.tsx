import { PageHero } from '@/components/PageHero';

const FAQ = [
  {
    q: 'Est-ce que HOOPIUM donne des conseils de pari ?',
    a: "Non. HOOPIUM analyse les données statistiques d'un match et présente des probabilités factuelles. Nous ne formulons jamais de recommandation de mise et ne sommes affiliés à aucun opérateur de jeux.",
  },
  {
    q: 'Puis-je résilier à tout moment ?',
    a: "Oui, l'abonnement est sans engagement. Tu peux résilier en un clic depuis ton compte, sans justification et sans frais.",
  },
  {
    q: 'Quelles ligues sont couvertes ?',
    a: 'NBA en priorité, avec WNBA, EuroLeague et NCAA disponibles pour les abonnés illimités.',
  },
];

export default function TarifsPage() {
  return (
    <main className="flex-1 pt-16">
      <PageHero
        eyebrow="Accès"
        title="Paye le match, ou paye plus jamais"
        subtitle="Pas d'engagement caché. Tu testes à l'unité, ou tu prends l'accès complet. Résiliation en un clic, à tout moment."
      />

      <section className="px-6 py-16 md:px-12">
        <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-surface-line bg-surface p-9">
            <p className="font-display text-[11px] uppercase tracking-wide text-bone-dim">
              À l&apos;unité
            </p>
            <p className="mt-3 text-[34px] font-bold tracking-tight">
              0,99€<span className="text-sm font-medium text-bone-dim"> / analyse</span>
            </p>
            <ul className="mt-7 flex flex-col gap-3.5 text-sm text-bone-dim">
              <Feature>Une analyse complète au choix</Feature>
              <Feature>Accès immédiat après paiement</Feature>
              <Feature>Sans création de compte engageante</Feature>
              <Feature>Idéal pour tester avant de t&apos;abonner</Feature>
            </ul>
            <a
              href="/matchs"
              className="mt-8 block rounded-full border border-surface-line py-3.5 text-center text-sm font-semibold transition hover:bg-night-soft"
            >
              Choisir un match
            </a>
          </div>

          <div className="rounded-3xl border border-orange-dim bg-gradient-to-br from-court to-surface p-9">
            <p className="font-display text-[11px] uppercase tracking-wide text-orange">
              Illimité
            </p>
            <p className="mt-3 text-[34px] font-bold tracking-tight">
              9,99€<span className="text-sm font-medium text-bone-dim"> / mois</span>
            </p>
            <ul className="mt-7 flex flex-col gap-3.5 text-sm text-bone-dim">
              <Feature>Toutes les analyses, toutes les ligues</Feature>
              <Feature>NBA, WNBA, EuroLeague, NCAA et plus</Feature>
              <Feature>Historique complet consultable</Feature>
              <Feature>Visuels prêts à partager sur tes réseaux</Feature>
              <Feature>Résiliable à tout moment, sans frais</Feature>
            </ul>
            <button className="mt-8 block w-full rounded-full bg-orange py-3.5 text-center text-sm font-bold text-night transition hover:opacity-90">
              S&apos;abonner maintenant
            </button>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 md:px-12">
        <p className="mb-8 font-display text-xs uppercase tracking-[2px] text-orange">
          Questions fréquentes
        </p>
        <div className="mx-auto flex max-w-2xl flex-col">
          {FAQ.map((item) => (
            <div key={item.q} className="border-b border-surface-line py-6">
              <p className="mb-2 text-[16px] font-semibold">{item.q}</p>
              <p className="text-sm leading-relaxed text-bone-dim">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="text-orange">—</span>
      {children}
    </li>
  );
}
