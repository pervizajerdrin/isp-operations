import type { LucideIcon } from 'lucide-react'

type StatCardProps = {
  title: string
  value: number | string
  detail: string
  icon: LucideIcon
}

export function StatCard({ title, value, detail, icon: Icon }: StatCardProps) {
  return (
    <section className="rounded border border-slate-200 bg-white p-4 shadow-line">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-normal text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-600">
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-500">{detail}</p>
    </section>
  )
}
