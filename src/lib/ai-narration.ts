/**
 * Narration IA — étape 2 du pipeline d'analyse HOOPIUM.
 *
 * Cette étape ne calcule RIEN. Elle reçoit les chiffres déjà décidés par
 * le moteur de calcul (src/lib/stats-engine.ts, étape 1) et les met en
 * langage naturel. Claude n'a jamais le droit de choisir un chiffre —
 * seulement de le raconter. Le prompt insiste explicitement là-dessus, et
 * la sortie est forcée en JSON structuré (via tool use) pour éviter tout
 * texte parasite à parser.
 *
 * Nécessite ANTHROPIC_API_KEY dans .env.local — différent de l'abonnement
 * Claude Pro (qui ne donne pas accès à l'API). Clé à créer sur
 * console.anthropic.com.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Match } from '@/types';
import type { TeamSnapshot, MatchPrediction } from './stats-engine';

export interface NarrationResult {
  factors: { strength: 'strong' | 'variable' | 'uncertain'; text: string }[];
  verdict: string;
}

let cachedClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(
      '[ai-narration] ANTHROPIC_API_KEY manquante dans les variables d\'environnement. La narration IA échouera — vérifie ton fichier .env.local.'
    );
  }
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return cachedClient;
}

const NARRATION_TOOL = {
  name: 'submit_narration',
  description: 'Soumet le verdict et les facteurs déterminants rédigés à partir des chiffres fournis.',
  input_schema: {
    type: 'object' as const,
    properties: {
      factors: {
        type: 'array' as const,
        description: 'Exactement 3 facteurs déterminants.',
        items: {
          type: 'object' as const,
          properties: {
            strength: { type: 'string' as const, enum: ['strong', 'variable', 'uncertain'] },
            text: { type: 'string' as const, description: 'Une phrase factuelle en français.' },
          },
          required: ['strength', 'text'],
        },
        minItems: 3,
        maxItems: 3,
      },
      verdict: {
        type: 'string' as const,
        description: 'Verdict de 2 à 3 phrases en français, ton HOOPIUM (direct, factuel, jamais putaclic).',
      },
    },
    required: ['factors', 'verdict'],
  },
};

/** Construit le prompt — exporté séparément pour pouvoir le tester sans réseau. */
export function buildNarrationPrompt(
  match: Match,
  home: TeamSnapshot,
  away: TeamSnapshot,
  prediction: MatchPrediction
): string {
  return `Tu es l'assistant éditorial de HOOPIUM, un site d'analyse basketball par IA. Ton seul travail : transformer des chiffres déjà calculés en texte clair et naturel, en français. Tu ne dois JAMAIS inventer, modifier ou recalculer un chiffre — utilise uniquement ceux fournis ci-dessous.

Match : ${match.homeTeam.name} (domicile) vs ${match.awayTeam.name} (extérieur)

Statistiques réelles des ${match.homeTeam.name} (10 derniers matchs disponibles) :
- Points marqués/match : ${home.pointsPerGame.toFixed(1)}
- Points concédés/match : ${home.opponentPointsPerGame.toFixed(1)}
- Rating offensif : ${home.offensiveRating.toFixed(1)}
- Rating défensif : ${home.defensiveRating.toFixed(1)}
- Réussite à 3 points : ${home.threePointPct.toFixed(1)}%
- Forme récente (du plus ancien au plus récent) : ${home.recentForm.join('')}
- % de victoires à domicile : ${home.homeWinPct.toFixed(0)}%

Statistiques réelles des ${match.awayTeam.name} (10 derniers matchs disponibles) :
- Points marqués/match : ${away.pointsPerGame.toFixed(1)}
- Points concédés/match : ${away.opponentPointsPerGame.toFixed(1)}
- Rating offensif : ${away.offensiveRating.toFixed(1)}
- Rating défensif : ${away.defensiveRating.toFixed(1)}
- Réussite à 3 points : ${away.threePointPct.toFixed(1)}%
- Forme récente (du plus ancien au plus récent) : ${away.recentForm.join('')}
- % de victoires à domicile : ${away.homeWinPct.toFixed(0)}%

Prédiction déjà calculée par le modèle (ne pas modifier, juste raconter) :
- Score prédit : ${match.homeTeam.name} ${prediction.predictedHomeScore} - ${prediction.predictedAwayScore} ${match.awayTeam.name}
- Confiance du modèle : ${prediction.confidence}%
- Probabilités : victoire ${match.homeTeam.name} ${prediction.winProbabilities.homeWinPct}%, match serré ${prediction.winProbabilities.closeGamePct}%, victoire ${match.awayTeam.name} ${prediction.winProbabilities.awayWinPct}%

Rédige, via l'outil submit_narration :
1. Exactement 3 facteurs déterminants, chacun avec un niveau (strong/variable/uncertain selon la force du signal statistique observé) et une phrase factuelle basée uniquement sur les chiffres ci-dessus.
2. Un verdict de 2 à 3 phrases, ton direct et confiant, qui explique pourquoi le modèle penche dans ce sens — sans jamais changer le score, la confiance ou les probabilités donnés.`;
}

/**
 * Demande à Claude de raconter une prédiction déjà calculée.
 * Lève une erreur si ça échoue — à l'appelant de décider du repli
 * (voir real-analysis.ts, qui retombe sur un texte factuel simple).
 */
export async function narrateAnalysis(
  match: Match,
  home: TeamSnapshot,
  away: TeamSnapshot,
  prediction: MatchPrediction
): Promise<NarrationResult> {
  const prompt = buildNarrationPrompt(match, home, away, prediction);

  const response = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001', // tâche de rédaction simple, pas besoin du modèle le plus cher
    max_tokens: 700,
    tools: [NARRATION_TOOL],
    tool_choice: { type: 'tool', name: 'submit_narration' },
    messages: [{ role: 'user', content: prompt }],
  });

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude n\'a pas renvoyé de réponse structurée (submit_narration absent).');
  }

  return toolUse.input as NarrationResult;
}
