"use server";

import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

/**
 * Validate file - NEVER trust client input
 */
function validateFile(
  file: File,
  allowedTypes: string[],
): { valid: boolean; error?: string } {
  // Check if it's actually a File object
  if (!(file instanceof File)) {
    return { valid: false, error: "Invalid file" };
  }

  // Check file size
  if (file.size === 0) {
    return { valid: false, error: "File is empty" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File size must be less than 10MB" };
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(", ")}`,
    };
  }

  // Check filename for potentially malicious patterns
  const filename = file.name.toLowerCase();
  if (
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\") ||
    filename.includes("\0") ||
    filename.length > 255
  ) {
    return { valid: false, error: "Invalid filename" };
  }

  return { valid: true };
}

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
 * Upload profile image with validation
 */
export async function uploadProfileImage(formData: FormData): Promise<{
  success: boolean;
  imageUrl?: string;
  error?: string;
}> {
  // Extract and validate file
  const files = formData.getAll("files");

  if (files.length === 0) {
    return { success: false, error: "No file provided" };
  }

  if (files.length > 1) {
    return { success: false, error: "Only one image allowed" };
  }

  const file = files[0] as File;
  const validation = validateFile(file, ALLOWED_IMAGE_TYPES);

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Create clean FormData with validated file
  const cleanFormData = new FormData();
  cleanFormData.append("files", file);
  cleanFormData.append("type", "USER");

  const result = await uploadFiles(cleanFormData);

  if (result.success && result.attachments && result.attachments.length > 0) {
    // @ts-ignore
    revalidateTag("user-profile");
    return { success: true, imageUrl: result.attachments[0].url };
  }

  return { success: false, error: result.error || "Failed to upload image" };
}

/**
 * Upload resume/CV with validation
 */
export async function uploadResume(formData: FormData): Promise<{
  success: boolean;
  attachment?: { id: string; url: string; filename: string };
  error?: string;
}> {
  // Extract and validate file
  const files = formData.getAll("files");

  if (files.length === 0) {
    return { success: false, error: "No file provided" };
  }

  if (files.length > 1) {
    return { success: false, error: "Only one resume allowed" };
  }

  const file = files[0] as File;
  const validation = validateFile(file, ALLOWED_DOCUMENT_TYPES);

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Create clean FormData with validated file
  const cleanFormData = new FormData();
  cleanFormData.append("files", file);
  cleanFormData.append("type", "USER");

  const result = await uploadFiles(cleanFormData);

  if (result.success && result.attachments && result.attachments.length > 0) {
    // @ts-ignore
    revalidateTag("user-profile");
    return { success: true, attachment: result.attachments[0] };
  }

  return { success: false, error: result.error || "Failed to upload resume" };
}
