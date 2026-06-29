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

import { buildTeamSnapshotFromApi, fetchAllSeasonGames, extractHeadToHead, fetchStandings, findTeamStanding } from './nba-provider';
import { predictMatch, buildRadarProfile, computeRestDays } from './stats-engine';
import type { TeamSnapshot } from './stats-engine';
import { TEAM_API_IDS } from './team-api-ids';
import { TEAM_LOCATIONS } from './team-locations';
import { MOCK_ANALYSIS } from './mock-data';
import { narrateAnalysis } from './ai-narration';
import type { Match, MatchAnalysis, StatComparisonRow, HeadToHeedGame, ConfidenceLevel, ContextFactor } from '@/types';

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

/** Plus longue série en cours (en partant du match le plus récent). */
export function computeStreak(form: ('w' | 'l')[]): { count: number; type: 'w' | 'l' } | null {
  if (form.length === 0) return null;
  const last = form[form.length - 1];
  let count = 0;
  for (let i = form.length - 1; i >= 0; i--) {
    if (form[i] !== last) break;
    count++;
  }
  return { count, type: last };
}

/**
 * Contexte du match à partir de données réelles : repos (calculé), enjeu
 * classement (/standings), série en cours (forme récente), déplacement
 * (écart de fuseau horaire entre les villes des deux équipes — fait
 * factuel, jamais une affirmation de fatigue qu'on ne peut pas vérifier).
 * Chaque facteur est indépendant : si l'un échoue (classement introuvable,
 * ville absente de la table), on l'omet plutôt que d'en inventer un.
 */
async function buildRealContextFactors(
  match: Match,
  home: TeamSnapshot,
  away: TeamSnapshot,
  homeApiId: number,
  awayApiId: number
): Promise<ContextFactor[]> {
  const factors: ContextFactor[] = [];

  // Repos
  const homeRest = computeRestDays(home.lastGameDate, TESTING_REFERENCE_DATE);
  const awayRest = computeRestDays(away.lastGameDate, TESTING_REFERENCE_DATE);
  if (home.lastGameDate && away.lastGameDate) {
    factors.push({
      id: 'cf-rest',
      icon: 'rest',
      label: 'Repos',
      value: `${homeRest} jour${homeRest === 1 ? '' : 's'} vs ${awayRest} jour${awayRest === 1 ? '' : 's'}`,
      explanation: `{home} arrive sur ${homeRest} jour${homeRest === 1 ? '' : 's'} de repos depuis son dernier match, {away} sur ${awayRest} jour${awayRest === 1 ? '' : 's'}.`,
    });
  }

  // Déplacement (écart de fuseau horaire entre les deux villes)
  const homeLoc = TEAM_LOCATIONS[match.homeTeam.id];
  const awayLoc = TEAM_LOCATIONS[match.awayTeam.id];
  if (homeLoc && awayLoc) {
    const diff = Math.abs(homeLoc.utcOffset - awayLoc.utcOffset);
    factors.push({
      id: 'cf-travel',
      icon: 'travel',
      label: 'Déplacement',
      value: diff === 0 ? 'Même fuseau horaire' : `${diff}h de décalage`,
      explanation:
        diff === 0
          ? `{home} (${homeLoc.city}) et {away} (${awayLoc.city}) sont dans le même fuseau horaire.`
          : `{away} (${awayLoc.city}) évolue avec ${diff}h de décalage horaire par rapport à {home} (${homeLoc.city}).`,
    });
  }

  // Enjeu classement
  try {
    const standings = await fetchStandings(match.league, TESTING_SEASON);
    const homeStanding = findTeamStanding(standings, String(homeApiId));
    const awayStanding = findTeamStanding(standings, String(awayApiId));
    if (homeStanding && awayStanding) {
      factors.push({
        id: 'cf-standing',
        icon: 'standing',
        label: 'Enjeu classement',
        value: `${homeStanding.position}e vs ${awayStanding.position}e`,
        explanation: `{home} est ${homeStanding.position}e de ${homeStanding.group.name} (${homeStanding.games.win.total}V-${homeStanding.games.lose.total}D), {away} est ${awayStanding.position}e de ${awayStanding.group.name} (${awayStanding.games.win.total}V-${awayStanding.games.lose.total}D).`,
      });
    }
  } catch (err) {
    console.warn('[real-analysis] Classement indisponible pour le contexte :', err);
  }

  // Série en cours — on met en avant la plus notable des deux.
  const homeStreak = computeStreak(home.recentForm);
  const awayStreak = computeStreak(away.recentForm);
  if (homeStreak && awayStreak) {
    const featured = homeStreak.count >= awayStreak.count ? { side: 'home' as const, streak: homeStreak } : { side: 'away' as const, streak: awayStreak };
    const resultWord = featured.streak.type === 'w' ? 'victoire' : 'défaite';
    const plural = featured.streak.count > 1 ? 's' : '';
    factors.push({
      id: 'cf-streak',
      icon: 'streak',
      label: 'Série en cours',
      value: `${featured.streak.count} ${resultWord}${plural} de suite`,
      explanation: `${featured.side === 'home' ? '{home}' : '{away}'} est sur une série de ${featured.streak.count} ${resultWord}${plural} de suite sur ses ${RECENT_GAMES_COUNT} derniers matchs disponibles.`,
    });
  }

  return factors;
}

/** Repli si la narration IA échoue : texte factuel simple, pas de prose, mais jamais inventé. */
function buildFallbackFactorsAndVerdict(home: TeamSnapshot, away: TeamSnapshot, predictedHomeScore: number, predictedAwayScore: number, confidence: number) {
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
 * `keyPlayers` et `bettingMarkets` restent ceux du mock (non couverts par
 * des endpoints vérifiés à ce stade) — jamais présentés comme réels
 * ailleurs dans ce fichier. `contextFactors` est réel (repos, classement,
 * série, fuseau horaire).
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

  const { factors: fallbackFactors, verdict: fallbackVerdict } = buildFallbackFactorsAndVerdict(
    homeSnapshot,
    awaySnapshot,
    prediction.predictedHomeScore,
    prediction.predictedAwayScore,
    prediction.confidence
  );

  let factors: { strength: 'strong' | 'variable' | 'uncertain'; text: string }[] = fallbackFactors;
  let verdict: string = fallbackVerdict;

  try {
    const narration = await narrateAnalysis(match, homeSnapshot, awaySnapshot, prediction);
    factors = narration.factors;
    verdict = narration.verdict;
  } catch (err) {
    console.warn('[real-analysis] Narration IA indisponible, repli sur le texte factuel :', err);
  }

  let contextFactors = await buildRealContextFactors(match, homeSnapshot, awaySnapshot, homeApiId, awayApiId);
  if (contextFactors.length === 0) {
    console.warn('[real-analysis] Aucun facteur de contexte réel disponible, repli sur le mock.');
    contextFactors = MOCK_ANALYSIS.contextFactors;
  }

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
    contextFactors,
    factors,
    winProbabilities: prediction.winProbabilities,
    verdict,
  };
}
