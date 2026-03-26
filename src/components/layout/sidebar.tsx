'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ImageIcon,
  BarChart3,
  CalendarDays,
  Users,
  Newspaper,
} from 'lucide-react'

const navItems = [
  { label: 'Home', href: '/', icon: LayoutDashboard },
  { label: 'Conteúdo', href: '/instagram', icon: ImageIcon },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Calendário', href: '/calendario', icon: CalendarDays },
  { label: 'Concorrentes', href: '/concorrentes', icon: Users },
  { label: 'Notícias', href: '/noticias', icon: Newspaper },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-zinc-950 flex flex-col border-r border-zinc-800 z-40">
      {/* Logo / Title */}
      <div className="px-5 py-5 border-b border-zinc-800">
        <span className="text-white font-semibold text-lg tracking-tight">
          ContentHub
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href

          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-zinc-800 text-white border-l-2 border-indigo-500 pl-[10px]'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100',
              ].join(' ')}
            >
              <Icon size={18} strokeWidth={1.75} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
