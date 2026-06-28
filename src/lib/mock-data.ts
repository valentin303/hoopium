import type { Match, MatchAnalysis, SiteStats, Team } from '@/types';
import teamLogos from './team-logos.json';

/**
 * Données de démonstration.
 *
 * Utilisées tant que NBA_API_KEY n'est pas configurée, ou en fallback si
 * l'API tombe en erreur. Reprend les mêmes matchs que le prototype HTML
 * pour garder une cohérence visuelle pendant la migration.
 */

/**
 * Logos résolus via scripts/fetch-team-logos.mjs (voir src/lib/team-logos.json).
 * Une équipe absente de ce mapping retombe simplement sur les initiales —
 * géré nativement par le composant TeamLogo, jamais de logo halluciné.
 */
const logos: Record<string, string> = teamLogos;
const logoFor = (id: string): string | undefined => logos[id];

const lakers: Team = {
  id: 'lal',
  name: 'Lakers',
  abbreviation: 'LAL',
  record: '12V — 3D cette saison',
  form: { results: ['w', 'w', 'l', 'w', 'w'] },
  logoUrl: logoFor('lal'),
};

const celtics: Team = {
  id: 'bos',
  name: 'Celtics',
  abbreviation: 'BOS',
  record: '9V — 6D cette saison',
  form: { results: ['l', 'w', 'l', 'l', 'w'] },
  logoUrl: logoFor('bos'),
};

const nuggets: Team = {
  id: 'den',
  name: 'Nuggets',
  abbreviation: 'DEN',
  record: '13V — 2D cette saison',
  form: { results: ['w', 'w', 'w', 'l', 'w'] },
  logoUrl: logoFor('den'),
};

const suns: Team = {
  id: 'phx',
  name: 'Suns',
  abbreviation: 'PHX',
  record: '7V — 8D cette saison',
  form: { results: ['l', 'l', 'w', 'l', 'w'] },
  logoUrl: logoFor('phx'),
};

const heat: Team = {
  id: 'mia',
  name: 'Heat',
  abbreviation: 'MIA',
  record: '10V — 5D cette saison',
  form: { results: ['w', 'w', 'l', 'w', 'l'] },
  logoUrl: logoFor('mia'),
};

const bulls: Team = {
  id: 'chi',
  name: 'Bulls',
  abbreviation: 'CHI',
  record: '6V — 9D cette saison',
  form: { results: ['l', 'l', 'w', 'l', 'l'] },
  logoUrl: logoFor('chi'),
};

const warriors: Team = {
  id: 'gsw',
  name: 'Warriors',
  abbreviation: 'GSW',
  record: '9V — 6D cette saison',
  form: { results: ['w', 'l', 'w', 'w', 'l'] },
  logoUrl: logoFor('gsw'),
};

const bucks: Team = {
  id: 'mil',
  name: 'Bucks',
  abbreviation: 'MIL',
  record: '11V — 4D cette saison',
  form: { results: ['w', 'w', 'w', 'l', 'w'] },
  logoUrl: logoFor('mil'),
};

const sixers: Team = {
  id: 'phi',
  name: '76ers',
  abbreviation: 'PHI',
  record: '8V — 7D cette saison',
  form: { results: ['l', 'w', 'l', 'w', 'l'] },
  logoUrl: logoFor('phi'),
};

const knicks: Team = {
  id: 'nyk',
  name: 'Knicks',
  abbreviation: 'NYK',
  record: '10V — 5D cette saison',
  form: { results: ['w', 'l', 'w', 'w', 'w'] },
  logoUrl: logoFor('nyk'),
};

const liberty: Team = {
  id: 'ny-lib',
  name: 'Liberty',
  abbreviation: 'NY',
  record: '14V — 4D cette saison',
  form: { results: ['w', 'w', 'w', 'l', 'w'] },
  logoUrl: logoFor('ny-lib'),
};

