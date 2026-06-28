#!/usr/bin/env node
/**
 * Construit la fiche équipe complète (registre) pour toutes les ligues
 * couvertes, et en dérive le mapping logos utilisé par mock-data.ts.
 *
 * Deux fichiers produits :
 *   - src/lib/teams-registry.json  → TOUTES les équipes reçues de l'API
 *     pour chaque ligue (id API, nom, logo local). Base pour les futures
 *     "feuilles de match" : on y pioche n'importe quelle équipe par son id.
 *   - src/lib/team-logos.json      → mapping id-interne -> logo, pour les
 *     16 équipes utilisées dans mock-data.ts (compat avec l'existant).
 *
 * Coût API : 1 requête /teams par ligue (4 requêtes total), quel que soit
 * le nombre d'équipes retournées — l'API renvoie tout le roster d'un coup.
 * Les téléchargements d'images ne comptent pas dans le quota journalier.
 *
 * IMPORTANT — leçon du bug précédent : si une ligue échoue (réseau, clé
 * invalide, quota dépassé...), on NE TOUCHE PAS à ce qui existait déjà
 * pour cette ligue dans les fichiers de sortie. On fusionne ligue par
 * ligue, jamais un écrasement global. Un échec partiel ne peut donc plus
 * jamais effacer des logos déjà obtenus.
 *
 * Usage :
 *   node --env-file=.env.local scripts/fetch-teams-registry.mjs
 *
 * Sans réseau vers api-sports.io (cas du sandbox Claude), ce script ne
 * peut pas tourner — il doit être lancé depuis une machine avec accès
 * internet normal.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const REGISTRY_PATH = path.join(ROOT, 'src', 'lib', 'teams-registry.json');
const LEGACY_PATH = path.join(ROOT, 'src', 'lib', 'team-logos.json');

// ===== Config réseau =====

const API_BASE_URL = 'https://v1.basketball.api-sports.io';

async function loadApiKey() {
  if (process.env.NBA_API_KEY) return process.env.NBA_API_KEY;
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

// ===== Équipes utilisées dans mock-data.ts (mapping legacy) =====
// `name` = terme de recherche le plus distinctif possible.
// `aliases` = tentatives de repli si `name` ne trouve rien.

const MOCK_TEAMS = [
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

function matchTeamByName(apiTeams, searchName) {
  const target = normalize(searchName);

  const exact = apiTeams.filter((t) => normalize(t.name) === target);
  if (exact.length === 1) return exact[0];

  const contains = apiTeams.filter((t) => {
    const n = normalize(t.name);
    return n.includes(target) || target.includes(n);
  });
  if (contains.length === 1) return contains[0];
  if (contains.length > 1) {
    console.warn(`  ⚠ Ambigu pour "${searchName}" : ${contains.map((t) => t.name).join(', ')} — ignoré.`);
  }
  return null;
}

// ===== Fusion (logique pure, testable sans réseau) =====

/**
 * Remplace les entrées d'une ligue dans le registre par les entrées
 * fraîches — sans toucher aux autres ligues. `freshEntries` est un objet
 * { apiId: { name, league, logo } }.
 */
export function mergeRegistry(existingRegistry, league, freshEntries) {
  const result = {};
  // On garde tout ce qui n'appartient pas à cette ligue.
  for (const [id, entry] of Object.entries(existingRegistry)) {
    if (entry.league !== league) result[id] = entry;
  }
  // On ajoute les entrées fraîches de cette ligue.
  for (const [id, entry] of Object.entries(freshEntries)) {
    result[id] = entry;
  }
  return result;
}

/**
 * Fusionne le mapping legacy (internalId -> logo) : ne touche que les clés
 * qu'on a effectivement réussi à résoudre cette fois-ci, garde le reste.
 */
export function mergeLegacy(existingLegacy, freshLegacy) {
  return { ...existingLegacy, ...freshLegacy };
}

async function readJsonSafe(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

// ===== Réseau =====

async function apiFetch(apiKey, endpoint, params) {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const res = await fetch(url.toString(), { headers: { 'x-apisports-key': apiKey } });
  if (!res.ok) throw new Error(`API-Basketball a répondu ${res.status} pour ${endpoint}`);

  const data = await res.json();
  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(`API-Basketball erreur pour ${endpoint} : ${JSON.stringify(data.errors)}`);
  }
  return data.response;
}

