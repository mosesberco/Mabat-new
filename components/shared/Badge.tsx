interface BadgeProps {
  label: string
  color?: 'primary' | 'gold' | 'danger' | 'muted' | 'purple' | 'info'
}

const COLORS = {
  primary: 'bg-[rgba(129,140,248,0.12)] text-[#818CF8] border-[rgba(129,140,248,0.2)]',
  gold:    'bg-[rgba(245,166,35,0.12)] text-[#F5A623] border-[rgba(245,166,35,0.2)]',
  danger:  'bg-[rgba(255,107,107,0.12)] text-[#FF6B6B] border-[rgba(255,107,107,0.2)]',
  muted:   'bg-[var(--surface2)] text-[var(--muted)] border-[var(--border)]',
  purple:  'bg-[rgba(167,139,250,0.12)] text-[#A78BFA] border-[rgba(167,139,250,0.2)]',
  info:    'bg-[rgba(77,184,255,0.12)] text-[#4DB8FF] border-[rgba(77,184,255,0.2)]',
}

export default function Badge({ label, color = 'muted' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${COLORS[color]}`}>
      {label}
    </span>
  )
}
