import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
})

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: "Altiora- Admin",
  description: "Premium AI-generated reels for clothing, branding, and fashion",
  keywords: "AI reels, clothing, branding, fashion, video content, social media",
  authors: [{ name: "logoipsum" }],
  creator: "logoipsum",
  publisher: "logoipsum",
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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://logoipsum.com",
    siteName: "logoipsum",
    title: "logoipsum - AI Reels Platform",
    description: "Premium AI-generated reels for clothing, branding, and fashion",
    images: [
      {
        url: "https://res.cloudinary.com/dkisnzuvo/image/upload/v1759732780/logo_spmerp.png",
        width: 1200,
        height: 630,
        alt: "Altiora-Admin",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "logoipsum - AI Reels Platform",
    description: "Premium AI-generated reels for clothing, branding, and fashion",
    images: ["https://res.cloudinary.com/dkisnzuvo/image/upload/v1759732780/logo_spmerp.png"],
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://wa.me" />

        <link rel="dns-prefetch" href="https://api.whatsapp.com" />

        <link rel="icon" href="https://res.cloudinary.com/dkisnzuvo/image/upload/v1759732780/logo_spmerp.png" sizes="any" />
        <link rel="icon" href="https://res.cloudinary.com/dkisnzuvo/image/upload/v1759732780/logo_spmerp.png" type="image/png" />
        <link rel="apple-touch-icon" href="https://res.cloudinary.com/dkisnzuvo/image/upload/v1759732780/logo_spmerp.png" />
        <link rel="manifest" href="/manifest.json" />

        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="dark light" />

        <meta httpEquiv="x-dns-prefetch-control" content="on" />

        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "logoipsum",
              "description": "Premium AI-generated reels for clothing, branding, and fashion",
              "url": process.env.NEXT_PUBLIC_SITE_URL || "https://logoipsum.com",
              "logo": "https://res.cloudinary.com/dkisnzuvo/image/upload/v1759732780/logo_spmerp.png",
              "sameAs": [],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "availableLanguage": "English"
              }
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
        suppressHydrationWarning={true}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
        >
          Skip to main content
        </a>

        <Providers>
          <div id="main-content">
            {children}
          </div>
        </Providers>

        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if (typeof window !== 'undefined') {
                  window.addEventListener('load', () => {
                    setTimeout(() => {
                      const perfData = performance.getEntriesByType('navigation')[0];
                      console.log('Page Load Performance:', {
                        'DOM Content Loaded': perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart + 'ms',
                        'Load Complete': perfData.loadEventEnd - perfData.loadEventStart + 'ms',
                        'Total Load Time': perfData.loadEventEnd - perfData.fetchStart + 'ms'
                      });
                    }, 0);
                  });
                }
              `
            }}
          />
        )}
      </body>
    </html>
  )
}