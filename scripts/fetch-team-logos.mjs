#!/usr/bin/env node
/**
 * Récupère les vrais logos des équipes utilisées dans src/lib/mock-data.ts
 * et les met en cache localement, une fois pour toutes.
 *
 * Pourquoi : les données de démo (mock-data.ts) ne doivent pas dépendre de
 * l'API à chaque visite. On résout chaque équipe via /teams (4 requêtes au
 * total, une par ligue — le quota journalier de 100 n'est quasiment pas
 * touché), on télécharge l'image, et on écrit le résultat dans
 * src/lib/team-logos.json. Les téléchargements d'images/logos eux-mêmes ne
 * comptent pas dans le quota journalier API-Sports (cf. doc fournisseur).
 *
 * Usage :
 *   node --env-file=.env.local scripts/fetch-team-logos.mjs
 *   (ou simplement `node scripts/fetch-team-logos.mjs` si NBA_API_KEY est
 *   déjà exportée dans l'environnement)
 *
 * Sans réseau vers api-sports.io, ce script ne peut pas tourner (c'est le
 * cas du sandbox Claude — il doit être lancé depuis une machine avec accès
 * internet normal, en local ou en CI).
 *
 * Philosophie : si une équipe ne peut pas être identifiée avec certitude
 * dans la réponse de l'API, on la laisse de côté plutôt que de deviner —
 * elle retombera sur les initiales (fallback déjà géré par TeamLogo.tsx).
 * Jamais de logo associé à la mauvaise équipe.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ===== Config réseau =====

const API_BASE_URL = 'https://v1.basketball.api-sports.io';

async function loadApiKey() {
  if (process.env.NBA_API_KEY) return process.env.NBA_API_KEY;

  // Fallback : parse minimaliste de .env.local si la clé n'est pas déjà
  // dans l'environnement (utile si on lance juste `node scripts/...`).
  try {
    const envPath = path.join(ROOT, '.env.local');
    const content = await fs.readFile(envPath, 'utf-8');
    const match = content.match(/^NBA_API_KEY=(.*)$/m);
    if (match) return match[1].trim().replace(/^["']|["']$/g, '');
  } catch {
    // .env.local absent ou illisible — on continue, l'erreur sera claire plus bas.
  }
  return null;
}

// ===== Config des ligues — doit rester synchro avec src/lib/nba-provider.ts =====

const LEAGUE_CONFIG = {
  nba: { id: 12, season: '2025-2026' },
  wnba: { id: 13, season: '2026' },
  euroleague: { id: 120, season: '2025' },
  ncaa: { id: 116, season: '2025-2026' },
};

// ===== Équipes utilisées dans mock-data.ts =====
// `name` = terme de recherche le plus distinctif possible (pour éviter les
// faux positifs, ex. "Kansas" seul matcherait aussi "Kansas State").
// `aliases` = tentatives de repli si `name` ne trouve rien.

const TEAMS_TO_FETCH = [
  { internalId: 'lal', league: 'nba', name: 'Los Angeles Lakers', aliases: ['Lakers'] },
  { internalId: 'bos', league: 'nba', name: 'Boston Celtics', aliases: ['Celtics'] },
  { internalId: 'den', league: 'nba', name: 'Denver Nuggets', aliases: ['Nuggets'] },
  { internalId: 'phx', league: 'nba', name: 'Phoenix Suns', aliases: ['Suns'] },
  { internalId: 'mia', league: 'nba', name: 'Miami Heat', aliases: ['Heat'] },
  { internalId: 'chi', league: 'nba', name: 'Chicago Bulls', aliases: ['Bulls'] },
  { internalId: 'gsw', league: 'nba', name: 'Golden State Warriors', aliases: ['Warriors'] },
  { internalId: 'mil', league: 'nba', name: 'Milwaukee Bucks', aliases: ['Bucks'] },
  { internalId: 'phi', league: 'nba', name: 'Philadelphia 76ers', aliases: ['76ers', 'Sixers'] },
  { internalId: 'nyk', league: 'nba', name: 'New York Knicks', aliases: ['Knicks'] },
  { internalId: 'ny-lib', league: 'wnba', name: 'New York Liberty', aliases: ['Liberty'] },
  { internalId: 'lv-aces', league: 'wnba', name: 'Las Vegas Aces', aliases: ['Aces'] },
  { internalId: 'rma', league: 'euroleague', name: 'Real Madrid', aliases: [] },
  { internalId: 'bar', league: 'euroleague', name: 'FC Barcelona', aliases: ['Barcelona', 'Barcelone'] },
  { internalId: 'duke', league: 'ncaa', name: 'Duke Blue Devils', aliases: ['Duke'] },
  { internalId: 'ku', league: 'ncaa', name: 'Kansas Jayhawks', aliases: ['Kansas'] },
];

// ===== Aide à l'appariement nom recherché <-> nom retourné par l'API =====

function normalize(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Tente de trouver l'équipe correspondant à `searchName` dans `apiTeams`.
 * Retourne null (sans deviner) si aucune correspondance fiable n'est trouvée,
 * ou si plusieurs équipes matchent de façon ambiguë.
 */
