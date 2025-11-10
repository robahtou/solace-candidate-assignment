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
      <body>{children}</body>
    </html>
  );
}


export default RootLayout;
