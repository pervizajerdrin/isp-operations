import { Activity, Home, Network, Router, Server, Settings, Users } from 'lucide-react'

export type PageKey = 'dashboard' | 'clients' | 'mikrotik' | 'onus' | 'olts' | 'monitoring' | 'settings'

type AppShellProps = {
  activePage: PageKey
  onPageChange: (page: PageKey) => void
  children: React.ReactNode
}

const navItems: Array<{ key: PageKey; label: string; icon: typeof Home }> = [
  { key: 'dashboard', label: 'Dashboard', icon: Home },
  { key: 'clients', label: 'Clients', icon: Users },
  { key: 'mikrotik', label: 'MikroTik', icon: Router },
  { key: 'onus', label: 'ONUs/ONTs', icon: Network },
  { key: 'olts', label: 'OLTs', icon: Server },
  { key: 'monitoring', label: 'Monitoring', icon: Activity },
  { key: 'settings', label: 'Settings', icon: Settings },
]

export function AppShell({ activePage, onPageChange, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-56 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-4">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-slate-900 text-white">
            <Activity size={17} />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-950">TitanDesk Community</p>
            <p className="text-xs text-slate-500">ISP operations</p>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.key}
                className={`flex h-9 w-full items-center gap-3 rounded px-3 text-left text-sm font-medium ${
                  activePage === item.key ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
                type="button"
                onClick={() => onPageChange(item.key)}
              >
                <Icon size={16} />
                {item.label}
              </button>
            )
          })}
        </nav>
      </aside>
      <div className="lg:pl-56">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-950 lg:hidden">TitanDesk Community</p>
            <p className="hidden text-sm text-slate-500 lg:block">Frontend to PHP API to MySQL</p>
            <div className="flex gap-2 overflow-x-auto lg:hidden">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  className={`h-8 rounded px-3 text-xs font-medium ${
                    activePage === item.key ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white'
                  }`}
                  type="button"
                  onClick={() => onPageChange(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-5 lg:px-6">{children}</main>
      </div>
    </div>
  )
}
