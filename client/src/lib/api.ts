export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed: ${res.status}`)
  }

  return res.json() as Promise<T>
}

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
