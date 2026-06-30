/**
 * Tests de extractRecentGamesForTeam — la logique de sélection des matchs
 * récents d'une équipe, qui alimente le moteur de calcul. Aucun réseau ici :
 * un faux calendrier reproduisant la forme réelle de /games.
 */

import assert from 'node:assert/strict';
import { extractRecentGamesForTeam, extractHeadToHead, extractHalftimePoints } from '../src/lib/nba-provider';

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

function fakeGame(opts: {
  id: number;
  timestamp: number;
  status?: string;
  homeId: string;
  awayId: string;
  homeScore?: number | null;
  awayScore?: number | null;
  homeQ1?: number | null;
  homeQ2?: number | null;
  awayQ1?: number | null;
  awayQ2?: number | null;
}) {
  return {
    id: opts.id,
    date: new Date(opts.timestamp * 1000).toISOString(),
    time: '00:00',
    timestamp: opts.timestamp,
    status: { long: '', short: opts.status ?? 'FT' },
    league: { id: 12, name: 'NBA', season: '2023-2024' },
    teams: {
      home: { id: Number(opts.homeId), name: 'Home', logo: '' },
      away: { id: Number(opts.awayId), name: 'Away', logo: '' },
    },
    scores: {
      home: { quarter_1: opts.homeQ1 ?? null, quarter_2: opts.homeQ2 ?? null, quarter_3: null, quarter_4: null, total: opts.homeScore ?? 100 },
      away: { quarter_1: opts.awayQ1 ?? null, quarter_2: opts.awayQ2 ?? null, quarter_3: null, quarter_4: null, total: opts.awayScore ?? 95 },
    },
  };
}

console.log('extractRecentGamesForTeam — tests\n');

const TEAM_A = '149'; // Minnesota (id réel)
const TEAM_B = '138'; // Dallas (id réel)
const TEAM_C = '999'; // équipe non concernée

const referenceDate = new Date('2024-01-01T00:00:00Z');

test("sélectionne uniquement les matchs où l'équipe a joué", () => {
  const games = [
    fakeGame({ id: 1, timestamp: 1696000000, homeId: TEAM_A, awayId: TEAM_C, homeScore: 110, awayScore: 100 }),
    fakeGame({ id: 2, timestamp: 1696100000, homeId: TEAM_C, awayId: TEAM_B, homeScore: 90, awayScore: 95 }),
  ];
  const result = extractRecentGamesForTeam(games, TEAM_A, referenceDate, 10);
  assert.equal(result.length, 1);
  assert.equal(result[0].gameId, 1);
});

test('exclut les matchs non terminés (status différent de FT/AOT)', () => {
  const games = [
    fakeGame({ id: 1, timestamp: 1696000000, status: 'NS', homeId: TEAM_A, awayId: TEAM_B }),
    fakeGame({ id: 2, timestamp: 1696100000, status: 'FT', homeId: TEAM_A, awayId: TEAM_B }),
  ];
  const result = extractRecentGamesForTeam(games, TEAM_A, referenceDate, 10);
  assert.equal(result.length, 1);
  assert.equal(result[0].gameId, 2);
});

test('exclut les matchs après la date de référence', () => {
  const futureTimestamp = Math.floor(new Date('2024-06-01T00:00:00Z').getTime() / 1000);
  const games = [
    fakeGame({ id: 1, timestamp: 1696000000, homeId: TEAM_A, awayId: TEAM_B }),
    fakeGame({ id: 2, timestamp: futureTimestamp, homeId: TEAM_A, awayId: TEAM_B }),
  ];
  const result = extractRecentGamesForTeam(games, TEAM_A, referenceDate, 10);
  assert.equal(result.length, 1);
  assert.equal(result[0].gameId, 1);
});

test('respecte la limite maxGames en gardant les plus récents', () => {
  const games = Array.from({ length: 5 }, (_, i) =>
    fakeGame({ id: i, timestamp: 1696000000 + i * 100000, homeId: TEAM_A, awayId: TEAM_B })
  );
  const result = extractRecentGamesForTeam(games, TEAM_A, referenceDate, 2);
  assert.equal(result.length, 2);
  // les 2 plus récents = id 3 et id 4
  assert.deepEqual(result.map((g) => g.gameId).sort(), [3, 4]);
});

