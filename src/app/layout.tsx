import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SessionProvider } from 'next-auth/react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RateStack',
  description: 'Cryptographic Freelance Contract & Milestone Management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#070709] text-zinc-100 antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}