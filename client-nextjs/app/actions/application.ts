"use server";

import { z } from "zod";
import { serverFetch } from "@/lib/server-api";
import { revalidateTag } from "next/cache";
import {
  applicationStatusSchema,
  interviewSchema,
  validateData,
  type ApplicationStatusInput,
  type InterviewInput,
} from "@/lib/validations";

// Simple ID validation schema
const idSchema = z.string().min(1, "ID is required").max(100, "ID is too long");

export async function updateApplicationStatus(
  applicationId: unknown,
  status: unknown,
): Promise<{
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}> {
  // Server-side validation - NEVER trust client input
  const validation = validateData(applicationStatusSchema, {
    applicationId,
    status,
  });

  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: validation.errors,
    };
  }

  const { applicationId: validApplicationId, status: validStatus } =
    validation.data;

  try {
    const response = await serverFetch(
      `/applications/${validApplicationId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status: validStatus }),
      },
    );

    if (response.success) {
      // @ts-ignore
      revalidateTag("employer-applications");
      // @ts-ignore
      revalidateTag(`application-${validApplicationId}`);
      return { success: true };
    }
    return {
      success: false,
      error: response.error || "Failed to update status",
    };
  } catch (error) {
    console.error("Failed to update application status:", error);
    return { success: false, error: "Failed to update application status" };
  }
}

export async function scheduleInterview(
  applicationId: unknown,
  data: unknown,
): Promise<{
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}> {
  // Validate application ID
  const applicationIdResult = idSchema.safeParse(applicationId);
  if (!applicationIdResult.success) {
    return { success: false, error: "Invalid application ID" };
  }

  // Server-side validation - NEVER trust client input
  const interviewData = {
    applicationId: applicationIdResult.data,
    ...(typeof data === "object" && data !== null ? data : {}),
  };

  const validation = validateData(interviewSchema, interviewData);

  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: validation.errors,
    };
  }

  const validatedData: InterviewInput = validation.data;

  try {
    const response = await serverFetch(
      `/applications/${applicationIdResult.data}/schedule-interview`,
      {
        method: "POST",
        body: JSON.stringify(validatedData),
      },
    );

    if (response.success) {
      // @ts-ignore
      revalidateTag("employer-applications");
      // @ts-ignore
      revalidateTag(`application-${applicationIdResult.data}`);
      // @ts-ignore
      revalidateTag(`application-${applicationIdResult.data}-interviews`);
      return { success: true };
    }
    return {
      success: false,
      error: response.error || "Failed to schedule interview",
    };
  } catch (error) {
    console.error("Failed to schedule interview:", error);
    return { success: false, error: "Failed to schedule interview" };
  }
}

export async function updateInterview(
  interviewId: unknown,
  data: unknown,
): Promise<{
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}> {
  // Validate interview ID
  const interviewIdResult = idSchema.safeParse(interviewId);
  if (!interviewIdResult.success) {
    return { success: false, error: "Invalid interview ID" };
  }

  // Use partial schema for updates (all fields optional except ID)
  const partialInterviewSchema = interviewSchema.partial().extend({
    applicationId: z.string().optional(), // Allow but ignore
  });

  const validation = validateData(partialInterviewSchema, data);

  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: validation.errors,
    };
  }

  // Remove applicationId from update data if present
  const { applicationId, ...updateData } = validation.data;

  try {
    const response = await serverFetch(
      `/interviews/${interviewIdResult.data}`,
      {
        method: "PUT",
        body: JSON.stringify(updateData),
      },
    );

    if (response.success) {
      // @ts-ignore
      revalidateTag("employer-applications");
      return { success: true };
    }
    return {
      success: false,
      error: response.error || "Failed to update interview",
    };
  } catch (error) {
    console.error("Failed to update interview:", error);
    return { success: false, error: "Failed to update interview" };
  }
}

export async function deleteInterview(
  interviewId: unknown,
): Promise<{ success: boolean; error?: string }> {
  // Validate interview ID
  const interviewIdResult = idSchema.safeParse(interviewId);
  if (!interviewIdResult.success) {
    return { success: false, error: "Invalid interview ID" };
  }

  try {
    const response = await serverFetch(
      `/interviews/${interviewIdResult.data}`,
      {
        method: "DELETE",
      },
    );

    if (response.success) {
      // @ts-ignore
      revalidateTag("employer-applications");
      return { success: true };
    }
    return {
      success: false,
      error: response.error || "Failed to delete interview",
    };
  } catch (error) {
    console.error("Failed to delete interview:", error);
    return { success: false, error: "Failed to delete interview" };
  }
}
