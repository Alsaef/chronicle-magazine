import './globals.css';
import { Suspense } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chronicle-magazine.vercel.app';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Chronicle Magazine — Profiles & Biographies of Icons & Pioneers',
    template: '%s | Chronicle Magazine',
  },
  description: 'An editorial biography magazine exploring the lives, milestones, and breakthroughs of tech visionaries, world leaders, athletes, and pioneers.',
  applicationName: 'Chronicle Magazine',
  authors: [{ name: 'Chronicle Editorial Board', url: siteUrl }],
  creator: 'Chronicle Magazine',
  publisher: 'Chronicle Publishing',
  keywords: [
    'biography',
    'profiles',
    'tech leaders',
    'world leaders',
    'history',
    'pioneers',
    'innovators',
    'athletes',
    'life stories',
    'chronicle magazine'
  ],
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Chronicle Magazine',
    title: 'Chronicle Magazine — Profiles & Biographies of Icons & Pioneers',
    description: 'An editorial biography magazine exploring the lives, milestones, and breakthroughs of tech visionaries, world leaders, athletes, and pioneers.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&h=630&q=80',
        width: 1200,
        height: 630,
        alt: 'Chronicle Magazine — Iconic Biographies',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chronicle Magazine — Profiles & Biographies of Icons & Pioneers',
    description: 'An editorial biography magazine exploring the lives, milestones, and breakthroughs of tech visionaries, world leaders, athletes, and pioneers.',
    creator: '@chroniclemag',
    images: ['https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&h=630&q=80'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Chronicle Magazine',
  url: siteUrl,
  description: 'An editorial biography magazine exploring the lives, milestones, and breakthroughs of tech visionaries, world leaders, athletes, and pioneers.',
  publisher: {
    '@type': 'Organization',
    name: 'Chronicle Magazine',
    logo: {
      '@type': 'ImageObject',
      url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&h=600&q=80',
    },
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteUrl}/?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="corporate" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="min-h-screen bg-base-100 text-base-content flex flex-col font-sans antialiased selection:bg-primary selection:text-primary-content">
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <Suspense fallback={<div className="h-16 bg-base-100 border-b border-base-300 animate-pulse" />}>
                <Navbar />
              </Suspense>
              <main className="flex-1 w-full">
                {children}
              </main>
              <Footer />
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