test('détecte correctement isHome et le résultat (won) selon le côté', () => {
  const games = [
    fakeGame({ id: 1, timestamp: 1696000000, homeId: TEAM_A, awayId: TEAM_B, homeScore: 111, awayScore: 99 }),
    fakeGame({ id: 2, timestamp: 1696100000, homeId: TEAM_B, awayId: TEAM_A, homeScore: 105, awayScore: 110 }),
  ];
  const result = extractRecentGamesForTeam(games, TEAM_A, referenceDate, 10);
  const asHome = result.find((g) => g.gameId === 1)!;
  const asAway = result.find((g) => g.gameId === 2)!;

  assert.equal(asHome.isHome, true);
  assert.equal(asHome.won, true);
  assert.equal(asHome.opponentPoints, 99);

  assert.equal(asAway.isHome, false);
  assert.equal(asAway.won, true); // TEAM_A a marqué 110 en visiteur, gagné
  assert.equal(asAway.opponentPoints, 105);
});

test('renvoie un tableau vide si aucun match ne correspond, sans planter', () => {
  const result = extractRecentGamesForTeam([], TEAM_A, referenceDate, 10);
  assert.deepEqual(result, []);
});

console.log('\nextractHeadToHead — tests\n');

test('extractHeadToHead ne garde que les confrontations entre les deux équipes données', () => {
  const games = [
    fakeGame({ id: 1, timestamp: 1696000000, homeId: TEAM_A, awayId: TEAM_B, homeScore: 110, awayScore: 100 }),
    fakeGame({ id: 2, timestamp: 1696100000, homeId: TEAM_A, awayId: TEAM_C, homeScore: 90, awayScore: 95 }),
    fakeGame({ id: 3, timestamp: 1696200000, homeId: TEAM_B, awayId: TEAM_A, homeScore: 105, awayScore: 108 }),
  ];
  const result = extractHeadToHead(games, TEAM_A, TEAM_B, referenceDate, 10);
  assert.equal(result.length, 2);
});

test('extractHeadToHead trie du plus récent au plus ancien', () => {
  const games = [
    fakeGame({ id: 1, timestamp: 1696000000, homeId: TEAM_A, awayId: TEAM_B }),
    fakeGame({ id: 2, timestamp: 1696200000, homeId: TEAM_A, awayId: TEAM_B }),
  ];
  const result = extractHeadToHead(games, TEAM_A, TEAM_B, referenceDate, 10);
  assert.ok(new Date(result[0].date).getTime() > new Date(result[1].date).getTime());
});

test("extractHeadToHead n'invente jamais de matchs : 0 confrontation réelle -> tableau vide", () => {
  const games = [fakeGame({ id: 1, timestamp: 1696000000, homeId: TEAM_A, awayId: TEAM_C })];
  const result = extractHeadToHead(games, TEAM_A, TEAM_B, referenceDate, 10);
  assert.deepEqual(result, []);
});

console.log('\nextractHalftimePoints — tests\n');

test('calcule q1+q2 pour une équipe à domicile', () => {
  const games = [
    fakeGame({ id: 1, timestamp: 1696000000, homeId: TEAM_A, awayId: TEAM_B, homeQ1: 28, homeQ2: 25 }),
  ];
  const result = extractHalftimePoints(games, TEAM_A, referenceDate, 10);
  assert.deepEqual(result, [53]);
});

test('calcule q1+q2 pour une équipe à l\'extérieur (lit la bonne colonne)', () => {
  const games = [
    fakeGame({ id: 1, timestamp: 1696000000, homeId: TEAM_B, awayId: TEAM_A, awayQ1: 22, awayQ2: 30 }),
  ];
  const result = extractHalftimePoints(games, TEAM_A, referenceDate, 10);
  assert.deepEqual(result, [52]);
});

test('ignore un match sans quart-temps détaillés plutôt que de fausser la moyenne avec un zéro', () => {
  const games = [
    fakeGame({ id: 1, timestamp: 1696000000, homeId: TEAM_A, awayId: TEAM_B, homeQ1: 28, homeQ2: 25 }),
    fakeGame({ id: 2, timestamp: 1696100000, homeId: TEAM_A, awayId: TEAM_B }), // pas de quarter_1/2
  ];
  const result = extractHalftimePoints(games, TEAM_A, referenceDate, 10);
  assert.deepEqual(result, [53]);
});

test('tableau vide si aucun match ne correspond, sans planter', () => {
  const result = extractHalftimePoints([], TEAM_A, referenceDate, 10);
  assert.deepEqual(result, []);
});

console.log(`\n${passed}/${passed} tests passés.`);
