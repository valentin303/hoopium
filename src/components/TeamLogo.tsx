import Image from 'next/image';
import type { Team } from '@/types';

interface TeamLogoProps {
  team: Team;
  size?: number;
  shape?: 'rounded' | 'circle';
  className?: string;
}

export function TeamLogo({ team, size = 44, shape = 'rounded', className = '' }: TeamLogoProps) {
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-md';

  if (team.logoUrl) {
    return (
      <span
        className={`flex flex-shrink-0 items-center justify-center bg-court ${radius} ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={team.logoUrl}
          alt={team.name}
          width={Math.round(size * 0.72)}
          height={Math.round(size * 0.72)}
          className="object-contain"
        />
      </span>
    );
  }

  return (
    <span
      className={`flex flex-shrink-0 items-center justify-center bg-court font-display font-bold text-orange ${radius} ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(9, size * 0.26) }}
    >
      {team.abbreviation}
    </span>
  );
}
