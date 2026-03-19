"use server";

import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { serverFetch } from "@/lib/server-api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

/**
 * Upload files to the server (handles FormData without JSON content-type)
 */
async function uploadAttachments(
  files: File[],
  type: string = "APPLICATION",
): Promise<{ attachmentIds: string[] }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  formData.append("type", type);

  const headers: HeadersInit = {};
  if (token) {
    headers["Cookie"] = `token=${token}`;
  }

  const response = await fetch(`${API_URL}/attachments/upload`, {
    method: "POST",
    headers,
    body: formData, // FormData sets its own content-type with boundary
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("[uploadAttachments] Error:", response.status, errorData);
    throw new Error("Failed to upload attachments");
  }

  const data = await response.json();
  const attachmentIds =
    data.data?.attachments?.map((a: { id: string }) => a.id) || [];
  return { attachmentIds };
}

/**
 * Submit a job application with files
 * Accepts FormData with:
 * - jobId: string
 * - files: File[] (optional)
 */
export async function submitApplication(formData: FormData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const jobId = formData.get("jobId") as string;
    const files = formData.getAll("files") as File[];

    if (!jobId) {
      return { success: false, error: "Job ID is required" };
    }

    // Upload files if present
    let attachmentIds: string[] = [];
    const validFiles = files.filter((file) => file.size > 0);

    if (validFiles.length > 0) {
      const uploadResult = await uploadAttachments(validFiles);
      attachmentIds = uploadResult.attachmentIds;
    }

    // Submit application
    const response = await serverFetch<{ application: unknown }>(
      "/applications/apply",
      {
        method: "POST",
        body: JSON.stringify({
          jobId,
          coverLetter: "",
          attachmentIds,
        }),
      },
    );

    if (response.success) {
      // Invalidate related caches
      // @ts-ignore
      revalidateTag("applications");
      // @ts-ignore
      revalidateTag(`job-${jobId}`);
      // @ts-ignore
      revalidateTag("job-seeker-applications");
      return { success: true };
    }

    return {
      success: false,
      error: response.error || "Failed to submit application",
    };
  } catch (error) {
    console.error("Failed to submit application:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to submit application";
    return { success: false, error: errorMessage };
  }
}
