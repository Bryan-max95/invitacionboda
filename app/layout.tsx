import type { Metadata } from 'next';
import React from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bryan & Lyndel — Invitación de Boda | 18 de diciembre de 2026',
  description:
    'Invitación de boda digital de Bryan Cárcamo y Lyndel Pérez — 18 de diciembre de 2026.',
  openGraph: {
    title: 'Bryan & Lyndel — Invitación de Boda',
    description:
      'Invitación de boda digital de Bryan Cárcamo y Lyndel Pérez — 18 de diciembre de 2026.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bryan & Lyndel — Invitación de Boda',
    description:
      'Invitación de boda digital de Bryan Cárcamo y Lyndel Pérez — 18 de diciembre de 2026.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Great+Vibes&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