const aces: Team = {
  id: 'lv-aces',
  name: 'Aces',
  abbreviation: 'LV',
  record: '13V — 5D cette saison',
  form: { results: ['w', 'l', 'w', 'w', 'l'] },
  logoUrl: logoFor('lv-aces'),
};

const realMadrid: Team = {
  id: 'rma',
  name: 'Real Madrid',
  abbreviation: 'RMA',
  record: '21V — 6D cette saison',
  form: { results: ['w', 'w', 'w', 'w', 'l'] },
  logoUrl: logoFor('rma'),
};

const barcelone: Team = {
  id: 'bar',
  name: 'Barcelone',
  abbreviation: 'BAR',
  record: '19V — 8D cette saison',
  form: { results: ['w', 'l', 'w', 'l', 'w'] },
  logoUrl: logoFor('bar'),
};

const duke: Team = {
  id: 'duke',
  name: 'Duke',
  abbreviation: 'DUKE',
  record: '24V — 5D cette saison',
  form: { results: ['w', 'w', 'l', 'w', 'w'] },
  logoUrl: logoFor('duke'),
};

const kansas: Team = {
  id: 'ku',
  name: 'Kansas',
  abbreviation: 'KU',
  record: '21V — 8D cette saison',
  form: { results: ['l', 'w', 'w', 'l', 'w'] },
  logoUrl: logoFor('ku'),
};

export const MOCK_UPCOMING_MATCHES: Match[] = [
  {
    id: 'lal-bos-2026-06-17',
    league: 'nba',
    startTime: '2026-06-17T21:30:00+02:00',
    homeTeam: lakers,
    awayTeam: celtics,
    confidence: 82,
    confidenceLevel: 'high',
    status: 'scheduled',
  },
  {
    id: 'den-phx-2026-06-17',
    league: 'nba',
    startTime: '2026-06-17T23:00:00+02:00',
    homeTeam: nuggets,
    awayTeam: suns,
    confidence: 88,
    confidenceLevel: 'high',
    status: 'scheduled',
  },
  {
    id: 'gsw-mia-2026-06-18',
    league: 'nba',
    startTime: '2026-06-18T02:00:00+02:00',
    homeTeam: warriors,
    awayTeam: heat,
    confidence: 64,
    confidenceLevel: 'mid',
    status: 'scheduled',
  },
  {
    id: 'mil-phi-2026-06-18',
    league: 'nba',
    startTime: '2026-06-18T22:00:00+02:00',
    homeTeam: bucks,
    awayTeam: sixers,
    confidence: 79,
    confidenceLevel: 'high',
    status: 'scheduled',
  },
  {
    id: 'nyk-chi-2026-06-19',
    league: 'nba',
    startTime: '2026-06-19T03:00:00+02:00',
    homeTeam: knicks,
    awayTeam: bulls,
    confidence: 71,
    confidenceLevel: 'high',
    status: 'scheduled',
  },
  {
    id: 'lib-aces-2026-06-20',
    league: 'wnba',
    startTime: '2026-06-20T21:00:00+02:00',
    homeTeam: liberty,
    awayTeam: aces,
    confidence: 81,
    confidenceLevel: 'high',
    status: 'scheduled',
  },
  {
    id: 'rma-bar-2026-06-20',
    league: 'euroleague',
    startTime: '2026-06-20T19:00:00+02:00',
    homeTeam: realMadrid,
    awayTeam: barcelone,
    confidence: 76,
    confidenceLevel: 'high',
    status: 'scheduled',
  },
  {
    id: 'duke-ku-2026-06-20',
    league: 'ncaa',
    startTime: '2026-06-20T20:30:00+02:00',
    homeTeam: duke,
    awayTeam: kansas,
    confidence: 58,
    confidenceLevel: 'mid',
    status: 'scheduled',
  },
];

