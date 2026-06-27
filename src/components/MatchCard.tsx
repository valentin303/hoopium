import Link from 'next/link';
import type { Match } from '@/types';

const LEAGUE_LABELS: Record<Match['league'], string> = {
  nba: 'NBA',
  wnba: 'WNBA',
  euroleague: 'EuroLeague',
  ncaa: 'NCAA',
};

function formatTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function FormDots({ form }: { form: Match['homeTeam']['form'] }) {
  return (
    <div className="flex gap-1">
      {form.results.map((r, i) => (
        <span
          key={i}
          className={r === 'w' ? 'h-1 w-3 rounded-full bg-green' : 'h-1 w-3 rounded-full bg-red/40'}
        />
      ))}
    </div>
  );
}

export function MatchCard({ match }: { match: Match }) {
  const isHigh = match.confidenceLevel === 'high';

  return (
    <Link
      href={`/analyse/${match.id}`}
      className="group relative flex overflow-hidden rounded-lg border border-surface-line bg-surface/80 transition hover:border-orange/40"
    >
      {/* Marqueur latéral — référence au trait de touche du terrain */}
      <span className={`w-1 flex-shrink-0 ${isHigh ? 'bg-green' : 'bg-orange'}`} />

      <div className="flex flex-1 items-center gap-6 px-6 py-4">
        <div className="flex w-14 flex-shrink-0 flex-col gap-1">
          <span className="font-display text-base font-bold leading-none">{formatTime(match.startTime)}</span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-bone-dim">
            {LEAGUE_LABELS[match.league]}
          </span>
        </div>

        <div className="h-9 w-px flex-shrink-0 bg-surface-line" />

        <div className="flex flex-1 items-center gap-4 min-w-0">
          <TeamBlock name={match.homeTeam.name} abbr={match.homeTeam.abbreviation} form={match.homeTeam.form} />
          <span className="flex-shrink-0 font-display text-[10px] text-bone-dim/50">@</span>
          <TeamBlock name={match.awayTeam.name} abbr={match.awayTeam.abbreviation} form={match.awayTeam.form} align="right" />
        </div>

        <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
          <span
            className={`font-display text-[34px] font-bold leading-none tracking-tight transition group-hover:translate-x-0.5 ${
              isHigh ? 'text-green' : 'text-orange'
            }`}
          >
            {match.confidence}
            <span className="text-base align-top">%</span>
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-bone-dim">
            {isHigh ? 'Confiance haute' : 'Confiance modérée'}
          </span>
        </div>
      </div>
    </Link>
  );
}

function TeamBlock({
  name,
  abbr,
  form,
  align = 'left',
}: {
  name: string;
  abbr: string;
  form: Match['homeTeam']['form'];
  align?: 'left' | 'right';
}) {
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-3 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
      <span className="flex h-9 w-11 flex-shrink-0 items-center justify-center rounded-md bg-court font-display text-[11px] font-bold text-orange">
        {abbr}
      </span>
      <div className={`flex min-w-0 flex-col gap-1 ${align === 'right' ? 'items-end' : ''}`}>
        <span className="truncate text-[15px] font-bold leading-none">{name}</span>
        <FormDots form={form} />
      </div>
    </div>
  );
}
