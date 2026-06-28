/**
 * Moteur de calcul statistique — étape 1 du pipeline d'analyse HOOPIUM.
 *
 * Tout ce fichier est volontairement pur (aucun appel réseau, aucune IA) :
 * il prend des stats de matchs déjà récupérées et calcule des chiffres.
 * C'est la seule partie du pipeline qui a le droit de décider *quoi* dire
 * (confiance, score prédit, facteurs). L'étape 2 (narration IA, séparée)
 * ne fait que mettre ces chiffres en phrases, jamais les inventer.
 *
 * Formules utilisées — toutes standards en analyse basketball (pas
 * inventées), avec leurs limites documentées :
 *   - Points d'un match : 2×paniers marqués + paniers à 3pts + lancers francs
 *     marqués (vérifié sur un vrai match : Minnesota 111, Dallas 99 le
 *     05/10/2023 — voir tests/stats-engine.test.mts).
 *   - Possessions estimées : tirs tentés − rebonds offensifs + balles
 *     perdues + 0,4×lancers francs tentés (formule de Dean Oliver, standard
 *     en sabermétrie basketball, ex. basketball-reference.com).
 *   - Rating offensif/défensif : points marqués/concédés pour 100 possessions.
 *   - Probabilité de victoire : fonction logistique sur l'écart de "net
 *     rating" (offensif − défensif) des deux équipes, avec un bonus
 *     domicile. La constante d'échelle est une approximation de départ,
 *     à recalibrer une fois qu'on aura de vrais résultats à comparer
 *     (on a justement une saison complète 2023-2024 disponible pour ça).
 */

// ===== Types d'entrée (déjà récupérés depuis l'API, structure vérifiée) =====

export interface RawTeamGameStats {
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointsMade: number;
  threePointsAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  reboundsOffense: number;
  reboundsDefense: number;
  assists: number;
  turnovers: number;
}

export interface GameForTeam {
  date: string; // ISO
  isHome: boolean;
  own: RawTeamGameStats;
  opponentPoints: number;
  won: boolean;
}

export interface TeamSnapshot {
  gamesPlayed: number;
  pointsPerGame: number;
  opponentPointsPerGame: number;
  offensiveRating: number;
  defensiveRating: number;
  netRating: number;
  threePointPct: number;
  reboundsPerGame: number;
  assistsPerGame: number;
  turnoversPerGame: number;
  /** 'w'/'l' du plus ancien au plus récent, les 5 derniers matchs max */
  recentForm: ('w' | 'l')[];
  /** % de victoires sur les matchs joués à domicile uniquement */
  homeWinPct: number;
  lastGameDate: string | null;
}

// ===== Calculs de base (un seul match) =====

/** Points marqués dans un match à partir du box-score. Vérifié sur données réelles. */
export function computeGamePoints(stats: RawTeamGameStats): number {
  return 2 * stats.fieldGoalsMade + stats.threePointsMade + stats.freeThrowsMade;
}

/** Possessions estimées (formule de Dean Oliver). */
export function estimatePossessions(stats: RawTeamGameStats): number {
  return (
    stats.fieldGoalsAttempted -
    stats.reboundsOffense +
    stats.turnovers +
    0.4 * stats.freeThrowsAttempted
  );
}

// ===== Agrégation sur plusieurs matchs =====

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Construit le profil agrégé d'une équipe à partir de ses N derniers matchs.
 * `games` doit déjà être trié du plus ancien au plus récent.
 */
