interface FetcherOptions {
  path: string
  token: string
  method?: "GET" | "POST"
  params?: Record<string, unknown>
  apiHost?: string
}

export async function apiFetcher([path, token, options, fallbackUrl]: [
  string,
  string,
  { method?: "GET" | "POST"; params?: Record<string, unknown>; apiHost?: string }?,
  string?
]) {
  try {
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
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check for standard error codes across different APIs
    if (data && data.code !== undefined && String(data.code) !== "1000" && String(data.code) !== "200" && String(data.code) !== "0") {
      throw new Error(`API Application Error: ${data.msg || data.error || data.code}`);
    }
    
    return data;
  } catch (error) {
    if (fallbackUrl) {
      console.warn("API request failed or returned error, falling back to cache:", fallbackUrl, error);
      const res = await fetch(fallbackUrl);
      if (res.ok) {
        return res.json(); // Returns { data: ... }
      }
    }
    throw error;
  }
}

export async function apiPost({ path, token, params, apiHost }: FetcherOptions) {
  return apiFetcher([path, token, { method: "POST", params, apiHost }])
}
