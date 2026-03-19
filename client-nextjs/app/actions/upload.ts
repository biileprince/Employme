"use server";

import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

/**
 * Upload files server-side (handles FormData)
 */
export async function uploadFiles(formData: FormData): Promise<{
  success: boolean;
  attachments?: Array<{ id: string; url: string; filename: string }>;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const headers: HeadersInit = {};
    if (token) {
      headers["Cookie"] = `token=${token}`;
    }

    const response = await fetch(`${API_URL}/attachments/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("[uploadFiles] Error:", response.status, errorData);
      return { success: false, error: "Failed to upload files" };
    }

    const data = await response.json();
    return {
      success: true,
      attachments: data.data?.attachments || [],
    };
  } catch (error) {
    console.error("File upload error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Upload failed";
    return { success: false, error: errorMessage };
  }
}

/**
 * Upload profile image
 */
export async function uploadProfileImage(formData: FormData): Promise<{
  success: boolean;
  imageUrl?: string;
  error?: string;
}> {
  formData.append("type", "USER");
  const result = await uploadFiles(formData);

  if (result.success && result.attachments && result.attachments.length > 0) {
    // @ts-ignore
    revalidateTag("user-profile");
    return { success: true, imageUrl: result.attachments[0].url };
  }

  return { success: false, error: result.error || "Failed to upload image" };
}

/**
 * Upload resume/CV
 */
export async function uploadResume(formData: FormData): Promise<{
  success: boolean;
  attachment?: { id: string; url: string; filename: string };
  error?: string;
}> {
  formData.append("type", "USER");
  const result = await uploadFiles(formData);

  if (result.success && result.attachments && result.attachments.length > 0) {
    // @ts-ignore
    revalidateTag("user-profile");
    return { success: true, attachment: result.attachments[0] };
  }

  return { success: false, error: result.error || "Failed to upload resume" };
}
