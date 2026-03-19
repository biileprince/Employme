"use server";

import { serverFetch } from "@/lib/server-api";
import { revalidateTag } from "next/cache";
import {
  jobSeekerProfileSchema,
  employerProfileSchema,
  validateData,
  type JobSeekerProfileInput,
  type EmployerProfileInput,
} from "@/lib/validations";

export async function updateJobSeekerProfile(data: unknown): Promise<{
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}> {
  // Server-side validation - NEVER trust client input
  const validation = validateData(jobSeekerProfileSchema, data);

  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: validation.errors,
    };
  }

  const validatedData: JobSeekerProfileInput = validation.data;

  try {
    const response = await serverFetch("/users/profile/job-seeker", {
      method: "PUT",
      body: JSON.stringify(validatedData),
    });

    if (response.success) {
      // @ts-ignore
      revalidateTag("user-profile");
      return { success: true };
    }
    return {
      success: false,
      error: response.error || "Failed to update profile",
    };
  } catch (error) {
    console.error("Failed to update profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function updateEmployerProfile(data: unknown): Promise<{
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}> {
  // Server-side validation - NEVER trust client input
  const validation = validateData(employerProfileSchema, data);

  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: validation.errors,
    };
  }

  const validatedData: EmployerProfileInput = validation.data;

  try {
    const response = await serverFetch("/users/profile/employer", {
      method: "PUT",
      body: JSON.stringify(validatedData),
    });

    if (response.success) {
      // @ts-ignore
      revalidateTag("employer-profile");
      return { success: true };
    }
    return {
      success: false,
      error: response.error || "Failed to update profile",
    };
  } catch (error) {
    console.error("Failed to update employer profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}
