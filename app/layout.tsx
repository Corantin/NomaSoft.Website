import type {Metadata, Viewport} from 'next';
import type {ReactNode} from 'react';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://novasoft.dev';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'NovaSoft',
    template: '%s | NovaSoft'
  },
  description: 'Automation-first software engineering studio building Web, Mobile, Web3, and AI products.',
  icons: {
    icon: '/favicon.svg'
  }
};

export const viewport: Viewport = {
  themeColor: '#09090b'
};

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-zinc-950 text-zinc-50 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
