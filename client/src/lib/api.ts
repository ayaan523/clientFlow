const base = import.meta.env.VITE_API_URL || "http://localhost:4300/api/v1";
export async function api<T = any>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(body?.error?.message || "Request failed");
  return body;
}
