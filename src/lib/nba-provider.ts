import type { Match, League } from '@/types';
import { buildTeamSnapshot } from './stats-engine';
import type { RawTeamGameStats, GameForTeam, TeamSnapshot } from './stats-engine';
import { readCache, writeCache } from './api-cache';

/**
 * Couche d'accès aux données basketball multi-ligues.
 *
 * Fournisseur actuel : API-BASKETBALL (api-sports.io), palier gratuit (100 req/jour).
 * Une seule clé API-Sports couvre tous les sports du compte — c'est la même
 * clé NBA_API_KEY qui est utilisée ici malgré son nom historique.
 *
 * Pour maximiser les chances d'avoir des matchs à afficher toute l'année
 * (la NBA est en pause l'été), on interroge plusieurs ligues en parallèle :
 * NBA, WNBA (active en été), EuroLeague et NCAA. Chaque appel /games par
 * ligue compte comme une requête distincte sur le quota journalier.
 *
 * Doc fournisseur : https://api-sports.io/documentation/basketball/v1
 */

const API_BASE_URL = 'https://v1.basketball.api-sports.io';
const API_KEY = process.env.NBA_API_KEY;

if (!API_KEY && process.env.NODE_ENV !== 'test') {
  console.warn(
    '[nba-provider] NBA_API_KEY manquante dans les variables d\'environnement. ' +
    'Les appels API réels échoueront — vérifie ton fichier .env.local.'
  );
}

interface ApiNbaResponse<T> {
  get: string;
  parameters: Record<string, unknown>;
  errors: unknown[];
  results: number;
  response: T[];
}

