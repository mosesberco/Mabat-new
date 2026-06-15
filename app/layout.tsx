import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/shared/Navbar'

export const metadata: Metadata = {
  title: 'כמה — ניהול הון אישי',
  description: 'פלטפורמת ניהול הון היברידית — הנתונים שלך נשארים אצלך',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ paddingRight: '220px' }}>
        <Navbar />
        <main className="min-h-screen p-6 max-w-[1200px] mx-auto">
          {children}
        </main>
      </body>
    </html>
  )
}
