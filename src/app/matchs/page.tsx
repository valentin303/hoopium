import { headers } from 'next/headers';
import { PageHero } from '@/components/PageHero';
import { MatchesExplorer } from '@/components/MatchesExplorer';
import type { Match } from '@/types';

interface MatchesApiResponse {
  matches: Match[];
  source: 'live' | 'demo' | 'error';
}

async function getMatches(): Promise<MatchesApiResponse> {
  const host = (await headers()).get('host');
  const protocol = host?.startsWith('localhost') ? 'http' : 'https';

  try {
    const res = await fetch(`${protocol}://${host}/api/nba/matches`, { cache: 'no-store' });
    return await res.json();
  } catch {
    return { matches: [], source: 'error' };
  }
}

export default async function MatchsPage() {
  const { matches, source } = await getMatches();

  return (
    <main className="flex-1 pt-16">
      <PageHero
        eyebrow="Calendrier"
        title="Les prochains matchs, lus par les données"
        subtitle="Chaque rencontre passe par le même filtre : forme récente, historique, contexte, facteurs cachés. L'indice de confiance est public — l'analyse complète se débloque à la demande."
      />

      {source === 'demo' && (
        <div className="mx-6 mt-6 flex items-center gap-2 rounded-xl border border-orange-dim bg-orange-glow px-4 py-3 text-sm text-orange md:mx-12">
          <span className="font-semibold">Mode démonstration</span>
          <span className="text-bone-dim">
            — aucun match NBA n&apos;est programmé aujourd&apos;hui (intersaison). Les rencontres
            ci-dessous illustrent le rendu de l&apos;analyse.
          </span>
        </div>
      )}

      {(source === 'live' || source === 'demo') && <MatchesExplorer matches={matches} />}

      {source === 'error' && (
        <div className="flex flex-col items-center gap-3 px-6 py-24 text-center">
          <p className="text-lg font-semibold text-red">Données momentanément indisponibles</p>
          <p className="max-w-sm text-sm text-bone-dim">
            Nous ne parvenons pas à récupérer le calendrier en ce moment. Réessaie dans
            quelques minutes.
          </p>
        </div>
      )}
    </main>
  );
}