async function apiNbaFetch<T>(
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<ApiNbaResponse<T>> {
  if (!API_KEY) {
    throw new Error('NBA_API_KEY manquante — impossible d\'appeler API-Basketball.');
  }

  const url = new URL(`${API_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  const cacheKey = url.toString();
  const cached = await readCache<ApiNbaResponse<T>>(cacheKey);
  if (cached) return cached;

  const res = await fetch(url.toString(), {
    headers: { 'x-apisports-key': API_KEY },
    next: { revalidate: 900 },
  });

  if (!res.ok) {
    throw new Error(`API-Basketball a répondu ${res.status} pour ${endpoint}`);
  }

  const data = (await res.json()) as ApiNbaResponse<T>;

  const hasErrors = Array.isArray(data.errors) ? data.errors.length > 0 : Boolean(data.errors) && Object.keys(data.errors).length > 0;
  if (hasErrors) {
    throw new Error(`API-Basketball erreur pour ${endpoint} : ${JSON.stringify(data.errors)}`);
  }

  await writeCache(cacheKey, data);
  return data;
}

/**
 * IDs de ligue API-Basketball, et la saison à interroger pour chacune.
 * Source : endpoint /leagues (à revérifier en début de chaque saison,
 * ces IDs sont stables d'une année sur l'autre chez ce fournisseur).
 */
const LEAGUE_CONFIG: Record<League, { id: number; season: string }> = {
  nba: { id: 12, season: '2025-2026' },
  wnba: { id: 13, season: '2026' },
  euroleague: { id: 120, season: '2025' },
  ncaa: { id: 116, season: '2025-2026' },
};

// ===== Types bruts du fournisseur (API-Basketball) =====

interface RawTeam {
  id: number;
  name: string;
  logo: string;
}

interface RawGame {
  id: number;
  date: string;
  time: string;
  timestamp: number;
  venue?: string;
  status: { long: string; short: string };
  league: { id: number; name: string; season: string };
  teams: { home: RawTeam; away: RawTeam };
  scores: {
    home: { quarter_1: number | null; quarter_2: number | null; quarter_3: number | null; quarter_4: number | null; total: number | null };
    away: { quarter_1: number | null; quarter_2: number | null; quarter_3: number | null; quarter_4: number | null; total: number | null };
  };
}

interface RawTeamFull {
  id: number;
  name: string;
  logo: string;
  national: boolean;
}

// ===== Fonctions exposées au reste de l'application =====

/**
 * Récupère les matchs programmés pour une date donnée (YYYY-MM-DD) sur une
 * seule ligue. Une requête API consommée par appel.
 */
export async function fetchGamesByDate(date: string, league: League = 'nba') {
  const { id, season } = LEAGUE_CONFIG[league];
  const data = await apiNbaFetch<RawGame>('/games', { date, league: id, season });
  return data.response;
}

/**
 * Récupère les matchs du jour sur TOUTES les ligues couvertes, en parallèle.
 * Coût : une requête par ligue (4 requêtes au total avec la config actuelle).
 * Si une ligue échoue (ex: saison non commencée), elle est simplement
 * ignorée plutôt que de faire échouer tout l'appel.
 */
export async function fetchGamesByDateAllLeagues(date: string): Promise<Match[]> {
  const leagues = Object.keys(LEAGUE_CONFIG) as League[];
  const results = await Promise.allSettled(
    leagues.map((league) => fetchGamesByDate(date, league))
  );

  const matches: Match[] = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      matches.push(...result.value.map((g) => mapRawGameToMatch(g, leagues[i])));
    } else {
      console.warn(`[nba-provider] Échec pour la ligue ${leagues[i]} :`, result.reason);
    }
  });

  return matches.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

/**
 * Récupère la liste complète des équipes (avec logo) d'une ligue. À appeler
 * rarement — la liste d'équipes change peu — et à mettre en cache longtemps
 * côté appelant pour économiser le quota.
 */
export async function fetchTeamsByLeague(league: League) {
  const { id, season } = LEAGUE_CONFIG[league];
  const data = await apiNbaFetch<RawTeamFull>('/teams', { league: id, season });
  return data.response;
}

export async function fetchStandings(league: League = 'nba') {
  const { id, season } = LEAGUE_CONFIG[league];
  const data = await apiNbaFetch<unknown>('/standings', { league: id, season });
  return data.response;
}

// ===== Stats de match par équipe (pour le moteur de calcul, src/lib/stats-engine.ts) =====

/** Forme brute exacte renvoyée par /games/statistics/teams — vérifiée manuellement. */
interface RawGameTeamStats {
  game: { id: number };
  team: { id: number };
  field_goals: { total: number; attempts: number; percentage: number };
  threepoint_goals: { total: number; attempts: number; percentage: number };
  freethrows_goals: { total: number; attempts: number; percentage: number };
  rebounds: { total: number; offence: number; defense: number };
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  personal_fouls: number;
}

/** Convertit la forme brute de l'API vers le type attendu par stats-engine.ts. */
function mapRawGameTeamStats(raw: RawGameTeamStats): RawTeamGameStats {
  return {
    fieldGoalsMade: raw.field_goals.total,
    fieldGoalsAttempted: raw.field_goals.attempts,
    threePointsMade: raw.threepoint_goals.total,
    threePointsAttempted: raw.threepoint_goals.attempts,
    freeThrowsMade: raw.freethrows_goals.total,
    freeThrowsAttempted: raw.freethrows_goals.attempts,
    reboundsOffense: raw.rebounds.offence,
    reboundsDefense: raw.rebounds.defense,
    assists: raw.assists,
    turnovers: raw.turnovers,
  };
}

/** Récupère tous les matchs d'une saison (1 requête, quel que soit le nombre de matchs). */
export async function fetchAllSeasonGames(league: League = 'nba', seasonOverride?: string) {
  const { id, season } = LEAGUE_CONFIG[league];
  const data = await apiNbaFetch<RawGame>('/games', { league: id, season: seasonOverride ?? season });
  return data.response;
}

export interface RecentGameForTeam {
  gameId: number;
  date: string;
  isHome: boolean;
  opponentPoints: number;
  won: boolean;
}

/**
 * Sélectionne, parmi tous les matchs d'une saison, les `maxGames` plus
 * récents joués par `teamId` avant `beforeDate` — fonction pure, testable
 * sans réseau (voir tests/nba-provider.test.mts).
 */
export function extractRecentGamesForTeam(
  allGames: RawGame[],
  teamId: string,
  beforeDate: Date,
  maxGames: number
): RecentGameForTeam[] {
  const finished = allGames.filter((g) => {
    if (g.status.short !== 'FT' && g.status.short !== 'AOT') return false;
    if (new Date(g.timestamp * 1000) >= beforeDate) return false;
    return String(g.teams.home.id) === teamId || String(g.teams.away.id) === teamId;
  });

  finished.sort((a, b) => a.timestamp - b.timestamp);

  return finished.slice(-maxGames).map((g) => {
    const isHome = String(g.teams.home.id) === teamId;
    const ownScore = isHome ? g.scores.home.total : g.scores.away.total;
    const oppScore = isHome ? g.scores.away.total : g.scores.home.total;
    return {
      gameId: g.id,
      date: new Date(g.timestamp * 1000).toISOString(),
      isHome,
      opponentPoints: oppScore ?? 0,
      won: (ownScore ?? 0) > (oppScore ?? 0),
    };
  });
}

/**
 * Construit le profil agrégé réel d'une équipe : récupère ses derniers
 * matchs de la saison, puis le box-score détaillé de chacun (1 requête par
 * match — c'est la partie coûteuse de cette fonction), et agrège tout via
 * stats-engine.ts. À mettre en cache par équipe (pas par visiteur) côté
 * appelant, conformément aux points de rafraîchissement définis.
 */
export async function buildTeamSnapshotFromApi(
  teamId: string,
  league: League,
  referenceDate: Date,
  maxGames = 10,
  seasonOverride?: string
): Promise<TeamSnapshot> {
  const allGames = await fetchAllSeasonGames(league, seasonOverride);
  const recentGames = extractRecentGamesForTeam(allGames, teamId, referenceDate, maxGames);

  const withStatsOrNull: (GameForTeam | null)[] = await Promise.all(
    recentGames.map(async (rg) => {
      const statsResponse = await apiNbaFetch<RawGameTeamStats>('/games/statistics/teams', { id: rg.gameId });
      const ownStats = statsResponse.response.find((s) => String(s.team.id) === teamId);
      if (!ownStats) {
        // Match sans box-score détaillé disponible (rare mais arrive) — on
        // l'ignore plutôt que de faire échouer tout le profil de l'équipe.
        console.warn(`[nba-provider] Stats absentes pour l'équipe ${teamId} dans le match ${rg.gameId} — ignoré.`);
        return null;
      }
      return {
        date: rg.date,
        isHome: rg.isHome,
        own: mapRawGameTeamStats(ownStats),
        opponentPoints: rg.opponentPoints,
        won: rg.won,
      };
    })
  );

  const withStats: GameForTeam[] = withStatsOrNull.filter((g): g is GameForTeam => g !== null);

  return buildTeamSnapshot(withStats);
}

