import type { Match } from '@/types';

interface VerifiedMatchCardProps {
  match: Match;
  /** Confiance affichée avant le match, en % */
  preMatchConfidence: number;
  /** Taux de réussite global du site, en % */
  siteSuccessRate: number;
}

/**
 * Carte "preuve sociale" affichée dans le hero.
 *
 * Affiche volontairement un match de la VEILLE (déjà terminé), jamais un
 * match à venir : révéler le score d'un match futur reviendrait à donner
 * gratuitement l'information que HOOPIUM vend, et à spoiler les visiteurs
 * qui n'ont pas encore débloqué l'analyse correspondante.
 */
export function VerifiedMatchCard({
  match,
  preMatchConfidence,
  siteSuccessRate,
}: VerifiedMatchCardProps) {
  if (match.status !== 'finished' || !match.finalScore) {
    return null;
  }

  const winnerName =
    match.finalScore.home > match.finalScore.away
      ? match.homeTeam.name
      : match.awayTeam.name;

  return (
    <div className="relative rounded-3xl border border-surface-line bg-surface p-7">
      <span className="absolute -top-3.5 left-7 flex items-center gap-1.5 rounded-full bg-green px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-night">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
          <path d="M20 6L9 17l-5-5" />
        </svg>
        Vérifié hier
      </span>

      <div className="flex items-center justify-center gap-6 py-6">
        <TeamBadge abbreviation={match.homeTeam.abbreviation} name={match.homeTeam.name} />
        <div className="flex flex-col items-center gap-1 font-display text-xs text-bone-dim">
          <span className="text-[32px] font-bold tracking-tight text-orange">
            {match.finalScore.home} - {match.finalScore.away}
          </span>
          <span>FINAL</span>
        </div>
        <TeamBadge abbreviation={match.awayTeam.abbreviation} name={match.awayTeam.name} align="right" />
      </div>

      <div className="flex flex-col gap-3.5 border-t border-surface-line pt-4">
        <div className="flex items-center gap-3">
          <span className="flex-1 text-xs text-bone-dim">Confiance HOOPIUM avant le match</span>
          <div className="h-2 w-28 overflow-hidden rounded bg-night">
            <div
              className="h-full rounded bg-gradient-to-r from-orange-dim to-orange transition-[width] duration-1000"
              style={{ width: `${preMatchConfidence}%` }}
            />
          </div>
          <span className="font-display text-sm font-semibold">{preMatchConfidence}%</span>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-green/20 bg-green/10 px-3 py-2.5 text-[12.5px] leading-snug text-green">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="mt-0.5 flex-shrink-0">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          HOOPIUM avait prédit la victoire des {winnerName} — confirmée sur le terrain.
        </div>
      </div>

      <div className="pt-4 text-center text-xs text-bone-dim">
        Taux de réussite actuel :{' '}
        <span className="font-semibold text-orange">{siteSuccessRate}%</span> sur 500+
        analyses — mis à jour après chaque match.
      </div>
    </div>
  );
}

function TeamBadge({
  abbreviation,
  name,
  align = 'left',
}: {
  abbreviation: string;
  name: string;
  align?: 'left' | 'right';
}) {
  return (
    <div className={`flex flex-col items-center gap-2.5 ${align === 'right' ? 'order-3' : ''}`}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-surface-line bg-night font-display text-base font-bold text-orange">
        {abbreviation}
      </div>
      <span className="text-sm font-semibold text-bone">{name}</span>
    </div>
  );
}
