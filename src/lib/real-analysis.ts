/**
 * Construit une vraie MatchAnalysis à partir de données réelles, en
 * assemblant le moteur de calcul (stats-engine.ts) et les fonctions de
 * récupération (nba-provider.ts).
 *
 * ⚠️ SAISON DE TEST — À CHANGER AU LANCEMENT RÉEL ⚠️
 * Le plan gratuit API-Basketball ne donne accès qu'aux saisons 2022-2024
 * (voir HOOPIUM_PLAN_ACTION.md). En attendant l'abonnement Pro de
 * septembre/octobre (qui débloquera la saison en cours), on utilise la
 * saison 2023-2024 — des données 100% réelles, juste pas la saison en
 * cours. Pour passer en production, il suffira de changer TESTING_SEASON
 * et TESTING_REFERENCE_DATE ci-dessous (ou de les rendre dynamiques).
 */

import { buildTeamSnapshotFromApi, fetchAllSeasonGames, extractHeadToHead } from './nba-provider';
import { predictMatch, buildRadarProfile } from './stats-engine';
import type { TeamSnapshot } from './stats-engine';
import { TEAM_API_IDS } from './team-api-ids';
import { MOCK_ANALYSIS } from './mock-data';
import type { Match, MatchAnalysis, StatComparisonRow, HeadToHeedGame, ConfidenceLevel } from '@/types';

const TESTING_SEASON = '2023-2024';
const TESTING_REFERENCE_DATE = new Date('2024-04-14T00:00:00Z'); // fin de saison régulière 2023-2024
const RECENT_GAMES_COUNT = 10;

function confidenceLevelFor(confidence: number): ConfidenceLevel {
  if (confidence >= 75) return 'high';
  if (confidence >= 60) return 'mid';
  return 'low';
}

function statRow(
  label: string,
  homeValue: number,
  awayValue: number,
  digits = 1,
  lowerIsBetter = false
): StatComparisonRow {
  const betterSide: 'home' | 'away' | null =
    homeValue === awayValue ? null : (homeValue > awayValue) !== lowerIsBetter ? 'home' : 'away';
  return {
    label,
    homeValue: Number(homeValue.toFixed(digits)),
    awayValue: Number(awayValue.toFixed(digits)),
    betterSide,
  };
}

function buildStatsComparison(home: TeamSnapshot, away: TeamSnapshot): StatComparisonRow[] {
  return [
    statRow('Pts / match', home.pointsPerGame, away.pointsPerGame),
    statRow('Rating offensif', home.offensiveRating, away.offensiveRating),
    statRow('Rating défensif', home.defensiveRating, away.defensiveRating, 1, true),
    statRow('% à 3 pts', home.threePointPct, away.threePointPct),
    statRow('Rebonds / match', home.reboundsPerGame, away.reboundsPerGame),
    statRow('Passes déc.', home.assistsPerGame, away.assistsPerGame),
    statRow('Turnovers', home.turnoversPerGame, away.turnoversPerGame, 1, true),
  ];
}

function buildScoringTrend(home: TeamSnapshot, away: TeamSnapshot) {
  // On aligne sur le plus petit des deux historiques réels (jamais de
  // remplissage inventé si une équipe a moins de matchs disponibles).
  const length = Math.min(home.recentPointsTrend.length, away.recentPointsTrend.length);
  const homeValues = home.recentPointsTrend.slice(-length);
  const awayValues = away.recentPointsTrend.slice(-length);
  const labels = homeValues.map((_, i) => (i === length - 1 ? 'Dernier' : `M-${length - 1 - i}`));
  return { labels, homeValues, awayValues };
}

function formLabel(snapshot: TeamSnapshot): string {
  return snapshot.recentForm.map((r) => (r === 'w' ? 'V' : 'D')).join('');
}

