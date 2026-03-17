import { cookies } from "next/headers";
import type { ApiResponse } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

/**
 * A server-side alternative to apiClient.
 * Automatically forwards cookies (JWT) to the Express backend.
 */
export async function serverFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const cookieStore = await cookies();
  
  // Express reads cookies, but optionally we can pass Bearer token if backend expects it
  const token = cookieStore.get("token")?.value;

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  
  if (token) {
    // Pass cookie to backend for authentication
    headers.set("Cookie", `token=${token}`);
  }

  const url = `${API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`[serverFetch] Error on ${endpoint}:`, response.status, errorData);
    throw new Error(`API error: ${response.status}`);
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as ApiResponse<T>;
}