async function downloadLogo(logoUrl, fileBaseName) {
  const res = await fetch(logoUrl);
  if (!res.ok) throw new Error(`Téléchargement logo échoué (${res.status}) : ${logoUrl}`);

  const ext = path.extname(new URL(logoUrl).pathname) || '.png';
  const fileName = `${fileBaseName}${ext}`;
  const destDir = path.join(ROOT, 'public', 'images', 'teams');
  await fs.mkdir(destDir, { recursive: true });

  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(path.join(destDir, fileName), buffer);

  return `/images/teams/${fileName}`;
}

// ===== Programme principal =====

async function main() {
  const apiKey = await loadApiKey();
  if (!apiKey) {
    console.error(
      '✗ NBA_API_KEY introuvable (ni dans process.env, ni dans .env.local).\n' +
      '  Lance plutôt : node --env-file=.env.local scripts/fetch-teams-registry.mjs'
    );
    process.exit(1);
  }

  let registry = await readJsonSafe(REGISTRY_PATH);
  let legacy = await readJsonSafe(LEGACY_PATH);

  const leagues = Object.keys(LEAGUE_CONFIG);
  const rosterByLeague = {}; // pour la résolution legacy plus bas

  for (const league of leagues) {
    const { id, season } = LEAGUE_CONFIG[league];
    console.log(`→ ${league} (league=${id}, season=${season})...`);

    let apiTeams;
    try {
      apiTeams = await apiFetch(apiKey, '/teams', { league: id, season });
      console.log(`  ✓ ${apiTeams.length} équipes reçues.`);
    } catch (err) {
      console.error(`  ✗ Échec pour ${league} : ${err.message}`);
      console.error(`    → entrées existantes pour ${league} conservées telles quelles.`);
      continue; // on ne touche pas au registre pour cette ligue
    }

    rosterByLeague[league] = apiTeams;

    const freshEntries = {};
    for (const team of apiTeams) {
      if (!team.logo) continue;
      try {
        const localPath = await downloadLogo(team.logo, String(team.id));
        freshEntries[String(team.id)] = { name: team.name, league, logo: localPath };
      } catch (err) {
        console.warn(`  ⚠ Logo non téléchargé pour "${team.name}" : ${err.message}`);
      }
    }

    registry = mergeRegistry(registry, league, freshEntries);
    console.log(`  ✓ ${Object.keys(freshEntries).length}/${apiTeams.length} logos intégrés au registre pour ${league}.`);
  }

  await fs.mkdir(path.dirname(REGISTRY_PATH), { recursive: true });
  await fs.writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2) + '\n', 'utf-8');
  console.log(`\n✅ src/lib/teams-registry.json écrit (${Object.keys(registry).length} équipes au total, toutes ligues confondues).`);

  // ===== Résolution du mapping legacy pour mock-data.ts =====

  const freshLegacy = {};
  const unmatched = [];

  for (const team of MOCK_TEAMS) {
    const apiTeams = rosterByLeague[team.league];
    if (!apiTeams) continue; // ligue non rafraîchie ce run — on laissera l'ancienne valeur telle quelle

    const candidates = [team.name, ...team.aliases];
    let match = null;
    for (const candidate of candidates) {
      match = matchTeamByName(apiTeams, candidate);
      if (match) break;
    }

    if (!match) {
      unmatched.push(team);
      console.warn(`  ⚠ Aucune correspondance pour "${team.name}" — ancienne valeur (si existante) conservée.`);
      continue;
    }

    const registryEntry = registry[String(match.id)];
    if (registryEntry) freshLegacy[team.internalId] = registryEntry.logo;
  }

  legacy = mergeLegacy(legacy, freshLegacy);
  await fs.writeFile(LEGACY_PATH, JSON.stringify(legacy, null, 2) + '\n', 'utf-8');
  console.log(`✅ src/lib/team-logos.json écrit (${Object.keys(legacy).length}/${MOCK_TEAMS.length} équipes mock résolues).`);

  if (unmatched.length > 0) {
    console.log(`${unmatched.length} équipe(s) mock non résolue(s) cette fois : ${unmatched.map((t) => t.name).join(', ')}`);
  }
}

export { main };

// N'exécute main() que si le fichier est lancé directement (pas importé par un test).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('✗ Échec du script :', err.message);
    process.exit(1);
  });
}
