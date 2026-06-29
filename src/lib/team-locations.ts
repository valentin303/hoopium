/**
 * Ville et décalage horaire (UTC, hors heure d'été) de chaque équipe du
 * mock. Faits publics bien établis (pas une estimation) — utilisés pour le
 * facteur "Déplacement" du contexte de match : l'écart de fuseau horaire
 * entre les deux villes, jamais une affirmation sur la fatigue réelle d'un
 * voyage qu'on ne peut pas vérifier (contrairement au mock d'origine qui
 * avançait un "+12% de fatigue" inventé).
 */

export const TEAM_LOCATIONS: Record<string, { city: string; utcOffset: number }> = {
  lal: { city: 'Los Angeles', utcOffset: -8 },
  bos: { city: 'Boston', utcOffset: -5 },
  den: { city: 'Denver', utcOffset: -7 },
  phx: { city: 'Phoenix', utcOffset: -7 },
  mia: { city: 'Miami', utcOffset: -5 },
  chi: { city: 'Chicago', utcOffset: -6 },
  gsw: { city: 'San Francisco', utcOffset: -8 },
  mil: { city: 'Milwaukee', utcOffset: -6 },
  phi: { city: 'Philadelphie', utcOffset: -5 },
  nyk: { city: 'New York', utcOffset: -5 },
  'ny-lib': { city: 'New York', utcOffset: -5 },
  'lv-aces': { city: 'Las Vegas', utcOffset: -8 },
  rma: { city: 'Madrid', utcOffset: 1 },
  bar: { city: 'Barcelone', utcOffset: 1 },
  duke: { city: 'Durham', utcOffset: -5 },
  ku: { city: 'Lawrence', utcOffset: -6 },
};