function matchTeam(apiTeams, searchName) {
  const target = normalize(searchName);

  const exact = apiTeams.filter((t) => normalize(t.name) === target);
  if (exact.length === 1) return exact[0];

  const contains = apiTeams.filter((t) => {
    const n = normalize(t.name);
    return n.includes(target) || target.includes(n);
  });
  if (contains.length === 1) return contains[0];
  if (contains.length > 1) {
    console.warn(
      `  ⚠ Ambigu pour "${searchName}" : ${contains.map((t) => t.name).join(', ')} — ignoré.`
    );
  }
  return null;
}

// ===== Réseau =====

async function apiFetch(apiKey, endpoint, params) {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const res = await fetch(url.toString(), { headers: { 'x-apisports-key': apiKey } });
  if (!res.ok) {
    throw new Error(`API-Basketball a répondu ${res.status} pour ${endpoint}`);
  }
  const data = await res.json();
  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(`API-Basketball erreur pour ${endpoint} : ${JSON.stringify(data.errors)}`);
  }
  return data.response;
}

async function downloadLogo(logoUrl, internalId) {
  const res = await fetch(logoUrl);
  if (!res.ok) throw new Error(`Téléchargement logo échoué (${res.status}) : ${logoUrl}`);

  const ext = path.extname(new URL(logoUrl).pathname) || '.png';
  const fileName = `${internalId}${ext}`;
  const destDir = path.join(ROOT, 'public', 'images', 'team-logos');
  await fs.mkdir(destDir, { recursive: true });

  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(path.join(destDir, fileName), buffer);

  return `/images/team-logos/${fileName}`;
}

// ===== Programme principal =====

async function main() {
  const apiKey = await loadApiKey();
  if (!apiKey) {
    console.error(
      '✗ NBA_API_KEY introuvable (ni dans process.env, ni dans .env.local).\n' +
      "  Lance plutôt : node --env-file=.env.local scripts/fetch-team-logos.mjs"
    );
    process.exit(1);
  }

  const leaguesNeeded = [...new Set(TEAMS_TO_FETCH.map((t) => t.league))];
  const teamsByLeague = {};

  console.log(`→ Récupération des effectifs pour ${leaguesNeeded.length} ligue(s)...`);
  for (const league of leaguesNeeded) {
    const { id, season } = LEAGUE_CONFIG[league];
    try {
      const teams = await apiFetch(apiKey, '/teams', { league: id, season });
      teamsByLeague[league] = teams;
      console.log(`  ✓ ${league} : ${teams.length} équipes reçues.`);
    } catch (err) {
      console.error(`  ✗ ${league} : ${err.message}`);
      teamsByLeague[league] = [];
    }
  }

  const result = {};
  const unmatched = [];

  for (const team of TEAMS_TO_FETCH) {
    const apiTeams = teamsByLeague[team.league] ?? [];
    const candidates = [team.name, ...team.aliases];

    let match = null;
    for (const candidate of candidates) {
      match = matchTeam(apiTeams, candidate);
      if (match) break;
    }

    if (!match || !match.logo) {
      unmatched.push(team);
      console.warn(`  ⚠ Aucune correspondance fiable pour "${team.name}" (${team.league}).`);
      continue;
    }

    try {
      const localPath = await downloadLogo(match.logo, team.internalId);
      result[team.internalId] = localPath;
      console.log(`  ✓ ${team.name} → ${localPath}`);
    } catch (err) {
      unmatched.push(team);
      console.warn(`  ⚠ Téléchargement échoué pour "${team.name}" : ${err.message}`);
    }
  }

  const outPath = path.join(ROOT, 'src', 'lib', 'team-logos.json');
  const sorted = Object.fromEntries(Object.keys(result).sort().map((k) => [k, result[k]]));
  await fs.writeFile(outPath, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');

  console.log(`\n${Object.keys(result).length}/${TEAMS_TO_FETCH.length} logos résolus et écrits dans src/lib/team-logos.json`);
  if (unmatched.length > 0) {
    console.log(
      `${unmatched.length} équipe(s) non résolue(s) (fallback initiales) : ` +
      unmatched.map((t) => t.name).join(', ')
    );
    console.log('Ajuste `name`/`aliases` dans TEAMS_TO_FETCH ci-dessus puis relance si besoin.');
  }
}

main().catch((err) => {
  console.error('✗ Échec du script :', err.message);
  process.exit(1);
});
