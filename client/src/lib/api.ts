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
