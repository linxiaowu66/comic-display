interface FetcherOptions {
  path: string
  token: string
  method?: "GET" | "POST"
  params?: Record<string, unknown>
  apiHost?: string
}

export async function apiFetcher([path, token, options]: [
  string,
  string,
  { method?: "GET" | "POST"; params?: Record<string, unknown>; apiHost?: string }?,
]) {
  const response = await fetch("/api/proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path,
      token,
      method: options?.method ?? "GET",
      params: options?.params ?? {},
      apiHost: options?.apiHost,
    }),
  })
  if (!response.ok) {
    throw new Error("API request failed")
  }
  return response.json()
}

export async function apiPost({ path, token, params, apiHost }: FetcherOptions) {
  return apiFetcher([path, token, { method: "POST", params, apiHost }])
}
