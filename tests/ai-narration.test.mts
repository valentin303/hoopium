/**
 * Tests de buildNarrationPrompt — vérifie que le prompt contient bien les
 * vrais chiffres calculés (pas de réseau ici, juste de la construction de
 * texte). L'appel réel à narrateAnalysis() nécessite ANTHROPIC_API_KEY et
 * n'est donc pas testé automatiquement ici.
 */

import assert from 'node:assert/strict';
import { buildNarrationPrompt } from '../src/lib/ai-narration';
import type { TeamSnapshot, MatchPrediction } from '../src/lib/stats-engine';
import type { Match } from '../src/types';

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

function fakeSnapshot(overrides: Partial<TeamSnapshot> = {}): TeamSnapshot {
  return {
    gamesPlayed: 10,
    pointsPerGame: 112.3,
    opponentPointsPerGame: 105.1,
    offensiveRating: 116.4,
    defensiveRating: 109.2,
    netRating: 7.2,
    threePointPct: 37.5,
    reboundsPerGame: 44.1,
    assistsPerGame: 26.8,
    turnoversPerGame: 13.2,
    recentForm: ['w', 'w', 'l', 'w', 'w'],
    recentPointsTrend: [108, 115, 99, 120, 112],
    homeWinPct: 70,
    lastGameDate: '2024-04-10T00:00:00Z',
    ...overrides,
  };
}

const fakeMatch = {
  id: 'lal-bos-test',
  league: 'nba',
  startTime: '2026-06-17T21:30:00+02:00',
  homeTeam: { id: 'lal', name: 'Lakers', abbreviation: 'LAL', record: '', form: { results: [] } },
  awayTeam: { id: 'bos', name: 'Celtics', abbreviation: 'BOS', record: '', form: { results: [] } },
  confidence: 81,
  confidenceLevel: 'high',
  status: 'scheduled',
} as unknown as Match;

const fakePrediction: MatchPrediction = {
  predictedHomeScore: 111,
  predictedAwayScore: 118,
  totalPointsPredicted: 229,
  spreadPredicted: -7,
  confidence: 81,
  favoredSide: 'away',
  winProbabilities: { homeWinPct: 19, closeGamePct: 8, awayWinPct: 73 },
};

console.log('buildNarrationPrompt — tests\n');

test('contient les vrais noms des deux équipes', () => {
  const prompt = buildNarrationPrompt(fakeMatch, fakeSnapshot(), fakeSnapshot(), fakePrediction);
  assert.ok(prompt.includes('Lakers'));
  assert.ok(prompt.includes('Celtics'));
});

test('contient le score prédit exact, sans arrondi ni modification', () => {
  const prompt = buildNarrationPrompt(fakeMatch, fakeSnapshot(), fakeSnapshot(), fakePrediction);
  assert.ok(prompt.includes('111'));
  assert.ok(prompt.includes('118'));
  assert.ok(prompt.includes('81%'));
});

test('contient les probabilités exactes des trois issues', () => {
  const prompt = buildNarrationPrompt(fakeMatch, fakeSnapshot(), fakeSnapshot(), fakePrediction);
  assert.ok(prompt.includes('19%'));
  assert.ok(prompt.includes('8%'));
  assert.ok(prompt.includes('73%'));
});

test('contient les vraies stats de chaque équipe (pas génériques)', () => {
  const home = fakeSnapshot({ pointsPerGame: 119.9, threePointPct: 41.2 });
  const away = fakeSnapshot({ pointsPerGame: 101.4, threePointPct: 33.1 });
  const prompt = buildNarrationPrompt(fakeMatch, home, away, fakePrediction);
  assert.ok(prompt.includes('119.9'));
  assert.ok(prompt.includes('41.2'));
  assert.ok(prompt.includes('101.4'));
  assert.ok(prompt.includes('33.1'));
});

test("insiste explicitement sur l'interdiction de modifier les chiffres", () => {
  const prompt = buildNarrationPrompt(fakeMatch, fakeSnapshot(), fakeSnapshot(), fakePrediction);
  assert.ok(/JAMAIS/i.test(prompt) || /ne pas modifier/i.test(prompt));
});

console.log(`\n${passed}/${passed} tests passés.`);
