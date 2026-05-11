export interface RequestOptions extends RequestInit {
  baseUrl?: string;
  token?: string;
  xClient?: string;
}

export interface ApiError extends Error {
  status?: number;
  details?: any;
}

export async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { baseUrl, token, xClient, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers || {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (xClient) {
    headers.set("X-Client", xClient);
  }

  const url = baseUrl 
    ? `${baseUrl.replace(/\/+$/, "")}/${endpoint.replace(/^\/+/, "")}`
    : endpoint;

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(
      errorData.error || errorData.message || `Request failed with status ${response.status}`
    ) as ApiError;
    error.status = response.status;
    error.details = errorData.details;
    throw error;
  }

  const json = await response.json();
  return json.data as T;
}
