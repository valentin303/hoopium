// Types de données partagés dans toute l'application HOOPIUM

export type League = 'nba' | 'wnba' | 'euroleague' | 'ncaa';

export type ConfidenceLevel = 'high' | 'mid' | 'low';

export interface TeamForm {
  /** 'w' = victoire, 'l' = défaite, du plus ancien au plus récent */
  results: ('w' | 'l')[];
}

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  /** Bilan victoires-défaites de la saison en cours, ex: "12V — 3D" */
  record: string;
  form: TeamForm;
  logoUrl?: string;
}

export interface Match {
  id: string;
  league: League;
  /** Heure de début au format ISO 8601 */
  startTime: string;
  homeTeam: Team;
  awayTeam: Team;
  /** Indice de confiance HOOPIUM, de 0 à 100 */
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  status: 'scheduled' | 'live' | 'finished';
  /** Renseigné uniquement si status === 'finished' */
  finalScore?: {
    home: number;
    away: number;
  };
  /** Renseigné uniquement si status === 'finished' : la prédiction HOOPIUM était-elle correcte ? */
  predictionCorrect?: boolean;
  /** Équipe prédite gagnante par le modèle HOOPIUM */
  predictedWinnerId?: string;
}

export interface StatComparisonRow {
  label: string;
  homeValue: number | string;
  awayValue: number | string;
  leagueAverage?: number | string;
  /** 'home' | 'away' | null — quelle équipe a le meilleur chiffre sur cette ligne */
  betterSide: 'home' | 'away' | null;
}

export type FactorStrength = 'strong' | 'variable' | 'uncertain';

export interface AnalysisFactor {
  strength: FactorStrength;
  text: string;
}

export interface WinProbabilities {
  homeWinPct: number;
  closeGamePct: number;
  awayWinPct: number;
}

export interface PlayerStat {
  id: string;
  name: string;
  position: string;
  /** url du logo de l'équipe à laquelle appartient ce joueur, pour affichage rapide */
  teamSide: 'home' | 'away';
  pointsPerGame: number;
  reboundsPerGame: number;
  assistsPerGame: number;
  minutesPerGame: number;
  /** ex: "Probable", "Incertain", "Absent", ou null si pas de souci connu */
  injuryStatus: string | null;
  /** courte note contextuelle affichée dans l'overlay, ex: forme récente */
  note: string;
}

export interface BettingMarket {
  id: string;
  label: string;
  /** valeur centrale affichée sur la carte, ex: "221.5" ou "Lakers -6.5" */
  line: string;
  /** confiance HOOPIUM spécifique à ce marché, 0-100 */
  confidence: number;
  /** texte court affiché sur la carte avant ouverture de l'overlay */
  teaser: string;
  /** détail affiché dans l'overlay au clic */
  detail: {
    trend: { labels: string[]; values: number[] };
    explanation: string;
  };
}

export interface HeadToHeedGame {
  date: string;
  homeScore: number;
  awayScore: number;
  /** vrai si l'équipe "home" de la page actuelle a gagné ce match historique */
  homeTeamWon: boolean;
  venue: string;
}

export interface ContextFactor {
  id: string;
  icon: 'rest' | 'travel' | 'standing' | 'streak';
  label: string;
  /** valeur courte affichée sur le badge, ex: "2 jours" ou "Back-to-back" */
  value: string;
  /** explication affichée au clic/survol */
  explanation: string;
}

export interface MatchAnalysis {
  match: Match;
  totalPointsPredicted: number;
  spreadPredicted: number;
  variablesUsed: number;
  statsComparison: StatComparisonRow[];
  scoringTrend: {
    labels: string[];
    homeValues: number[];
    awayValues: number[];
  };
  radarProfile: {
    labels: string[];
    homeValues: number[];
    awayValues: number[];
  };
  headToHead: {
    labels: string[];
    homeValues: number[];
    awayValues: number[];
  };
  /** historique étendu (10+ confrontations), affiché dans un overlay */
  headToHeadDetailed: HeadToHeedGame[];
  keyPlayers: PlayerStat[];
  bettingMarkets: BettingMarket[];
  contextFactors: ContextFactor[];
  factors: AnalysisFactor[];
  winProbabilities: WinProbabilities;
  verdict: string;
}

export interface SiteStats {
  /** Taux de réussite global des prédictions HOOPIUM, en % */
  successRate: number;
  totalAnalyses: number;
  correctPredictions: number;
  wrongPredictions: number;
}
