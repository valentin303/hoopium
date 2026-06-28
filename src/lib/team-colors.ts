/**
 * Couleurs d'équipe pour les graphiques de la page Analyse.
 *
 * Principe : l'équipe à domicile s'affiche dans sa couleur pleine, l'équipe
 * à l'extérieur dans une version ÉCLAIRCIE DE SA PROPRE COULEUR (pas une
 * couleur générique grise). Ça reproduit l'intuition "maillot domicile
 * foncé / maillot extérieur clair" sans dépendre du vrai maillot du soir
 * (impossible à connaître à l'avance — City Edition, Classic, etc.).
 *
 * Pourquoi l'éclaircissement et pas juste "couleur A vs couleur B" : deux
 * équipes peuvent partager la même couleur de base (Real Madrid/Barcelone
 * sont toutes les deux en bleu, Duke/Kansas en bleu) — décaler la luminosité
 * plutôt que la teinte garantit un contraste lisible quel que soit le
 * match, sans avoir à vérifier chaque paire d'équipes une par une.
 *
 * Couleurs vérifiées via recherche (sources officielles/team color codes),
 * pas devinées. Une équipe absente de cette table retombe sur le orange de
 * marque HOOPIUM (comportement actuel, jamais de couleur inventée).
 */

export const TEAM_COLORS: Record<string, string> = {
  lal: '#552583', // Lakers — violet
  bos: '#007A33', // Celtics — vert
  den: '#0E2240', // Nuggets — bleu marine
  phx: '#1D1160', // Suns — violet
  mia: '#98002E', // Heat — rouge
  chi: '#CE1141', // Bulls — rouge
  gsw: '#1D428A', // Warriors — bleu
  mil: '#00471B', // Bucks — vert
  phi: '#006BB6', // 76ers — bleu
  nyk: '#006BB6', // Knicks — bleu
  'ny-lib': '#6ECEB2', // Liberty — vert d'eau
  'lv-aces': '#BA0C2F', // Aces — rouge
  rma: '#00529F', // Real Madrid — bleu
  bar: '#A50044', // Barcelone — grenat (pas le bleu, qui clashe avec le Real Madrid)
  duke: '#003087', // Duke — bleu
  ku: '#E8000D', // Kansas — cramoisi (pas le bleu KU, qui clashe avec Duke)
};

const FALLBACK_HOME_COLOR = '#FF6B1A'; // orange de marque HOOPIUM
const FALLBACK_AWAY_COLOR = '#ffffff33'; // gris translucide (comportement actuel)

/** Éclaircit une couleur hex en la mélangeant avec du blanc (amount 0–1). */
function lighten(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount);
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

/** Couleur pleine pour l'équipe à domicile. */
export function homeTeamColor(teamId: string): string {
  return TEAM_COLORS[teamId] ?? FALLBACK_HOME_COLOR;
}

/** Couleur éclaircie (60%) de sa propre teinte pour l'équipe à l'extérieur. */
export function awayTeamColor(teamId: string): string {
  const base = TEAM_COLORS[teamId];
  if (!base) return FALLBACK_AWAY_COLOR;
  return lighten(base, 0.6);
}