export async function fetchGameStatistics(gameId: number) {
  const data = await apiNbaFetch<RawGameTeamStats>('/games/statistics/teams', { id: gameId });
  return data.response;
}

/**
 * Confrontations directes réelles entre deux équipes sur une saison —
 * filtre côté code sur la liste de matchs déjà récupérée (pas de paramètre
 * d'API h2h supposé, on ne fait confiance qu'à ce qu'on a vérifié).
 * Peut renvoyer moins de matchs que demandé (parfois 1 à 4 par saison en
 * NBA) — jamais complété par des données inventées.
 */
export function extractHeadToHead(
  allGames: RawGame[],
  teamAId: string,
  teamBId: string,
  beforeDate: Date,
  maxGames = 10
) {
  const matches = allGames.filter((g) => {
    if (g.status.short !== 'FT' && g.status.short !== 'AOT') return false;
    if (new Date(g.timestamp * 1000) >= beforeDate) return false;
    const home = String(g.teams.home.id);
    const away = String(g.teams.away.id);
    return (home === teamAId && away === teamBId) || (home === teamBId && away === teamAId);
  });

  matches.sort((a, b) => b.timestamp - a.timestamp); // plus récent d'abord

  return matches.slice(0, maxGames).map((g) => ({
    date: new Date(g.timestamp * 1000).toISOString(),
    homeScore: g.scores.home.total ?? 0,
    awayScore: g.scores.away.total ?? 0,
    homeTeamWasTeamA: String(g.teams.home.id) === teamAId,
    venue: g.venue ?? '',
  }));
}

export async function fetchApiStatus() {
  const data = await apiNbaFetch<unknown>('/status');
  return data.response;
}

export const NBA_PROVIDER_INFO = {
  name: 'API-Basketball (api-sports.io)',
  freeTierDailyLimit: 100,
  docsUrl: 'https://api-sports.io/documentation/basketball/v1',
} as const;

// ===== Transformation vers les types internes de l'app =====

function mapStatus(short: string): 'scheduled' | 'live' | 'finished' {
  if (short === 'FT' || short === 'AOT') return 'finished';
  if (['Q1', 'Q2', 'Q3', 'Q4', 'OT', 'HT'].includes(short)) return 'live';
  return 'scheduled';
}

/**
 * Convertit un match brut API-Basketball vers notre type Match interne.
 * `league` doit être passé explicitement car la réponse /games ne permet
 * pas toujours de déduire sans ambiguïté laquelle de nos 4 ligues suivies
 * il s'agit (l'API a son propre id de ligue interne, distinct du nôtre).
 */
export function mapRawGameToMatch(game: RawGame, league: League): Match {
  return {
    id: String(game.id),
    league,
    startTime: new Date(game.timestamp * 1000).toISOString(),
    homeTeam: {
      id: String(game.teams.home.id),
      name: game.teams.home.name,
      abbreviation: game.teams.home.name.slice(0, 3).toUpperCase(),
      record: '',
      form: { results: [] },
      logoUrl: game.teams.home.logo,
    },
    awayTeam: {
      id: String(game.teams.away.id),
      name: game.teams.away.name,
      abbreviation: game.teams.away.name.slice(0, 3).toUpperCase(),
      record: '',
      form: { results: [] },
      logoUrl: game.teams.away.logo,
    },
    // L'indice de confiance HOOPIUM (issu du modèle d'analyse) n'est pas
    // encore branché — valeur neutre en attendant le vrai calcul.
    confidence: 50,
    confidenceLevel: 'mid',
    status: mapStatus(game.status.short),
    finalScore:
      game.scores.home.total !== null && game.scores.away.total !== null
        ? { home: game.scores.home.total, away: game.scores.away.total }
        : undefined,
  };
}
