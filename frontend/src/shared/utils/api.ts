export class ApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(message: string, code: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    credentials: 'include',
  })

  const contentType = res.headers.get('content-type') ?? ''
  const data = contentType.includes('application/json')
    ? (await res.json()) as { error?: { code: string; message: string } }
    : {}

  if (!res.ok) {
    const errData = data as { error?: { code: string; message: string } }
    const defaultMsg = res.status === 429 ? 'Too many requests — please wait a moment and try again.' : 'Request failed'
    const defaultCode = res.status === 429 ? 'RATE_LIMITED' : 'UNKNOWN'
    throw new ApiError(
      errData.error?.message ?? defaultMsg,
      errData.error?.code ?? defaultCode,
      res.status,
    )
  }

  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
}
