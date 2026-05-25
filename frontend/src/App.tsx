import { RefreshCw, Router, Save, Server, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { AppShell, type PageKey } from './components/AppShell'
import { DataTable, type TableColumn } from './components/DataTable'
import { StatCard } from './components/StatCard'
import { StatusBadge } from './components/StatusBadge'
import { apiGet, apiSend } from './services/apiClient'

type Dashboard = {
  totalClients: number
  activeClients: number
  offlineDevices: number
  activeMikrotikRouters: number
  onlinePppoeSessions: number
  unauthorizedOnus: number
  weakSignalOnus: number
  recentAlerts: AlertRow[]
  recentDeviceEvents: PollLog[]
}

type Client = { id: number; name: string; phone?: string; address?: string; status: string; package_name?: string }
type Package = { id: number; name: string; download_mbps: number; upload_mbps: number; price: number; mikrotik_queue_limit?: string }
type MikrotikRouter = { id: number; name: string; host: string; api_port: number; location?: string; enabled: number; last_poll_status: string; identity?: string; routeros_version?: string; cpu_load?: number; last_error?: string }
type Onu = { id: number; serial_number: string; client_name?: string; olt_name?: string; pon_port?: string; onu_id?: string; rx_power?: number; tx_power?: number; distance_meters?: number; status: string; authorization_status: string; last_seen?: string }
type Olt = { id: number; name: string; vendor: string; host?: string; enabled: number; last_poll_status: string; last_error?: string }
type AlertRow = { id: number; severity: string; type: string; message: string; created_at: string; acknowledged_at?: string }
type PollLog = { id: number; device_type: string; device_id: number; action: string; status: string; message?: string; created_at: string; target_name?: string; interface_name?: string; rx_bps?: number; tx_bps?: number; sampled_at?: string }
type Setting = { setting_key: string; setting_value: string; updated_at: string }
type MikrotikData = {
  interfaces: Array<Record<string, string | number>>
  dhcpLeases: Array<Record<string, string | number>>
  pppActive: Array<Record<string, string | number>>
  pppSecrets: Array<Record<string, string | number>>
  simpleQueues: Array<Record<string, string | number>>
}

function useApi<T>(path: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const refresh = useCallback(() => {
    setLoading(true)
    setError(null)
    apiGet<T>(path)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [path])
  useEffect(refresh, [refresh])
  return { data, loading, error, refresh }
}

function Toolbar({ title, detail, onRefresh }: { title: string; detail: string; onRefresh: () => void }) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{detail}</p>
      </div>
      <button className="btn" type="button" onClick={onRefresh}>
        <RefreshCw size={16} />
        Refresh
      </button>
    </header>
  )
}

function StateBlock({ loading, error, empty }: { loading: boolean; error: string | null; empty: boolean }) {
  if (loading) return <div className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading data from API...</div>
  if (error) return <div className="rounded border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
  if (empty) return <div className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-500">No records yet.</div>
  return null
}

function DashboardPage() {
  const api = useApi<Dashboard>('/dashboard')
  const d = api.data
  return (
    <div className="space-y-5">
      <Toolbar title="Dashboard" detail="Only database/API data, no frontend mock values" onRefresh={api.refresh} />
      <StateBlock loading={api.loading} error={api.error} empty={!d} />
      {d && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total Clients" value={d.totalClients} detail={`${d.activeClients} active`} icon={Users} />
            <StatCard title="MikroTik Online" value={d.activeMikrotikRouters} detail={`${d.offlineDevices} offline devices`} icon={Router} />
            <StatCard title="PPPoE Sessions" value={d.onlinePppoeSessions} detail="Seen in latest poll data" icon={Router} />
            <StatCard title="ONU Issues" value={d.unauthorizedOnus + d.weakSignalOnus} detail={`${d.unauthorizedOnus} unauthorized, ${d.weakSignalOnus} weak`} icon={Server} />
          </div>
          <DataTable data={d.recentAlerts} getRowKey={(row) => row.id} columns={[
            { key: 'severity', header: 'Severity', render: (row) => <StatusBadge value={row.severity} /> },
            { key: 'type', header: 'Type', render: (row) => row.type },
            { key: 'message', header: 'Message', render: (row) => row.message },
            { key: 'created', header: 'Created', render: (row) => row.created_at },
          ]} />
          <DataTable data={d.recentDeviceEvents} getRowKey={(row) => row.id} columns={[
            { key: 'device', header: 'Device', render: (row) => `${row.device_type} #${row.device_id}` },
            { key: 'action', header: 'Action', render: (row) => row.action },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
            { key: 'message', header: 'Message', render: (row) => row.message || '-' },
            { key: 'created', header: 'Created', render: (row) => row.created_at },
          ]} />
        </>
      )}
    </div>
  )
}

