"use server";

import { serverFetch } from "@/lib/server-api";
import { revalidateTag } from "next/cache";

export async function toggleJobStatus(jobId: string, isActive: boolean) {
  try {
    const response = await serverFetch(`/jobs/${jobId}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });

    if (response.success) {
      // @ts-ignore
      revalidateTag("my-jobs");
      // @ts-ignore
      revalidateTag(`job-${jobId}`);
      return { success: true };
    } else {
      return { success: false, error: "Failed to update job status" };
    }
  } catch (error) {
    console.error("Failed to toggle job status:", error);
    return { success: false, error: "Failed to update job status" };
  }
}

export async function deleteJob(jobId: string) {
  try {
    const response = await serverFetch(`/jobs/${jobId}`, {
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

export async function createJob(jobData: any) {
  try {
    const response = await serverFetch("/jobs", {
      method: "POST",
      body: JSON.stringify(jobData),
    });

    if (response.success) {
      // @ts-ignore
      revalidateTag("jobs");
      // @ts-ignore
      revalidateTag("my-jobs");
      return { success: true, data: response.data };
    } else {
      return { success: false, error: response.error || "Failed to create job" };
    }
  } catch (error: any) {
    console.error("Failed to create job:", error);
    return { success: false, error: error.message || "Failed to create job" };
  }
}

export async function toggleSaveJob(jobId: string, isSaved: boolean) {
  try {
    const endpoint = isSaved ? "/saved-jobs/remove" : "/saved-jobs/save";
    const response = await serverFetch(endpoint, {
      method: "POST",
      body: JSON.stringify({ jobId }),
    });

    if (response.success || response.data) {
      // @ts-ignore
      revalidateTag("saved-jobs");
      return { success: true };
    } else {
      return { success: false, error: response.error || "Failed to toggle save job" };
    }
  } catch (error: any) {
    console.error("Failed to toggle save job:", error);
    return { success: false, error: error.message || "Failed to toggle save job" };
  }
}