function buildFactorsAndVerdict(home: TeamSnapshot, away: TeamSnapshot, predictedHomeScore: number, predictedAwayScore: number, confidence: number) {
  const netDiff = home.netRating - away.netRating;
  const factors = [
    {
      strength: (Math.abs(netDiff) > 5 ? 'strong' : 'variable') as 'strong' | 'variable',
      text: `Rating net réel sur les ${RECENT_GAMES_COUNT} derniers matchs disponibles : {home} ${home.netRating.toFixed(1)} contre {away} ${away.netRating.toFixed(1)}.`,
    },
    {
      strength: 'strong' as const,
      text: `Forme récente : {home} ${formLabel(home)} — {away} ${formLabel(away)}.`,
    },
    {
      strength: 'variable' as const,
      text: `Réussite à 3 points : {home} ${home.threePointPct.toFixed(1)}% contre {away} ${away.threePointPct.toFixed(1)}%.`,
    },
  ];

  const verdict =
    `D'après les ${RECENT_GAMES_COUNT} derniers matchs réels de chaque équipe (saison ${TESTING_SEASON}), ` +
    `le modèle prédit ${predictedHomeScore}-${predictedAwayScore} pour {home} contre {away}, ` +
    `avec une confiance de ${confidence}%. Cette analyse est calculée, pas encore mise en mots par l'IA (étape 2 du pipeline, pas encore branchée).`;

  return { factors, verdict };
}

/**
 * Construit une analyse complète et réelle pour un match du mock, en
 * remplaçant les deux équipes par leurs vraies données API-Basketball.
 * `keyPlayers`, `bettingMarkets` et `contextFactors` restent ceux du mock
 * (non couverts par les endpoints vérifiés à ce stade) — jamais présentés
 * comme réels ailleurs dans ce fichier.
 */
export async function buildRealMatchAnalysis(match: Match): Promise<MatchAnalysis> {
  const homeApiId = TEAM_API_IDS[match.homeTeam.id];
  const awayApiId = TEAM_API_IDS[match.awayTeam.id];

  if (!homeApiId || !awayApiId) {
    throw new Error(
      `Pas d'id API réel pour ${match.homeTeam.id} ou ${match.awayTeam.id} — voir src/lib/team-api-ids.ts`
    );
  }

  const [homeSnapshot, awaySnapshot, allSeasonGames] = await Promise.all([
    buildTeamSnapshotFromApi(String(homeApiId), match.league, TESTING_REFERENCE_DATE, RECENT_GAMES_COUNT, TESTING_SEASON),
    buildTeamSnapshotFromApi(String(awayApiId), match.league, TESTING_REFERENCE_DATE, RECENT_GAMES_COUNT, TESTING_SEASON),
    fetchAllSeasonGames(match.league, TESTING_SEASON),
  ]);

  const prediction = predictMatch(homeSnapshot, awaySnapshot);

  const h2hRaw = extractHeadToHead(allSeasonGames, String(homeApiId), String(awayApiId), TESTING_REFERENCE_DATE, 10);
  const headToHeadDetailed: HeadToHeedGame[] = h2hRaw.map((g) => {
    const homeScore = g.homeTeamWasTeamA ? g.homeScore : g.awayScore;
    const awayScore = g.homeTeamWasTeamA ? g.awayScore : g.homeScore;
    return { date: g.date, homeScore, awayScore, homeTeamWon: homeScore > awayScore, venue: g.venue };
  });

  const { factors, verdict } = buildFactorsAndVerdict(
    homeSnapshot,
    awaySnapshot,
    prediction.predictedHomeScore,
    prediction.predictedAwayScore,
    prediction.confidence
  );

  return {
    match: { ...match, confidence: prediction.confidence, confidenceLevel: confidenceLevelFor(prediction.confidence) },
    totalPointsPredicted: prediction.totalPointsPredicted,
    spreadPredicted: prediction.spreadPredicted,
    variablesUsed: 12, // signaux réellement utilisés : 10 par équipe + h2h + avantage domicile
    statsComparison: buildStatsComparison(homeSnapshot, awaySnapshot),
    scoringTrend: buildScoringTrend(homeSnapshot, awaySnapshot),
    radarProfile: buildRadarProfile(homeSnapshot, awaySnapshot),
    headToHead: MOCK_ANALYSIS.headToHead, // mini-graphique non encore branché sur le réel
    headToHeadDetailed: headToHeadDetailed.length > 0 ? headToHeadDetailed : MOCK_ANALYSIS.headToHeadDetailed,
    keyPlayers: MOCK_ANALYSIS.keyPlayers, // pas encore de données réelles joueurs/blessures
    bettingMarkets: MOCK_ANALYSIS.bettingMarkets, // pas encore de données réelles de marchés
    contextFactors: MOCK_ANALYSIS.contextFactors, // repos/déplacement réels à calculer séparément
    factors,
    winProbabilities: prediction.winProbabilities,
    verdict,
  };
}
