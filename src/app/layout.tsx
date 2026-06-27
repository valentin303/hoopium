import type { Metadata } from 'next';
import { SiteNav } from '@/components/SiteNav';
import './globals.css';

// NOTE : next/font/google nécessite un accès réseau à fonts.googleapis.com
// au moment du build. Dans l'environnement de développement Claude, ce
// domaine n'est pas accessible — les polices sont donc déclarées ici en
// CSS classique (voir globals.css) plutôt qu'avec next/font/google.
// Une fois le projet ouvert sur ta machine avec un accès internet normal,
// tu peux repasser sur next/font/google pour l'auto-hébergement des
// polices (meilleure performance, pas de requête externe au runtime) :
//
//   import { Space_Grotesk, Oswald } from 'next/font/google';
//   const spaceGrotesk = Space_Grotesk({ variable: '--font-space-grotesk', subsets: ['latin'] });
//   const oswald = Oswald({ variable: '--font-oswald', subsets: ['latin'] });
//
// puis ajouter `${spaceGrotesk.variable} ${oswald.variable}` à className ci-dessous.

export const metadata: Metadata = {
  title: 'HOOPIUM — Basketball Intelligence',
  description:
    "HOOPIUM croise les statistiques NBA en temps réel pour produire des analyses claires, factuelles, sans bruit. Analyses produites à titre informatif uniquement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-night text-bone">
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
