import { NextRequest, NextResponse } from "next/server"
import { API_HOST } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, token, method = "GET", params = {} } = body as {
      path: string
      token: string
      method?: string
      params?: Record<string, unknown>
    }

    if (!path || !token) {
      return NextResponse.json(
        { error: "Missing path or token" },
        { status: 400 }
      )
    }

    const headers: Record<string, string> = {
      Authorization: token,
      "Content-Type": "application/json",
    }

    let url = `${API_HOST}${path}`
    const fetchOptions: RequestInit = { headers }

    if (method === "POST") {
      fetchOptions.method = "POST"
      fetchOptions.body = JSON.stringify(params)
    } else {
      const qs = new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ).toString()
      if (qs) url += `?${qs}`
      fetchOptions.method = "GET"
    }

    const response = await fetch(url, fetchOptions)
    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Proxy error:", error)
    return NextResponse.json(
      { error: "Failed to fetch from upstream API" },
      { status: 500 }
    )
  }
}
