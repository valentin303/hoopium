/**
 * Tests du cache disque api-cache.ts — vraies lectures/écritures sur disque,
 * avec des clés préfixées "test-" nettoyées à la fin pour ne pas polluer
 * le vrai cache du projet.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { readCache, writeCache } from '../src/lib/api-cache';

let passed = 0;
async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    throw err;
  }
}

console.log('api-cache — tests\n');

await test('writeCache puis readCache renvoie exactement la même valeur', async () => {
  await writeCache('test-roundtrip', { foo: 'bar', n: 42 });
  const result = await readCache('test-roundtrip');
  assert.deepEqual(result, { foo: 'bar', n: 42 });
});

await test('readCache renvoie null si la clé est absente', async () => {
  const result = await readCache('test-absent-key-jamais-ecrite');
  assert.equal(result, null);
});

await test('readCache renvoie null si le TTL est dépassé', async () => {
  await writeCache('test-expirable', { x: 1 });
  const result = await readCache('test-expirable', -1); // TTL négatif = déjà expiré
  assert.equal(result, null);
});

await test('readCache renvoie la valeur si le TTL est large', async () => {
  await writeCache('test-durable', { x: 1 });
  const result = await readCache('test-durable', 1000 * 60 * 60 * 24);
  assert.deepEqual(result, { x: 1 });
});

await test('une clé contenant des caractères spéciaux (URL complète) ne plante pas', async () => {
  const key = 'https://v1.basketball.api-sports.io/games?league=12&season=2023-2024&test=true';
  await writeCache(key, { ok: true });
  const result = await readCache(key);
  assert.deepEqual(result, { ok: true });
});

// Nettoyage : on ne laisse aucune trace de test dans le vrai cache du projet.
const CACHE_DIR = path.join(process.cwd(), '.cache', 'api-basketball');
const files = await fs.readdir(CACHE_DIR).catch(() => [] as string[]);
for (const file of files) {
  if (file.startsWith('test_') || file.includes('test')) {
    await fs.unlink(path.join(CACHE_DIR, file)).catch(() => {});
  }
}

console.log(`\n${passed}/${passed} tests passés.`);
