export type ApiState<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error(`API ${response.status}: ${await response.text()}`)
  }
  return response.json() as Promise<T>
}

export async function apiSend<T>(path: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) {
    throw new Error(`API ${response.status}: ${await response.text()}`)
  }
  return response.json() as Promise<T>
}
