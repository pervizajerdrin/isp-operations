import type { ReactNode } from 'react'

export type TableColumn<T> = {
  key: string
  header: string
  className?: string
  render: (item: T) => ReactNode
}

type DataTableProps<T> = {
  columns: TableColumn<T>[]
  data: T[]
  getRowKey: (item: T) => string | number
  emptyText?: string
}

export function DataTable<T>({ columns, data, getRowKey, emptyText = 'No records' }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-normal text-slate-500 ${
                  column.className ?? ''
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((item) => (
            <tr key={getRowKey(item)} className="hover:bg-slate-50">
              {columns.map((column) => (
                <td key={column.key} className={`whitespace-nowrap px-3 py-2 align-middle ${column.className ?? ''}`}>
                  {column.render(item)}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td className="px-3 py-8 text-center text-sm text-slate-500" colSpan={columns.length}>
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
