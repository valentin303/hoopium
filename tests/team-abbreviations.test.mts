/**
 * Tests de teamAbbreviation — vérifie que les cas où l'ancien calcul
 * (3 premières lettres) se trompait sont maintenant corrects.
 */

import assert from 'node:assert/strict';
import { teamAbbreviation } from '../src/lib/team-abbreviations';

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

console.log('teamAbbreviation — tests\n');

test('Los Angeles Lakers -> LAL (pas LOS, le bug original)', () => {
  assert.equal(teamAbbreviation('Los Angeles Lakers'), 'LAL');
});

test('Los Angeles Clippers -> LAC (distinct des Lakers malgré le même nom de ville)', () => {
  assert.equal(teamAbbreviation('Los Angeles Clippers'), 'LAC');
});

test('Golden State Warriors -> GSW (pas GOL)', () => {
  assert.equal(teamAbbreviation('Golden State Warriors'), 'GSW');
});

test('New York Knicks -> NYK (pas NEW)', () => {
  assert.equal(teamAbbreviation('New York Knicks'), 'NYK');
});

test('Toutes les 30 équipes NBA officielles ont une abréviation à 3 lettres', () => {
  const names = [
    'Atlanta Hawks', 'Boston Celtics', 'Brooklyn Nets', 'Charlotte Hornets', 'Chicago Bulls',
    'Cleveland Cavaliers', 'Dallas Mavericks', 'Denver Nuggets', 'Detroit Pistons',
    'Golden State Warriors', 'Houston Rockets', 'Indiana Pacers', 'Los Angeles Clippers',
    'Los Angeles Lakers', 'Memphis Grizzlies', 'Miami Heat', 'Milwaukee Bucks',
    'Minnesota Timberwolves', 'New Orleans Pelicans', 'New York Knicks', 'Oklahoma City Thunder',
    'Orlando Magic', 'Philadelphia 76ers', 'Phoenix Suns', 'Portland Trail Blazers',
    'Sacramento Kings', 'San Antonio Spurs', 'Toronto Raptors', 'Utah Jazz', 'Washington Wizards',
  ];
  for (const name of names) {
    const abbr = teamAbbreviation(name);
    assert.equal(abbr.length, 3, `${name} -> "${abbr}" n'a pas 3 lettres`);
  }
  assert.equal(names.length, 30);
});

test('équipe inconnue (hors NBA) retombe sur le calcul par défaut, sans planter', () => {
  assert.equal(teamAbbreviation('Real Madrid'), 'REA');
});

console.log(`\n${passed}/${passed} tests passés.`);
