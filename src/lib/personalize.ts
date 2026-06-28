import type { Match } from '@/types';

/**
 * Remplace les placeholders {home} / {away} par les vrais noms d'équipes.
 *
 * Pourquoi des placeholders plutôt qu'un remplacement de tournures génériques
 * ("l'équipe à domicile" -> nom de l'équipe) : les noms d'équipes US se
 * traitent comme un pluriel en français ("Les Lakers arrivent", pas "arrive"),
 * donc un remplacement naïf casse l'accord du verbe. Les textes sources
 * doivent être écrits directement avec {home}/{away} et l'accord correct.
 */
export function personalizeText(text: string, match: Match): string {
  return text.replace(/\{home\}/g, match.homeTeam.name).replace(/\{away\}/g, match.awayTeam.name);
}