function ClientsPage() {
  const clients = useApi<Client[]>('/clients')
  const packages = useApi<Package[]>('/packages')
  const [form, setForm] = useState({ name: '', phone: '', address: '', package_id: '', status: 'active' })
  async function submit(event: FormEvent) {
    event.preventDefault()
    await apiSend('/clients', 'POST', { ...form, package_id: form.package_id ? Number(form.package_id) : null })
    setForm({ name: '', phone: '', address: '', package_id: '', status: 'active' })
    clients.refresh()
  }
  return (
    <div className="space-y-5">
      <Toolbar title="Clients" detail="CRUD clients, package assignment and service status" onRefresh={clients.refresh} />
      <form className="grid gap-3 rounded border border-slate-200 bg-white p-4 sm:grid-cols-5" onSubmit={submit}>
        <input className="field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="field" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="field" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <select className="field" value={form.package_id} onChange={(e) => setForm({ ...form, package_id: e.target.value })}>
          <option value="">Package</option>
          {(packages.data || []).map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.name}</option>)}
        </select>
        <button className="btn btn-primary" type="submit"><Save size={16} />Save</button>
      </form>
      <StateBlock loading={clients.loading} error={clients.error} empty={(clients.data || []).length === 0} />
      {clients.data && <DataTable data={clients.data} getRowKey={(row) => row.id} columns={[
        { key: 'name', header: 'Name', render: (row) => <span className="font-medium">{row.name}</span> },
        { key: 'phone', header: 'Phone', render: (row) => row.phone || '-' },
        { key: 'package', header: 'Package', render: (row) => row.package_name || '-' },
        { key: 'address', header: 'Address', render: (row) => row.address || '-' },
        { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
      ]} />}
    </div>
  )
}

function MikrotikPage() {
  const routers = useApi<MikrotikRouter[]>('/mikrotik-routers')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const details = useApi<MikrotikData>(selectedId ? `/mikrotik-data/${selectedId}` : '/mikrotik-data/0')
  const [form, setForm] = useState({ name: '', host: '', api_port: 8728, username: '', password: '', connection_type: 'api', location: '', enabled: 1 })
  async function submit(event: FormEvent) {
    event.preventDefault()
    await apiSend('/mikrotik-routers', 'POST', form)
    setForm({ name: '', host: '', api_port: 8728, username: '', password: '', connection_type: 'api', location: '', enabled: 1 })
    routers.refresh()
  }
  async function manualPoll(id: number) {
    await apiSend('/manual-poll', 'POST', { device_type: 'mikrotik', device_id: id })
    routers.refresh()
  }
  return (
    <div className="space-y-5">
      <Toolbar title="MikroTik Routers" detail="Real RouterOS API devices, credentials stored encrypted in MySQL" onRefresh={routers.refresh} />
      <form className="grid gap-3 rounded border border-slate-200 bg-white p-4 sm:grid-cols-4 xl:grid-cols-8" onSubmit={submit}>
        <input className="field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="field" placeholder="Host/IP" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} required />
        <input className="field" type="number" placeholder="API port" value={form.api_port} onChange={(e) => setForm({ ...form, api_port: Number(e.target.value) })} />
        <input className="field" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        <input className="field" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <select className="field" value={form.connection_type} onChange={(e) => setForm({ ...form, connection_type: e.target.value })}><option value="api">API</option><option value="api-ssl">API SSL</option></select>
        <input className="field" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <button className="btn btn-primary" type="submit"><Save size={16} />Add</button>
      </form>
      <StateBlock loading={routers.loading} error={routers.error} empty={(routers.data || []).length === 0} />
      {routers.data && <DataTable data={routers.data} getRowKey={(row) => row.id} columns={[
        { key: 'name', header: 'Name', render: (row) => <button className="font-medium text-blue-700" onClick={() => setSelectedId(row.id)}>{row.name}</button> },
        { key: 'host', header: 'Host', render: (row) => `${row.host}:${row.api_port}` },
        { key: 'status', header: 'Poll', render: (row) => <StatusBadge value={row.last_poll_status} /> },
        { key: 'identity', header: 'Identity', render: (row) => row.identity || '-' },
        { key: 'version', header: 'RouterOS', render: (row) => row.routeros_version || '-' },
        { key: 'cpu', header: 'CPU', render: (row) => row.cpu_load == null ? '-' : `${row.cpu_load}%` },
        { key: 'actions', header: 'Actions', render: (row) => <button className="btn" onClick={() => manualPoll(row.id)}>Manual poll</button> },
      ]} />}
      {selectedId && details.data && (
        <div className="grid gap-5 xl:grid-cols-2">
          <GenericTable title="Interfaces" rows={details.data.interfaces} />
          <GenericTable title="DHCP Leases" rows={details.data.dhcpLeases} />
          <GenericTable title="PPPoE Active" rows={details.data.pppActive} />
          <GenericTable title="Simple Queues" rows={details.data.simpleQueues} />
        </div>
      )}
    </div>
  )
}

