import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Brubble - Break Your Information Bubble',
  description:
    'Compare search results across different demographics, political leanings, and geographic locations. Understand your information bubble and explore diverse perspectives.',
  keywords: [
    'information bubble',
    'echo chamber',
    'search comparison',
    'perspective diversity',
    'media bias',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
