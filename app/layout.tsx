import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import Navbar from '@/components/shared/Navbar'

export const metadata: Metadata = {
  title: 'כמה — ניהול הון אישי',
  description: 'פלטפורמת ניהול הון היברידית — הנתונים שלך נשארים אצלך',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body
        className="md:pr-[220px] pt-[52px] md:pt-0 pb-[72px] md:pb-0"
      >
        <Navbar />
        <main className="min-h-screen p-4 md:p-6 max-w-[1200px] mx-auto">
          {children}
        </main>
      </body>
    </html>
  )
}
