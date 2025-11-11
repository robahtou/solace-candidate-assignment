import type { Metadata } from 'next';
import { Inter }         from 'next/font/google';

import './globals.css';


const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Solace Candidate Assignment',
  description: 'Show us what you got'
};

function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="en" className={`${inter.variable} ${inter.className}`}>
      <head>
        <meta name="apple-mobile-web-app-title" content="Solace" />

        <link rel="manifest"          href="/favicon/manifest.json" />
        <link rel="icon"              href="/favicon/favicon.ico"    type="image/x-icon"   sizes="48x48"   />
        <link rel="icon"              href="/favicon/icon.svg"       type="image/svg+xml"  sizes="any"     />
        <link rel="icon"              href="/favicon/icon.png"       type="image/png"      sizes="96x96"   />
        <link rel="apple-touch-icon"  href="/favicon/apple-icon.png" type="image/png"      sizes="180x180" />
      </head>

      <body>{children}</body>
    </html>
  );
}


export default RootLayout;
