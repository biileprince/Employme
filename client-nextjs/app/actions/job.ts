"use server";

import { z } from "zod";
import { serverFetch } from "@/lib/server-api";
import { revalidateTag } from "next/cache";
import {
  jobPostingSchema,
  validateData,
  type JobPostingInput,
} from "@/lib/validations";

// Simple ID validation schema
const idSchema = z.string().min(1, "ID is required").max(100, "ID is too long");

export async function toggleJobStatus(
  jobId: unknown,
  isActive: unknown,
): Promise<{ success: boolean; error?: string }> {
  // Validate inputs
  const jobIdResult = idSchema.safeParse(jobId);
  const isActiveResult = z.boolean().safeParse(isActive);

  if (!jobIdResult.success) {
    return { success: false, error: "Invalid job ID" };
  }
  if (!isActiveResult.success) {
    return { success: false, error: "Invalid status value" };
  }

  try {
    const response = await serverFetch(`/jobs/${jobIdResult.data}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: isActiveResult.data }),
    });

    if (response.success) {
      // @ts-ignore
      revalidateTag("my-jobs");
      // @ts-ignore
      revalidateTag(`job-${jobIdResult.data}`);
      return { success: true };
    } else {
      return { success: false, error: "Failed to update job status" };
    }
  } catch (error) {
    console.error("Failed to toggle job status:", error);
    return { success: false, error: "Failed to update job status" };
  }
}

export async function deleteJob(
  jobId: unknown,
): Promise<{ success: boolean; error?: string }> {
  // Validate input
  const jobIdResult = idSchema.safeParse(jobId);

  if (!jobIdResult.success) {
    return { success: false, error: "Invalid job ID" };
  }

  try {
    const response = await serverFetch(`/jobs/${jobIdResult.data}`, {
      method: "DELETE",
    });

    if (response.success) {
      // @ts-ignore
      revalidateTag("my-jobs");
      return { success: true };
    } else {
      return { success: false, error: "Failed to delete job" };
    }
  } catch (error) {
    console.error("Failed to delete job:", error);
    return { success: false, error: "Failed to delete job" };
  }
}

export async function createJob(jobData: unknown): Promise<{
  success: boolean;
  data?: unknown;
  error?: string;
  fieldErrors?: Record<string, string>;
}> {
  // Server-side validation - NEVER trust client input
  const validation = validateData(jobPostingSchema, jobData);

  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: validation.errors,
    };
  }

  const validatedData: JobPostingInput = validation.data;

  // Additional server-side business logic validation
  if (
    validatedData.salaryMin &&
    validatedData.salaryMax &&
    validatedData.salaryMin > validatedData.salaryMax
  ) {
    return {
      success: false,
      error: "Minimum salary cannot be greater than maximum salary",
      fieldErrors: {
        salaryMin: "Must be less than or equal to maximum salary",
      },
    };
  }

  try {
    const response = await serverFetch("/jobs", {
      method: "POST",
      body: JSON.stringify(validatedData),
    });

    if (response.success) {
      // @ts-ignore
      revalidateTag("jobs");
      // @ts-ignore
      revalidateTag("my-jobs");
      return { success: true, data: response.data };
    } else {
      return {
        success: false,
        error: response.error || "Failed to create job",
      };
    }
  } catch (error) {
    console.error("Failed to create job:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create job";
    return { success: false, error: errorMessage };
  }
}

export async function updateJob(
  jobId: unknown,
  jobData: unknown,
): Promise<{
  success: boolean;
  data?: unknown;
  error?: string;
  fieldErrors?: Record<string, string>;
}> {
  // Validate job ID
  const jobIdResult = idSchema.safeParse(jobId);
  if (!jobIdResult.success) {
    return { success: false, error: "Invalid job ID" };
  }

  // Server-side validation - NEVER trust client input
  // Use partial schema for updates (all fields optional)
  const validation = validateData(jobPostingSchema.partial(), jobData);

  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: validation.errors,
    };
  }

  try {
    const response = await serverFetch(`/jobs/${jobIdResult.data}`, {
      method: "PATCH",
      body: JSON.stringify(validation.data),
    });

    if (response.success) {
      // @ts-ignore
      revalidateTag("jobs");
      // @ts-ignore
      revalidateTag("my-jobs");
      // @ts-ignore
      revalidateTag(`job-${jobIdResult.data}`);
      return { success: true, data: response.data };
    } else {
      return {
        success: false,
        error: response.error || "Failed to update job",
      };
    }
  } catch (error) {
    console.error("Failed to update job:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update job";
    return { success: false, error: errorMessage };
  }
}

export async function toggleSaveJob(
  jobId: unknown,
  isSaved: unknown,
): Promise<{ success: boolean; error?: string }> {
  // Validate inputs
  const jobIdResult = idSchema.safeParse(jobId);
  const isSavedResult = z.boolean().safeParse(isSaved);

  if (!jobIdResult.success) {
    return { success: false, error: "Invalid job ID" };
  }
  if (!isSavedResult.success) {
    return { success: false, error: "Invalid saved value" };
  }

  try {
    const endpoint = isSavedResult.data
      ? "/saved-jobs/remove"
      : "/saved-jobs/save";
    const response = await serverFetch(endpoint, {
      method: "POST",
      body: JSON.stringify({ jobId: jobIdResult.data }),
    });

    if (response.success || response.data) {
      // @ts-ignore
      revalidateTag("saved-jobs");
      return { success: true };
    } else {
      return {
        success: false,
        error: response.error || "Failed to toggle save job",
      };
    }
  } catch (error) {
    console.error("Failed to toggle save job:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to toggle save job";
    return { success: false, error: errorMessage };
  }
}
