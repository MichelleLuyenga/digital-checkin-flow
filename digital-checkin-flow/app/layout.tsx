import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';
import { InstallBanner } from '@/components/pwa/InstallBanner';

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Hotel Check-in',
  description: 'Contactless mobile check-in',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Check-in',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        {children}
        <InstallBanner />
      </body>
    </html>
  );
}