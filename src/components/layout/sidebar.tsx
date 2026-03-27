'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ImageIcon,
  BarChart3,
  CalendarDays,
  Users,
  Newspaper,
  PanelLeftOpen,
  MenuIcon,
  XIcon,
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
  const [open, setOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile — start collapsed on mobile
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
    }
    check()
    if (window.innerWidth < 768) setOpen(false)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Close on navigation
  useEffect(() => {
    if (isMobile) setOpen(false)
  }, [pathname, isMobile])

  return (
    <>
      {/* Toggle button — always visible when sidebar is closed */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed top-3 left-3 z-50 rounded-md bg-zinc-900 border border-zinc-700 p-2.5 text-zinc-300 hover:text-white transition-colors"
          aria-label="Abrir menu"
        >
          {isMobile ? <MenuIcon size={20} /> : <PanelLeftOpen size={20} />}
        </button>
      )}

      {/* Overlay — mobile only */}
      {open && isMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          'fixed top-0 left-0 h-full w-64 bg-zinc-950 flex flex-col border-r border-zinc-800 z-50 transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Header */}
        <div className="px-4 py-4 border-b border-zinc-800 flex items-center justify-between min-h-[57px]">
          <div className="flex flex-col items-center text-center font-[family-name:var(--font-black-ops)] uppercase tracking-wide leading-none" style={{ color: '#8B0000' }}>
            <span className="text-3xl">Central</span>
            <span className="text-lg my-0.5">do</span>
            <span className="text-3xl">Conteúdo</span>
            <span className="text-[9px] text-zinc-600 tracking-[0.2em] uppercase mt-1.5 font-sans font-medium self-start">
              por Gabriel John
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-zinc-400 hover:text-white transition-colors"
            aria-label="Fechar menu"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={() => { if (isMobile) setOpen(false) }}
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

      {/* Spacer — desktop only, only when open */}
      {open && !isMobile && (
        <div className="shrink-0 w-64 transition-all duration-200" />
      )}
    </>
  )
}