export function buildTeamSnapshot(games: GameForTeam[]): TeamSnapshot {
  if (games.length === 0) {
    return {
      gamesPlayed: 0,
      pointsPerGame: 0,
      opponentPointsPerGame: 0,
      offensiveRating: 0,
      defensiveRating: 0,
      netRating: 0,
      threePointPct: 0,
      reboundsPerGame: 0,
      assistsPerGame: 0,
      turnoversPerGame: 0,
      recentForm: [],
      homeWinPct: 0,
      lastGameDate: null,
    };
  }

  const points = games.map((g) => computeGamePoints(g.own));
  const possessions = games.map((g) => estimatePossessions(g.own));

  const offRatings = games.map((g, i) => (possessions[i] > 0 ? (100 * points[i]) / possessions[i] : 0));
  const defRatings = games.map((g, i) =>
    possessions[i] > 0 ? (100 * g.opponentPoints) / possessions[i] : 0
  );

  const totalThreesMade = games.reduce((s, g) => s + g.own.threePointsMade, 0);
  const totalThreesAttempted = games.reduce((s, g) => s + g.own.threePointsAttempted, 0);

  const homeGames = games.filter((g) => g.isHome);

  const offensiveRating = average(offRatings);
  const defensiveRating = average(defRatings);

  return {
    gamesPlayed: games.length,
    pointsPerGame: average(points),
    opponentPointsPerGame: average(games.map((g) => g.opponentPoints)),
    offensiveRating,
    defensiveRating,
    netRating: offensiveRating - defensiveRating,
    threePointPct: totalThreesAttempted > 0 ? (100 * totalThreesMade) / totalThreesAttempted : 0,
    reboundsPerGame: average(games.map((g) => g.own.reboundsOffense + g.own.reboundsDefense)),
    assistsPerGame: average(games.map((g) => g.own.assists)),
    turnoversPerGame: average(games.map((g) => g.own.turnovers)),
    recentForm: games.slice(-5).map((g) => (g.won ? 'w' : 'l')),
    homeWinPct: homeGames.length > 0 ? (100 * homeGames.filter((g) => g.won).length) / homeGames.length : 0,
    lastGameDate: games[games.length - 1].date,
  };
}

// ===== Prédiction du match =====

const HOME_ADVANTAGE_POINTS = 3; // écart total habituellement attribué à l'avantage du terrain
const WIN_PROB_SCALE = 11; // calibration de départ — à ajuster avec un vrai backtest

function logistic(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export interface MatchPrediction {
  predictedHomeScore: number;
  predictedAwayScore: number;
  totalPointsPredicted: number;
  spreadPredicted: number;
  confidence: number; // 0-100, toujours côté de l'équipe favorite
  favoredSide: 'home' | 'away';
  winProbabilities: { homeWinPct: number; closeGamePct: number; awayWinPct: number };
}

export function predictMatch(home: TeamSnapshot, away: TeamSnapshot): MatchPrediction {
  // Score prédit : moyenne entre "ce que l'équipe marque habituellement"
  // et "ce que l'adversaire concède habituellement", + avantage du terrain.
  const rawHome = (home.pointsPerGame + away.opponentPointsPerGame) / 2;
  const rawAway = (away.pointsPerGame + home.opponentPointsPerGame) / 2;

  const predictedHomeScore = Math.round(rawHome + HOME_ADVANTAGE_POINTS / 2);
  const predictedAwayScore = Math.round(rawAway - HOME_ADVANTAGE_POINTS / 2);

  const netDiff = home.netRating - away.netRating + HOME_ADVANTAGE_POINTS;
  const homeWinProbRaw = logistic(netDiff / WIN_PROB_SCALE);

  // "Match serré" : plus l'écart de proba est faible, plus cette part est grande.
  const closenessFactor = 1 - Math.abs(homeWinProbRaw - 0.5) * 2; // 1 = 50/50, 0 = écrasant
  const closeGamePct = Math.round(closenessFactor * 25);
  const remaining = 100 - closeGamePct;
  const homeWinPct = Math.round(remaining * homeWinProbRaw);
  const awayWinPct = 100 - closeGamePct - homeWinPct;

  const favoredSide: 'home' | 'away' = homeWinPct >= awayWinPct ? 'home' : 'away';
  const confidence = favoredSide === 'home' ? homeWinPct + Math.round(closeGamePct / 2) : awayWinPct + Math.round(closeGamePct / 2);

  return {
    predictedHomeScore,
    predictedAwayScore,
    totalPointsPredicted: predictedHomeScore + predictedAwayScore,
    spreadPredicted: predictedHomeScore - predictedAwayScore,
    confidence: Math.min(95, Math.max(50, confidence)), // borné : jamais sous 50% côté favori, jamais surconfiant à 100%
    favoredSide,
    winProbabilities: { homeWinPct, closeGamePct, awayWinPct },
  };
}

/** Jours de repos depuis le dernier match, calculé à une date de référence donnée. */
export function computeRestDays(lastGameDate: string | null, referenceDate: Date): number {
  if (!lastGameDate) return 0;
  const last = new Date(lastGameDate);
  const diffMs = referenceDate.getTime() - last.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}