export const MOCK_FINISHED_MATCHES: Match[] = [
  {
    id: 'mia-chi-2026-06-16',
    league: 'nba',
    startTime: '2026-06-16T20:00:00+02:00',
    homeTeam: heat,
    awayTeam: bulls,
    confidence: 74,
    confidenceLevel: 'high',
    status: 'finished',
    finalScore: { home: 108, away: 97 },
    predictionCorrect: true,
    predictedWinnerId: 'mia',
  },
  {
    id: 'bos-nyk-2026-06-15',
    league: 'nba',
    startTime: '2026-06-15T21:00:00+02:00',
    homeTeam: celtics,
    awayTeam: knicks,
    confidence: 61,
    confidenceLevel: 'mid',
    status: 'finished',
    finalScore: { home: 101, away: 109 },
    predictionCorrect: false,
    predictedWinnerId: 'bos',
  },
  {
    id: 'den-phx-2026-06-15',
    league: 'nba',
    startTime: '2026-06-15T23:00:00+02:00',
    homeTeam: nuggets,
    awayTeam: suns,
    confidence: 85,
    confidenceLevel: 'high',
    status: 'finished',
    finalScore: { home: 118, away: 105 },
    predictionCorrect: true,
    predictedWinnerId: 'den',
  },
  {
    id: 'lib-aces-2026-06-15',
    league: 'wnba',
    startTime: '2026-06-15T20:00:00+02:00',
    homeTeam: liberty,
    awayTeam: aces,
    confidence: 70,
    confidenceLevel: 'high',
    status: 'finished',
    finalScore: { home: 89, away: 82 },
    predictionCorrect: true,
    predictedWinnerId: 'ny-lib',
  },
  {
    id: 'rma-bar-2026-06-14',
    league: 'euroleague',
    startTime: '2026-06-14T19:00:00+02:00',
    homeTeam: realMadrid,
    awayTeam: barcelone,
    confidence: 64,
    confidenceLevel: 'mid',
    status: 'finished',
    finalScore: { home: 79, away: 84 },
    predictionCorrect: false,
    predictedWinnerId: 'rma',
  },
];

export const MOCK_SITE_STATS: SiteStats = {
  successRate: 66,
  totalAnalyses: 512,
  correctPredictions: 338,
  wrongPredictions: 174,
};

