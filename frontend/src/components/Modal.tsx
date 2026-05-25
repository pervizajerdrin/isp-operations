import type { ReactNode } from 'react'
import { X } from 'lucide-react'

type ModalProps = {
  title: string
  children: ReactNode
  onClose: () => void
}

export function Modal({ title, children, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
      <section className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded border border-slate-300 bg-white shadow-lg">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <button className="icon-btn" type="button" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </header>
        <div className="p-4">{children}</div>
      </section>
    </div>
  )
}
