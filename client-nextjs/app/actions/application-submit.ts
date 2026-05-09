"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { serverFetch } from "@/lib/server-api";
import { documentFileSchema, jobApplicationSchema } from "@/lib/validations";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 10;
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

/**
 * Validate uploaded files - NEVER trust client
 */
function validateFiles(files: File[]): {
  valid: boolean;
  error?: string;
  validFiles: File[];
} {
  if (files.length > MAX_FILES) {
    return { valid: false, error: `Maximum ${MAX_FILES} files allowed`, validFiles: [] };
  }

  const validFiles: File[] = [];

  for (const file of files) {
    // Skip empty files
    if (file.size === 0) continue;

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File "${file.name}" exceeds maximum size of 10MB`,
        validFiles: [],
      };
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `File "${file.name}" has invalid type. Only PDF, DOC, DOCX, and TXT allowed`,
        validFiles: [],
      };
    }

    // Check filename for potentially malicious patterns
    const filename = file.name.toLowerCase();
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\") ||
      filename.includes("\0")
    ) {
      return {
        valid: false,
        error: `File "${file.name}" has invalid filename`,
        validFiles: [],
      };
    }

    validFiles.push(file);
  }

  return { valid: true, validFiles };
}

/**
 * Upload files to the server (handles FormData without JSON content-type)
 */
async function uploadAttachments(
  files: File[],
  type: string = "APPLICATION",
): Promise<{ attachmentIds: string[] }> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const cookieHeader = allCookies
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  formData.append("type", type);

  const headers: HeadersInit = {};
  if (cookieHeader) {
    headers["Cookie"] = cookieHeader;
  }

  const response = await fetch(`${API_URL}/attachments/upload`, {
    method: "POST",
    headers,
    body: formData,
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
 * - coverLetter: string (optional)
 */
export async function submitApplication(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}> {
  try {
    // Extract and validate jobId
    const jobId = formData.get("jobId");
    const jobIdSchema = z.string().min(1, "Job ID is required").max(100);
    const jobIdResult = jobIdSchema.safeParse(jobId);

    if (!jobIdResult.success) {
      return { success: false, error: "Invalid job ID" };
    }

    // Extract and validate cover letter
    const coverLetter = formData.get("coverLetter") as string | null;
    const coverLetterSchema = z.string().max(5000, "Cover letter too long").optional();
    const coverLetterResult = coverLetterSchema.safeParse(coverLetter || "");

    if (!coverLetterResult.success) {
      return { success: false, error: "Invalid cover letter" };
    }

    // Extract and validate files
    const files = formData.getAll("files") as File[];
    const fileValidation = validateFiles(files);

    if (!fileValidation.valid) {
      return { success: false, error: fileValidation.error };
    }

    // Require at least one file for job applications
    if (fileValidation.validFiles.length === 0) {
      return {
        success: false,
        error: "Please upload at least one document (resume required)",
      };
    }

    // Upload files
    let attachmentIds: string[] = [];
    if (fileValidation.validFiles.length > 0) {
      const uploadResult = await uploadAttachments(fileValidation.validFiles);
      attachmentIds = uploadResult.attachmentIds;
    }

    // Final validation of application data
    const applicationData = {
      jobId: jobIdResult.data,
      coverLetter: coverLetterResult.data || "",
      attachmentIds,
    };

    const applicationValidation = jobApplicationSchema.safeParse(applicationData);
    if (!applicationValidation.success) {
      return { success: false, error: "Invalid application data" };
    }

    // Submit application
    const response = await serverFetch<{ application: unknown }>(
      "/applications/apply",
      {
        method: "POST",
        body: JSON.stringify(applicationValidation.data),
      },
    );

    if (response.success) {
      // @ts-ignore
      revalidateTag("applications");
      // @ts-ignore
      revalidateTag(`job-${jobIdResult.data}`);
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
