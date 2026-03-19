import { cookies, headers } from "next/headers";
import type { ApiResponse } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

/**
 * Server-side fetch that properly forwards authentication cookies
 * from the incoming Next.js request to the Express backend.
 */
export async function serverFetch<T>(
  endpoint: string,
  requestInit: RequestInit = {},
): Promise<ApiResponse<T>> {
  const cookieStore = await cookies();
  const headersList = await headers();

  // Forward all cookies from the incoming request
  const cookieHeader = headersList.get("cookie");

  const options: RequestInit = {
    ...requestInit,
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader && { Cookie: cookieHeader }),
      ...requestInit.headers,
    },
    credentials: "include", // Important for cross-origin cookie forwarding
  };

  const url = `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(
        `[serverFetch] Error on ${endpoint}:`,
        response.status,
        errorData,
      );

      // Don't throw on auth errors, return error response instead
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          message: "Authentication required",
          error: errorData,
        } as ApiResponse<T>;
      }

      return {
        success: false,
        message: `API error: ${response.status}`,
        error: errorData,
      } as ApiResponse<T>;
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : {}) as ApiResponse<T>;
  } catch (error) {
    console.error(`[serverFetch] Network error on ${endpoint}:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Network error",
    } as ApiResponse<T>;
  }
}
