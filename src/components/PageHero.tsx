interface PageHeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** contenu optionnel affiché à droite du titre (stats, CTA...) */
  aside?: React.ReactNode;
}

/**
 * En-tête de page partagé entre Matchs / Historique / Tarifs, pour garder
 * la même identité visuelle (fond terrain + dégradé) que la page d'accueil
 * plutôt qu'un simple bandeau de texte sur fond uni.
 */
export function PageHero({ eyebrow, title, subtitle, aside }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-surface-line px-6 py-20 md:px-12">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center opacity-[0.18] saturate-[0.7]"
        style={{ backgroundImage: "url('/images/terrain.jpg')" }}
      />
      <div className="absolute inset-0 -z-[5] bg-gradient-to-b from-night/40 via-night/70 to-night" />

      <div className="relative z-10 flex flex-wrap items-end justify-between gap-8">
        <div>
          <p className="mb-4 font-display text-xs uppercase tracking-[2px] text-orange">
            — {eyebrow}
          </p>
          <h1 className="max-w-2xl text-[clamp(32px,5vw,48px)] font-bold leading-tight tracking-tight">
            {title}
          </h1>
          <p className="mt-4 max-w-md text-sm text-bone-dim">{subtitle}</p>
        </div>
        {aside}
      </div>
    </section>
  );
}
