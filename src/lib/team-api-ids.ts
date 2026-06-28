/**
 * Mapping id interne ('lal', 'bos'...) -> vrai id numérique API-Basketball.
 *
 * Extrait de src/lib/teams-registry.json (déjà récupéré via
 * scripts/fetch-teams-registry.mjs) — aucune nouvelle requête nécessaire.
 * C'est ce qui permet d'appeler buildTeamSnapshotFromApi() avec le bon id
 * pour une équipe du mock.
 */
export const TEAM_API_IDS: Record<string, number> = {
  lal: 145, // Los Angeles Lakers
  bos: 133, // Boston Celtics
  den: 139, // Denver Nuggets
  phx: 155, // Phoenix Suns
  mia: 147, // Miami Heat
  chi: 136, // Chicago Bulls
  gsw: 141, // Golden State Warriors
  mil: 148, // Milwaukee Bucks
  phi: 154, // Philadelphia 76ers
  nyk: 151, // New York Knicks
  'ny-lib': 170, // New York Liberty
  'lv-aces': 167, // Las Vegas Aces
  rma: 2338, // Real Madrid
  bar: 2329, // Barcelona
  duke: 1890, // Duke
  ku: 1959, // Kansas
};