function GenericTable({ title, rows }: { title: string; rows: Array<Record<string, string | number>> }) {
  const keys = Object.keys(rows[0] || {}).slice(0, 6)
  return <section className="space-y-2"><h2 className="text-base font-semibold">{title}</h2><DataTable data={rows} getRowKey={(row) => JSON.stringify(row)} columns={keys.map((key) => ({ key, header: key, render: (row: Record<string, string | number>) => String(row[key] ?? '-') }))} emptyText="No polled data yet" /></section>
}

function SimplePage<T extends Record<string, unknown>>({ title, detail, path, columns }: { title: string; detail: string; path: string; columns: TableColumn<T>[] }) {
  const api = useApi<T[]>(path)
  return <div className="space-y-5"><Toolbar title={title} detail={detail} onRefresh={api.refresh} /><StateBlock loading={api.loading} error={api.error} empty={(api.data || []).length === 0} />{api.data && <DataTable data={api.data} getRowKey={(row) => typeof row.id === 'number' || typeof row.id === 'string' ? row.id : JSON.stringify(row)} columns={columns} />}</div>
}

function App() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard')
  return (
    <AppShell activePage={activePage} onPageChange={setActivePage}>
      {activePage === 'dashboard' && <DashboardPage />}
      {activePage === 'clients' && <ClientsPage />}
      {activePage === 'mikrotik' && <MikrotikPage />}
      {activePage === 'onus' && <SimplePage<Onu> title="ONUs/ONTs" detail="Manual ONU inventory, assignment and signal state" path="/onus" columns={[
        { key: 'serial', header: 'Serial', render: (row) => <span className="font-medium">{row.serial_number}</span> },
        { key: 'client', header: 'Client', render: (row) => row.client_name || '-' },
        { key: 'olt', header: 'OLT', render: (row) => row.olt_name || '-' },
        { key: 'pon', header: 'PON/ID', render: (row) => `${row.pon_port || '-'} / ${row.onu_id || '-'}` },
        { key: 'signal', header: 'RX/TX', render: (row) => `${row.rx_power ?? '-'} / ${row.tx_power ?? '-'}` },
        { key: 'auth', header: 'Authorization', render: (row) => <StatusBadge value={row.authorization_status} /> },
        { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
      ]} />}
      {activePage === 'olts' && <SimplePage<Olt> title="OLTs" detail="Driver-based OLT support. Mock works now; real drivers are TODO." path="/olts" columns={[
        { key: 'name', header: 'Name', render: (row) => <span className="font-medium">{row.name}</span> },
        { key: 'vendor', header: 'Vendor', render: (row) => row.vendor },
        { key: 'host', header: 'Host', render: (row) => row.host || '-' },
        { key: 'enabled', header: 'Enabled', render: (row) => row.enabled ? 'Yes' : 'No' },
        { key: 'poll', header: 'Poll', render: (row) => <StatusBadge value={row.last_poll_status} /> },
      ]} />}
      {activePage === 'monitoring' && <SimplePage<PollLog> title="Monitoring" detail="Device poll logs and traffic samples from MySQL" path="/monitoring" columns={[
        { key: 'target', header: 'Target', render: (row) => row.target_name || row.interface_name || '-' },
        { key: 'rx', header: 'RX bps', render: (row) => row.rx_bps || 0 },
        { key: 'tx', header: 'TX bps', render: (row) => row.tx_bps || 0 },
        { key: 'time', header: 'Sampled', render: (row) => row.sampled_at || row.created_at },
      ]} />}
      {activePage === 'settings' && <SimplePage<Setting> title="Settings" detail="Polling interval, thresholds, mock mode, health and encryption status" path="/settings" columns={[
        { key: 'key', header: 'Key', render: (row) => <span className="font-medium">{row.setting_key}</span> },
        { key: 'value', header: 'Value', render: (row) => row.setting_value },
        { key: 'updated', header: 'Updated', render: (row) => row.updated_at },
      ]} />}
    </AppShell>
  )
}

export default App