export const MOCK_ANALYSIS: MatchAnalysis = {
  match: MOCK_UPCOMING_MATCHES[0],
  totalPointsPredicted: 221,
  spreadPredicted: 8.5,
  variablesUsed: 38,
  statsComparison: [
    { label: 'Pts / match', homeValue: 118.4, awayValue: 112.1, leagueAverage: 114.2, betterSide: 'home' },
    { label: 'Rating offensif', homeValue: 118.2, awayValue: 113.5, leagueAverage: 114.8, betterSide: 'home' },
    { label: 'Rating défensif', homeValue: 108.4, awayValue: 111.2, leagueAverage: 114.1, betterSide: 'home' },
    { label: '% à 3 pts', homeValue: '38.2%', awayValue: '34.1%', leagueAverage: '36.1%', betterSide: 'home' },
    { label: 'Rebonds / match', homeValue: 44.3, awayValue: 41.8, leagueAverage: 43.1, betterSide: 'home' },
    { label: 'Passes déc.', homeValue: 26.1, awayValue: 28.4, leagueAverage: 25.9, betterSide: 'away' },
    { label: 'Turnovers', homeValue: 12.4, awayValue: 13.8, leagueAverage: 13.5, betterSide: 'home' },
  ],
  scoringTrend: {
    labels: ['M-10', 'M-9', 'M-8', 'M-7', 'M-6', 'M-5', 'M-4', 'M-3', 'M-2', 'Dernier'],
    homeValues: [112, 124, 108, 119, 131, 116, 122, 128, 115, 124],
    awayValues: [108, 115, 119, 104, 112, 120, 108, 116, 110, 112],
  },
  radarProfile: {
    labels: ['Attaque', 'Défense', 'Rebonds', 'Passes', 'Forme', 'Domicile'],
    homeValues: [88, 82, 75, 78, 85, 90],
    awayValues: [80, 85, 72, 82, 60, 70],
  },
  headToHead: {
    labels: ['2024', '2024', '2023', '2023', '2023'],
    homeValues: [112, 98, 108, 115, 103],
    awayValues: [104, 110, 99, 108, 118],
  },
  headToHeadDetailed: [
    { date: '12 mars 2026', homeScore: 112, awayScore: 104, homeTeamWon: true, venue: 'Crypto.com Arena' },
    { date: '18 jan. 2026', homeScore: 98, awayScore: 110, homeTeamWon: false, venue: 'TD Garden' },
    { date: '2 déc. 2025', homeScore: 108, awayScore: 99, homeTeamWon: true, venue: 'Crypto.com Arena' },
    { date: '15 avr. 2025', homeScore: 115, awayScore: 108, homeTeamWon: true, venue: 'TD Garden' },
    { date: '20 fév. 2025', homeScore: 103, awayScore: 118, homeTeamWon: false, venue: 'Crypto.com Arena' },
    { date: '8 jan. 2025', homeScore: 121, awayScore: 117, homeTeamWon: true, venue: 'TD Garden' },
    { date: '19 nov. 2024', homeScore: 109, awayScore: 102, homeTeamWon: true, venue: 'Crypto.com Arena' },
    { date: '30 mars 2024', homeScore: 95, awayScore: 113, homeTeamWon: false, venue: 'TD Garden' },
    { date: '14 fév. 2024', homeScore: 118, awayScore: 111, homeTeamWon: true, venue: 'Crypto.com Arena' },
    { date: '25 déc. 2023', homeScore: 106, awayScore: 120, homeTeamWon: false, venue: 'TD Garden' },
  ],
  keyPlayers: [
    {
      id: 'kp-1', name: 'A. Davis', position: 'Ailier-fort', teamSide: 'home',
      pointsPerGame: 26.8, reboundsPerGame: 11.2, assistsPerGame: 3.4, minutesPerGame: 35.1,
      injuryStatus: null,
      note: 'Auteur de 30+ points lors de 4 des 5 derniers matchs à domicile.',
    },
    {
      id: 'kp-2', name: 'L. James', position: 'Ailier', teamSide: 'home',
      pointsPerGame: 24.1, reboundsPerGame: 7.8, assistsPerGame: 8.2, minutesPerGame: 33.6,
      injuryStatus: 'Probable',
      note: 'Gêné au genou la semaine dernière, a joué les 3 derniers matchs sans restriction.',
    },
    {
      id: 'kp-3', name: 'D. Russell', position: 'Meneur', teamSide: 'home',
      pointsPerGame: 17.3, reboundsPerGame: 3.1, assistsPerGame: 6.4, minutesPerGame: 29.8,
      injuryStatus: null,
      note: 'Efficacité à 3 points en baisse sur les 5 derniers matchs (31%).',
    },
    {
      id: 'kp-4', name: 'J. Tatum', position: 'Ailier', teamSide: 'away',
      pointsPerGame: 27.4, reboundsPerGame: 8.6, assistsPerGame: 4.9, minutesPerGame: 36.2,
      injuryStatus: null,
      note: 'Meilleur scoreur de la ligue sur le mois écoulé.',
    },
    {
      id: 'kp-5', name: 'J. Brown', position: 'Arrière', teamSide: 'away',
      pointsPerGame: 23.7, reboundsPerGame: 5.4, assistsPerGame: 3.2, minutesPerGame: 34.0,
      injuryStatus: 'Incertain',
      note: 'Repos précautionneux envisagé en raison du calendrier resserré (3 matchs en 4 soirs).',
    },
    {
      id: 'kp-6', name: 'K. Porzingis', position: 'Pivot', teamSide: 'away',
      pointsPerGame: 19.8, reboundsPerGame: 7.1, assistsPerGame: 1.8, minutesPerGame: 28.4,
      injuryStatus: 'Absent',
      note: 'Forfait confirmé — absence qui réduit fortement la profondeur intérieure visiteuse.',
    },
  ],
  bettingMarkets: [
    {
      id: 'bm-total', label: 'Total points', line: '221.5', confidence: 71,
      teaser: 'Tendance au-dessus sur 7 des 10 derniers face-à-face.',
      detail: {
        trend: { labels: ['M-5', 'M-4', 'M-3', 'M-2', 'Dernier'], values: [218, 233, 209, 227, 224] },
        explanation: 'Le rythme de jeu combiné des deux équipes (100.2 possessions/match en moyenne) et l\'absence d\'un pivot titulaire côté {away} orientent vers un total élevé. Les 3 dernières confrontations directes ont toutes dépassé 220 points combinés.',
      },
    },
    {
      id: 'bm-spread', label: 'Écart (Spread)', line: '{home} -6.5', confidence: 64,
      teaser: 'Les {home} couvrent l\'écart dans 6 des 9 derniers matchs joués chez eux.',
      detail: {
        trend: { labels: ['M-5', 'M-4', 'M-3', 'M-2', 'Dernier'], values: [-9, -2, -14, 4, -11] },
        explanation: 'Le facteur back-to-back côté {away} et l\'avantage défensif marqué à domicile (108.4 de rating défensif, top 3 ligue) soutiennent un écart favorable aux {home}.',
      },
    },
    {
      id: 'bm-1h', label: 'Mi-temps (1ère période)', line: '{home} -3.5', confidence: 58,
      teaser: 'Démarrages rapides des {home} sur leurs 5 dernières réceptions.',
      detail: {
        trend: { labels: ['M-5', 'M-4', 'M-3', 'M-2', 'Dernier'], values: [2, -6, -1, -9, -4] },
        explanation: 'Les {home} démarrent généralement plus fort, avec un écart moyen de -4.4 points à la mi-temps sur leurs 5 derniers matchs joués chez eux.',
      },
    },
  ],
  contextFactors: [
    {
      id: 'cf-rest', icon: 'rest', label: 'Repos', value: '2 jours vs 0 jour',
      explanation: 'Les {home} arrivent sur 2 jours de repos complet, contre un enchaînement back-to-back pour les {away} — facteur de fraîcheur physique significatif en fin de match.',
    },
    {
      id: 'cf-travel', icon: 'travel', label: 'Déplacement', value: '+2 fuseaux horaires',
      explanation: 'Les {away} ont parcouru plus de 3 500 km et traversé 2 fuseaux horaires avant ce match, un facteur statistiquement associé à une légère baisse d\'efficacité offensive en début de rencontre.',
    },
    {
      id: 'cf-standing', icon: 'standing', label: 'Enjeu classement', value: 'Place de tête en jeu',
      explanation: 'Les {home} et les {away} se disputent actuellement la 1ère place de leur conférence — historiquement, ce type de match à enjeu produit une intensité défensive accrue par rapport à la moyenne de saison.',
    },
    {
      id: 'cf-streak', icon: 'streak', label: 'Série en cours', value: '7 victoires à domicile',
      explanation: 'Les {home} restent sur 7 victoires consécutives dans leur salle, leur plus longue série depuis le début de la saison.',
    },
  ],
  factors: [
    { strength: 'strong', text: '7 victoires consécutives à domicile pour les {home} — efficacité défensive top 3 NBA (108.4).' },
    { strength: 'strong', text: 'Back-to-back pour les {away} — fatigue estimée à +12% sur l\'efficacité offensive.' },
    { strength: 'strong', text: '+18% tentatives à 3 pts vs moyenne ligue pour les {home}, converties à 38.2%.' },
    { strength: 'variable', text: 'Duel entre meneurs — avantage marqué pour les {home} sur les 5 dernières confrontations.' },
    { strength: 'uncertain', text: 'Retour de blessure possible pour un titulaire des {away} — non confirmé.' },
  ],
  winProbabilities: { homeWinPct: 68, closeGamePct: 18, awayWinPct: 14 },
  verdict:
    'Les modèles convergent vers une victoire nette des {home}. Le facteur back-to-back des {away} crée un différentiel de fraîcheur significatif. Le total devrait rester élevé. Gagnant prédit avec une confiance forte.',
};
