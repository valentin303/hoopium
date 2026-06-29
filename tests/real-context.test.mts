/**
 * Tests des fonctions pures utilisées pour le contexte de match réel
 * (src/lib/real-analysis.ts et src/lib/nba-provider.ts). Aucun réseau ici.
 */

import assert from 'node:assert/strict';
import { computeStreak } from '../src/lib/real-analysis';
import { findTeamStanding } from '../src/lib/nba-provider';
import type { RawStanding } from '../src/lib/nba-provider';

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

console.log('computeStreak — tests\n');

test('détecte une série de victoires en cours', () => {
  const result = computeStreak(['l', 'w', 'w', 'w', 'w']);
  assert.deepEqual(result, { count: 4, type: 'w' });
});

test('détecte une série de défaites en cours', () => {
  const result = computeStreak(['w', 'w', 'l', 'l']);
  assert.deepEqual(result, { count: 2, type: 'l' });
});

test('un seul match joué -> série de 1', () => {
  const result = computeStreak(['w']);
  assert.deepEqual(result, { count: 1, type: 'w' });
});

test('tableau vide -> null (jamais inventé)', () => {
  const result = computeStreak([]);
  assert.equal(result, null);
});

test('alternance stricte -> série de 1 seulement', () => {
  const result = computeStreak(['w', 'l', 'w', 'l']);
  assert.deepEqual(result, { count: 1, type: 'l' });
});

console.log('\nfindTeamStanding — tests\n');

function fakeStanding(teamId: number, position: number, group = 'Western Conference'): RawStanding {
  return {
    position,
    stage: 'NBA - Regular Season',
    group: { name: group, points: 0 },
    team: { id: teamId, name: `Team ${teamId}`, logo: '' },
    league: { id: 12, name: 'NBA', season: '2023-2024' },
    games: { played: 82, win: { total: 50, percentage: '0.610' }, lose: { total: 32, percentage: '0.390' } },
    points: { for: 9000, against: 8800 },
    form: null,
    description: null,
  };
}

test('trouve une équipe quel que soit son groupe (tableau de tableaux)', () => {
  const standings: RawStanding[][] = [
    [fakeStanding(145, 3, 'Western Conference'), fakeStanding(139, 1, 'Western Conference')],
    [fakeStanding(133, 5, 'Eastern Conference')],
  ];
  const result = findTeamStanding(standings, '133');
  assert.equal(result?.position, 5);
  assert.equal(result?.group.name, 'Eastern Conference');
});

test('renvoie undefined si l\'équipe est absente (jamais inventé)', () => {
  const standings: RawStanding[][] = [[fakeStanding(145, 3)]];
  const result = findTeamStanding(standings, '999');
  assert.equal(result, undefined);
});

console.log(`\n${passed}/${passed} tests passés.`);
