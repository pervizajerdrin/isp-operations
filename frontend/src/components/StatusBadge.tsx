type StatusBadgeProps = {
  value: string
}

const styles: Record<string, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  online: 'bg-green-50 text-green-700 border-green-200',
  suspended: 'bg-amber-50 text-amber-700 border-amber-200',
  degraded: 'bg-amber-50 text-amber-700 border-amber-200',
  offline: 'bg-slate-100 text-slate-700 border-slate-300',
  unauthorized: 'bg-red-50 text-red-700 border-red-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
}

export function StatusBadge({ value }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex h-6 items-center rounded border px-2 text-xs font-medium capitalize ${
        styles[value] ?? 'border-slate-300 bg-white text-slate-700'
      }`}
    >
      {value.replace('_', ' ')}
    </span>
  )
}
