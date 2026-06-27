import { PageHero } from '@/components/PageHero';
import { HistoryExplorer } from '@/components/HistoryExplorer';
import { MOCK_FINISHED_MATCHES, MOCK_SITE_STATS } from '@/lib/mock-data';

export default function HistoriquePage() {
  return (
    <main className="flex-1 pt-16">
      <PageHero
        eyebrow="Bilan"
        title="Le passé, sans filtre"
        subtitle="Chaque prédiction HOOPIUM, confrontée au résultat réel. Confiance affichée avant le match, vérité après."
      />

      <div className="grid grid-cols-2 border-b border-surface-line md:grid-cols-4">
        <SummaryStat value={`${MOCK_SITE_STATS.successRate}%`} label="Taux de réussite global" />
        <SummaryStat value={MOCK_SITE_STATS.totalAnalyses} label="Analyses publiées" />
        <SummaryStat value={MOCK_SITE_STATS.correctPredictions} label="Prédictions justes" />
        <SummaryStat value={MOCK_SITE_STATS.wrongPredictions} label="Prédictions ratées" />
      </div>

      <HistoryExplorer matches={MOCK_FINISHED_MATCHES} />
    </main>
  );
}

function SummaryStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="border-r border-surface-line px-4 py-7 text-center last:border-none">
      <div className="font-display text-[30px] font-bold tracking-tight text-orange">{value}</div>
      <div className="mt-1.5 text-[11px] uppercase tracking-wide text-bone-dim">{label}</div>
    </div>
  );
}
