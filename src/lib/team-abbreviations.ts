/**
 * Abréviations officielles des 30 équipes NBA, vérifiées (ESPN —
 * https://hoopr.sportsdataverse.org/reference/espn_nba_teams.html), pas
 * une formule devinée. Avant ce fichier, l'abréviation des matchs en
 * direct était calculée avec name.slice(0,3) — donnait "LOS" pour
 * "Los Angeles Lakers" au lieu de "LAL".
 *
 * Pas de formule générale possible : LAL vs LAC ou GSW ne se déduisent pas
 * des 3 premières lettres du nom. Une vraie table est nécessaire.
 *
 * Couvre uniquement la NBA — les autres ligues (WNBA, EuroLeague, NCAA)
 * gardent le calcul par défaut en attendant une vérification équivalente.
 */
export const NBA_TEAM_ABBREVIATIONS: Record<string, string> = {
  'Atlanta Hawks': 'ATL',
  'Boston Celtics': 'BOS',
  'Brooklyn Nets': 'BKN',
  'Charlotte Hornets': 'CHA',
  'Chicago Bulls': 'CHI',
  'Cleveland Cavaliers': 'CLE',
  'Dallas Mavericks': 'DAL',
  'Denver Nuggets': 'DEN',
  'Detroit Pistons': 'DET',
  'Golden State Warriors': 'GSW',
  'Houston Rockets': 'HOU',
  'Indiana Pacers': 'IND',
  'Los Angeles Clippers': 'LAC',
  'Los Angeles Lakers': 'LAL',
  'Memphis Grizzlies': 'MEM',
  'Miami Heat': 'MIA',
  'Milwaukee Bucks': 'MIL',
  'Minnesota Timberwolves': 'MIN',
  'New Orleans Pelicans': 'NOP',
  'New York Knicks': 'NYK',
  'Oklahoma City Thunder': 'OKC',
  'Orlando Magic': 'ORL',
  'Philadelphia 76ers': 'PHI',
  'Phoenix Suns': 'PHX',
  'Portland Trail Blazers': 'POR',
  'Sacramento Kings': 'SAC',
  'San Antonio Spurs': 'SAS',
  'Toronto Raptors': 'TOR',
  'Utah Jazz': 'UTA',
  'Washington Wizards': 'WAS',
};

/**
 * Abréviation d'une équipe à partir de son nom complet. Utilise la table
 * officielle si l'équipe est NBA et connue, sinon retombe sur l'ancien
 * calcul (3 premières lettres) — jamais d'abréviation inventée pour une
 * équipe NBA connue, mais pas de blocage pour les autres ligues.
 */
export function teamAbbreviation(name: string): string {
  return NBA_TEAM_ABBREVIATIONS[name] ?? name.slice(0, 3).toUpperCase();
}
