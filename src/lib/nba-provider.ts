import type { Match, League } from '@/types';

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

  const res = await fetch(url.toString(), {
    headers: { 'x-apisports-key': API_KEY },
    next: { revalidate: 900 },
  });

  if (!res.ok) {
    throw new Error(`API-Basketball a répondu ${res.status} pour ${endpoint}`);
  }

  return res.json() as Promise<ApiNbaResponse<T>>;
}

/**
 * IDs de ligue API-Basketball, et la saison à interroger pour chacune.
 * Source : endpoint /leagues (à revérifier en début de chaque saison,
 * ces IDs sont stables d'une année sur l'autre chez ce fournisseur).
 */
const LEAGUE_CONFIG: Record<League, { id: number; season: string }> = {
  nba: { id: 12, season: '2025-2026' },
  wnba: { id: 13, season: '2026' },
  euroleague: { id: 120, season: '2025-2026' },
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

export async function fetchGameStatistics(gameId: number) {
  const data = await apiNbaFetch<unknown>('/games/statistics/teams', { id: gameId });
  return data.response;
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
