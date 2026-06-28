/**
 * Tests du moteur de calcul statistique — exécuter avec `npm test`.
 *
 * Les chiffres de référence viennent d'un vrai appel à l'API (vérifiés
 * manuellement, pas inventés) :
 *   GET /games/statistics/teams?id=372186 (Minnesota @ Dallas, 05/10/2023)
 *   Score réel du match : Minnesota 111 - Dallas 99
 */

import assert from 'node:assert/strict';
import { computeGamePoints, estimatePossessions, buildTeamSnapshot, predictMatch, computeRestDays, buildRadarProfile } from '../src/lib/stats-engine';
import type { RawTeamGameStats, GameForTeam } from '../src/lib/stats-engine';

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    throw err;
  }
}

// ===== Données réelles vérifiées (Minnesota @ Dallas, 05/10/2023) =====

const minnesotaStats: RawTeamGameStats = {
  fieldGoalsMade: 42,
  fieldGoalsAttempted: 95,
  threePointsMade: 11,
  threePointsAttempted: 35,
  freeThrowsMade: 16,
  freeThrowsAttempted: 22,
  reboundsOffense: 11,
  reboundsDefense: 45,
  assists: 28,
  turnovers: 16,
};

const dallasStats: RawTeamGameStats = {
  fieldGoalsMade: 34,
  fieldGoalsAttempted: 92,
  threePointsMade: 14,
  threePointsAttempted: 46,
  freeThrowsMade: 17,
  freeThrowsAttempted: 30,
  reboundsOffense: 7,
  reboundsDefense: 35,
  assists: 18,
  turnovers: 13,
};

console.log('Moteur de calcul — tests\n');

test('computeGamePoints retrouve le score réel de Minnesota (111)', () => {
  assert.equal(computeGamePoints(minnesotaStats), 111);
});

test('computeGamePoints retrouve le score réel de Dallas (99)', () => {
  assert.equal(computeGamePoints(dallasStats), 99);
});

test('estimatePossessions donne un nombre plausible (entre 90 et 110 sur un match NBA)', () => {
  const poss = estimatePossessions(minnesotaStats);
  assert.ok(poss > 90 && poss < 110, `possessions = ${poss}, hors plage attendue`);
});

test('buildTeamSnapshot sur un seul match retombe exactement sur les stats brutes', () => {
  const game: GameForTeam = {
    date: '2023-10-05T16:00:00Z',
    isHome: true,
    own: minnesotaStats,
    opponentPoints: 99,
    won: true,
  };
  const snapshot = buildTeamSnapshot([game]);
  assert.equal(snapshot.gamesPlayed, 1);
  assert.equal(snapshot.pointsPerGame, 111);
  assert.equal(snapshot.opponentPointsPerGame, 99);
  assert.equal(snapshot.recentForm.length, 1);
  assert.equal(snapshot.recentForm[0], 'w');
  assert.equal(snapshot.homeWinPct, 100);
});

test('buildTeamSnapshot moyenne correctement sur plusieurs matchs', () => {
  const gameA: GameForTeam = { date: '2023-10-05T16:00:00Z', isHome: true, own: minnesotaStats, opponentPoints: 99, won: true };
  const gameB: GameForTeam = { date: '2023-10-08T16:00:00Z', isHome: false, own: dallasStats, opponentPoints: 111, won: false };
  const snapshot = buildTeamSnapshot([gameA, gameB]);
  assert.equal(snapshot.gamesPlayed, 2);
  assert.equal(snapshot.pointsPerGame, (111 + 99) / 2);
  assert.equal(snapshot.recentForm.join(''), 'wl');
  // un seul match à domicile dans ce lot (gameA, gagné) -> 100%
  assert.equal(snapshot.homeWinPct, 100);
});

test('buildTeamSnapshot sur 0 match ne plante pas (retourne des zéros, jamais NaN)', () => {
  const snapshot = buildTeamSnapshot([]);
  assert.equal(snapshot.gamesPlayed, 0);
  assert.equal(Number.isNaN(snapshot.pointsPerGame), false);
});

