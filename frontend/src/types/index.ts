export type ClientStatus = 'active' | 'suspended' | 'offline'
export type OnuStatus = 'online' | 'offline' | 'unauthorized'
export type OltStatus = 'online' | 'offline' | 'degraded'
export type Vendor = 'ZTE' | 'Huawei' | 'BDCOM' | 'VSOL' | 'Other'
export type UserRole = 'admin' | 'technician' | 'viewer'

export interface Client {
  id: number
  name: string
  phone: string
  address: string
  packagePlan: string
  status: ClientStatus
  assignedOnuSerial: string
  routerInfo: string
  notes: string
}

export interface Olt {
  id: number
  name: string
  vendor: Vendor
  ipAddress: string
  sshPort: number
  telnetPort: number
  snmpCommunity: string
  status: OltStatus
  lastPoll: string
}

export interface PonPort {
  id: number
  oltId: number
  label: string
  description: string
  onuCount: number
  onlineCount: number
}

export interface Onu {
  id: number
  serialNumber: string
  clientId: number | null
  oltId: number
  oltName: string
  ponPort: string
  onuId: number
  rxSignal: number
  txSignal: number
  distanceMeters: number
  status: OnuStatus
  lastSeen: string
}

export interface OnuEvent {
  id: number
  onuSerial: string
  oltName: string
  eventType: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  createdAt: string
}

export interface SignalHistory {
  id: number
  onuSerial: string
  rxSignal: number
  txSignal: number
  recordedAt: string
}

export interface RouterInfo {
  id: number
  clientId: number
  model: string
  ipAddress: string
  macAddress: string
  firmware: string
}

export interface AppSettings {
  signalWarningThreshold: number
  signalCriticalThreshold: number
  mockMode: boolean
  roles: UserRole[]
  apiBaseUrl: string
  workerPollIntervalSeconds: number
}

export type PageKey =
  | 'dashboard'
  | 'olts'
  | 'onus'
  | 'provisioning'
  | 'acs'
  | 'access'
  | 'customers'
  | 'billing'
  | 'mikrotik'
  | 'alerts'
  | 'topology'
  | 'security'
  | 'settings'

export interface PlatformKpis {
  customers: number
  onlineOnus: number
  offlineOnus: number
  unauthorizedOnus: number
  activeAlerts: number
  monthlyRevenue: number
}

export interface TrafficPoint {
  time: string
  down: number
  up: number
}

export interface SignalPoint {
  time: string
  rx: number
  tx: number
}

export interface PlatformDashboard {
  kpis: PlatformKpis
  traffic: TrafficPoint[]
  signalHistory: SignalPoint[]
  recentAlerts: PlatformAlert[]
}

export interface PlatformOlt {
  id: number
  name: string
  vendor: string
  model: string
  firmware: string
  ipAddress: string
  status: string
  cpu: number
  memory: number
  temperature: number
  ponPorts: number
  activeOnus: number
  alarms: number
  trafficMbps: number
}

export interface PlatformOnu {
  id: number
  serialNumber: string
  ploam: string
  loid: string
  customerName: string
  oltName: string
  ponPort: string
  onuId: number
  rxSignal: number
  txSignal: number
  uptime: string
  distanceMeters: number
  status: string
  macAddress: string
  vlan: number | null
  firmware: string
  serviceMode: string
  lastSeen: string
}

export interface PlatformCustomer {
  id: number
  type: string
  name: string
  status: string
  services: number
  balance: number
  packageName: string
  phone: string
}

export interface PlatformAlert {
  id: number
  severity: 'info' | 'warning' | 'critical'
  type: string
  target: string
  message: string
  createdAt: string
  acknowledged: boolean
}

export interface ServiceProfile {
  id: number
  name: string
  downloadMbps: number
  uploadMbps: number
  vlan: number
  mode: string
  price: number
}

export interface PppoeAccount {
  id: number
  username: string
  profile: string
  router: string
  status: string
  sessionUptime: string
  address: string
}

export interface Tr069Device {
  id: number
  serialNumber: string
  vendor: string
  productClass: string
  softwareVersion: string
  lastInform: string
  status: string
}

export interface MikrotikRouter {
  id: number
  name: string
  ipAddress: string
  version: string
  status: string
  pppoeSessions: number
  cpu: number
  trafficMbps: number
}

export interface Invoice {
  id: number
  customerName: string
  number: string
  amount: number
  dueDate: string
  status: string
}
