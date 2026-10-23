import type { Metadata, Viewport } from 'next';
import './globals.css';
import { I18nProvider } from '@/lib/i18n';
import { Header } from '@/components/layout/Header';
import { FooterNav } from '@/components/layout/FooterNav';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { AlarmOverlay } from '@/components/alarm/AlarmOverlay';

export const metadata: Metadata = {
  title: 'MedRemind - स्मार्ट स्वास्थ्य एवं दवा सहायक (1 दिन से आजीवन)',
  description: 'शिशु से लेकर बुजुर्गों तक - सरल, सुलभ एवं बहुभाषी दवा समय सारणी व अलार्म PWA',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MedRemind',
  },
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#15803d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24">
        <I18nProvider>
          <OfflineBanner />
          <Header />
          <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6" id="main-content">
            {children}
          </main>
          <FooterNav />
          {/* Universal Real-Time Audible Alarm Overlay */}
          <AlarmOverlay />
        </I18nProvider>

        {/* PWA Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(reg) {
                      console.log('[MedRemind PWA] Registered:', reg.scope);
                    },
                    function(err) {
                      console.warn('[MedRemind PWA] Registration failed:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
