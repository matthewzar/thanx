const BASE_URL = 'http://localhost:3000/api/v1'
const USER_ID = String(import.meta.env.VITE_USER_ID ?? '1')

export class ApiError extends Error {
  readonly status: number
  readonly errors: string[]

  constructor(status: number, errors: string[]) {
    super(errors[0] ?? `HTTP ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: init.method,
    body: init.body,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': USER_ID,
    },
  })

  if (!response.ok) {
    let errors: string[]
    try {
      const body = (await response.json()) as { errors?: string[] }
      errors =
        Array.isArray(body.errors) && body.errors.length > 0
          ? body.errors
          : [response.statusText]
    } catch {
      errors = [response.statusText]
    }
    throw new ApiError(response.status, errors)
  }

  return response.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string): Promise<T> => request<T>(path),
  post: <T>(path: string, body: unknown): Promise<T> =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
}
