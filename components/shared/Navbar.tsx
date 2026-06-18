'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Wallet, CreditCard, BarChart3, Calculator, Settings } from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'דשבורד', icon: LayoutDashboard },
  { href: '/assets', label: 'נכסים', icon: Wallet },
  { href: '/liabilities', label: 'חובות', icon: CreditCard },
  { href: '/analysis', label: 'ניתוח', icon: BarChart3 },
  { href: '/simulators', label: 'סימולטורים', icon: Calculator },
  { href: '/settings', label: 'הגדרות', icon: Settings },
]

export default function Navbar() {
  const path = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        className="hidden md:flex fixed top-0 app-rail h-screen w-[220px] flex-col z-50"
        style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}
      >
        <div className="px-6 py-7 mb-2">
          <div className="text-3xl font-black tracking-tight" style={{ color: 'var(--primary)' }}>כמה</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>ניהול הון אישי</div>
        </div>

        <div className="flex-1 flex flex-col gap-1 px-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = path === href || path.startsWith(href + '/')
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'text-[var(--primary)] bg-[var(--primary-dim)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)]'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
        </div>

        <div className="px-5 py-5 text-[11px]" style={{ color: 'var(--muted)' }}>
          הנתונים שלך נשמרים<br />מקומית בלבד בדפדפן.
        </div>
      </nav>

      {/* Mobile top header */}
      <header
        className="md:hidden fixed top-0 right-0 left-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="text-xl font-black tracking-tight" style={{ color: 'var(--primary)' }}>כמה</div>
        <div className="text-xs" style={{ color: 'var(--muted)' }}>ניהול הון אישי</div>
      </header>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 right-0 left-0 z-50 flex items-center justify-around px-2 py-2 safe-area-pb"
        style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        }}
      >
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
                active
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--muted)]'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
