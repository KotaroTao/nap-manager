/**
 * API クライアント
 *
 * 共通のAPI呼び出しロジックを提供します。
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new ApiError(
      data.error || "APIエラーが発生しました",
      response.status,
      data
    )
  }
  return response.json()
}

export const api = {
  get: async <T>(url: string): Promise<T> => {
    const response = await fetch(url)
    return handleResponse<T>(response)
  },

  post: async <T>(url: string, data: unknown): Promise<T> => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return handleResponse<T>(response)
  },

  put: async <T>(url: string, data: unknown): Promise<T> => {
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return handleResponse<T>(response)
  },

  delete: async <T>(url: string): Promise<T> => {
    const response = await fetch(url, {
      method: "DELETE",
    })
    return handleResponse<T>(response)
  },

  patch: async <T>(url: string, data: unknown): Promise<T> => {
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return handleResponse<T>(response)
  },
}
