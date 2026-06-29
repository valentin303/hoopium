/**
 * Cache disque pour les réponses API-Basketball.
 *
 * Pourquoi un cache maison plutôt que de compter sur `next: { revalidate }`
 * de Next.js : ce cache n'est pas garanti fiable en `next dev` (Turbopack
 * recompile et peut le réinitialiser), ce qui a fait brûler le quota
 * gratuit (100 req/jour) en quelques rechargements de page pendant les
 * tests — et produit des résultats instables (matchs ignorés au hasard
 * selon ce qui a échoué). Un cache sur disque survit aux rechargements.
 *
 * Particulièrement adapté aux matchs déjà terminés (statut FT/AOT) : leurs
 * stats ne changeront plus jamais, donc un TTL long ne risque jamais de
 * servir une donnée obsolète, que ce soit en saison de test (2023-2024,
 * entièrement figée) ou en production (un match joué reste joué).
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const CACHE_DIR = path.join(process.cwd(), '.cache', 'api-basketball');
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function keyToFilePath(key: string): string {
  const safe = key.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(CACHE_DIR, `${safe}.json`);
}

interface CacheEntry<T> {
  cachedAt: number;
  value: T;
}

export async function readCache<T>(key: string, ttlMs = DEFAULT_TTL_MS): Promise<T | null> {
  try {
    const raw = await fs.readFile(keyToFilePath(key), 'utf-8');
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.cachedAt > ttlMs) return null;
    return entry.value;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, value: T): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const entry: CacheEntry<T> = { cachedAt: Date.now(), value };
  await fs.writeFile(keyToFilePath(key), JSON.stringify(entry), 'utf-8');
}