test('predictMatch favorise la meilleure équipe (net rating supérieur)', () => {
  const strongTeam: GameForTeam[] = Array.from({ length: 10 }, (_, i) => ({
    date: `2023-10-${10 + i}T16:00:00Z`,
    isHome: true,
    own: { ...minnesotaStats, fieldGoalsMade: 45, turnovers: 10 },
    opponentPoints: 95,
    won: true,
  }));
  const weakTeam: GameForTeam[] = Array.from({ length: 10 }, (_, i) => ({
    date: `2023-10-${10 + i}T16:00:00Z`,
    isHome: false,
    own: { ...dallasStats, fieldGoalsMade: 30, turnovers: 20 },
    opponentPoints: 115,
    won: false,
  }));

  const prediction = predictMatch(buildTeamSnapshot(strongTeam), buildTeamSnapshot(weakTeam));
  assert.equal(prediction.favoredSide, 'home');
  assert.ok(prediction.winProbabilities.homeWinPct > prediction.winProbabilities.awayWinPct);
  assert.ok(prediction.confidence >= 50 && prediction.confidence <= 95, `confidence hors bornes : ${prediction.confidence}`);
});

test('predictMatch sur deux équipes identiques reste proche de 50/50 (avantage domicile seulement)', () => {
  const games: GameForTeam[] = Array.from({ length: 10 }, (_, i) => ({
    date: `2023-10-${10 + i}T16:00:00Z`,
    isHome: true,
    own: minnesotaStats,
    opponentPoints: 105,
    won: true,
  }));
  const sameSnapshot = buildTeamSnapshot(games);
  const prediction = predictMatch(sameSnapshot, sameSnapshot);
  assert.ok(
    Math.abs(prediction.winProbabilities.homeWinPct - prediction.winProbabilities.awayWinPct) < 15,
    `écart trop grand pour des équipes identiques : home=${prediction.winProbabilities.homeWinPct} away=${prediction.winProbabilities.awayWinPct}`
  );
});

test('winProbabilities somme toujours à 100', () => {
  const games: GameForTeam[] = [{ date: '2023-10-05T16:00:00Z', isHome: true, own: minnesotaStats, opponentPoints: 99, won: true }];
  const prediction = predictMatch(buildTeamSnapshot(games), buildTeamSnapshot(games));
  const { homeWinPct, closeGamePct, awayWinPct } = prediction.winProbabilities;
  assert.equal(homeWinPct + closeGamePct + awayWinPct, 100);
});

test('computeRestDays calcule correctement un écart de jours', () => {
  const days = computeRestDays('2023-10-05T16:00:00Z', new Date('2023-10-08T16:00:00Z'));
  assert.equal(days, 3);
});

test('computeRestDays renvoie 0 si pas de match précédent', () => {
  assert.equal(computeRestDays(null, new Date()), 0);
});

test('buildTeamSnapshot expose recentPointsTrend dans le bon ordre chronologique', () => {
  const gameA: GameForTeam = { date: '2023-10-05T16:00:00Z', isHome: true, own: minnesotaStats, opponentPoints: 99, won: true };
  const gameB: GameForTeam = { date: '2023-10-08T16:00:00Z', isHome: false, own: dallasStats, opponentPoints: 111, won: false };
  const snapshot = buildTeamSnapshot([gameA, gameB]);
  assert.deepEqual(snapshot.recentPointsTrend, [111, 99]);
});

test('buildRadarProfile reste borné entre 0 et 100', () => {
  const games: GameForTeam[] = Array.from({ length: 10 }, (_, i) => ({
    date: `2023-10-${10 + i}T16:00:00Z`,
    isHome: true,
    own: minnesotaStats,
    opponentPoints: 99,
    won: true,
  }));
  const snapshot = buildTeamSnapshot(games);
  const radar = buildRadarProfile(snapshot, snapshot);
  for (const v of [...radar.homeValues, ...radar.awayValues]) {
    assert.ok(v >= 0 && v <= 100, `valeur radar hors bornes : ${v}`);
  }
});

test('buildRadarProfile retourne les 6 axes attendus', () => {
  const games: GameForTeam[] = [{ date: '2023-10-05T16:00:00Z', isHome: true, own: minnesotaStats, opponentPoints: 99, won: true }];
  const snapshot = buildTeamSnapshot(games);
  const radar = buildRadarProfile(snapshot, snapshot);
  assert.deepEqual(radar.labels, ['Attaque', 'Défense', 'Rebonds', 'Passes', 'Forme', 'Domicile']);
  assert.equal(radar.homeValues.length, 6);
  assert.equal(radar.awayValues.length, 6);
});

console.log(`\n${passed}/${passed} tests passés.`);
