/**
 * Tests de la file d'attente globale dans nba-provider.ts (apiNbaFetch).
 *
 * apiNbaFetch n'est pas exporté (c'est un détail d'implémentation), donc on
 * passe par fetchGameStatistics, qui l'utilise directement, avec un faux
 * `fetch` pour mesurer précisément l'espacement réel entre les appels et
 * vérifier qu'un appel identique en double n'est jamais réémis.
 */

process.env.NBA_API_KEY = 'fake-key-for-rate-limit-test';

const callTimestamps: number[] = [];
const realFetch = globalThis.fetch;

globalThis.fetch = (async () => {
  callTimestamps.push(Date.now());
  return {
    ok: true,
    json: async () => ({ get: 'x', parameters: {}, errors: [], results: 1, response: [] }),
  };
}) as unknown as typeof fetch;

const { fetchGameStatistics } = await import('../src/lib/nba-provider');

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

console.log('File d\'attente globale (apiNbaFetch) — tests\n');

await test('trois appels distincts sont espacés d\'au moins ~6.5s (pas envoyés en rafale)', async () => {
  callTimestamps.length = 0;
  await Promise.all([fetchGameStatistics(900001), fetchGameStatistics(900002), fetchGameStatistics(900003)]);

  if (callTimestamps.length !== 3) {
    throw new Error(`Attendu 3 appels réseau, obtenu ${callTimestamps.length}`);
  }
  const gaps = [callTimestamps[1] - callTimestamps[0], callTimestamps[2] - callTimestamps[1]];
  for (const gap of gaps) {
    if (gap < 6300) {
      throw new Error(`Écart trop court entre deux appels : ${gap}ms (attendu ~6500ms)`);
    }
  }
});

await test('un appel identique lancé deux fois en parallèle ne déclenche le réseau qu\'une fois', async () => {
  callTimestamps.length = 0;
  const [a, b] = await Promise.all([fetchGameStatistics(900099), fetchGameStatistics(900099)]);

  if (callTimestamps.length !== 1) {
    throw new Error(`Attendu 1 seul appel réseau pour une clé identique en double, obtenu ${callTimestamps.length}`);
  }
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error('Les deux appels auraient dû renvoyer exactement la même réponse (servie depuis le cache).');
  }
});

globalThis.fetch = realFetch;

// Nettoyage des entrées de cache créées par ce test.
const fs = await import('node:fs/promises');
const path = await import('node:path');
const CACHE_DIR = path.join(process.cwd(), '.cache', 'api-basketball');
const files = await fs.readdir(CACHE_DIR).catch(() => [] as string[]);
for (const file of files) {
  if (file.includes('90000') || file.includes('900099')) {
    await fs.unlink(path.join(CACHE_DIR, file)).catch(() => {});
  }
}

console.log(`\n${passed}/${passed} tests passés.`);
