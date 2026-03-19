"use server";

import { serverFetch } from "@/lib/server-api";
import { revalidateTag } from "next/cache";

export async function updateApplicationStatus(applicationId: string, status: string) {
  try {
    const response = await serverFetch(`/applications/${applicationId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });

    if (response.success) {
      // Revalidate applications tags so dashboards and lists stay instantly updated
      // @ts-ignore
      revalidateTag("employer-applications");
      // @ts-ignore
      revalidateTag(`application-${applicationId}`);
      return { success: true };
    }
    return { success: false, error: response.error || "Failed to update status" };
  } catch (error) {
    console.error("Failed to update application status:", error);
    return { success: false, error: "Failed to update application status" };
  }
}

export async function scheduleInterview(applicationId: string, data: any) {
  try {
    const response = await serverFetch(`/applications/${applicationId}/schedule-interview`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (response.success) {
      // @ts-ignore
      revalidateTag("employer-applications");
      // @ts-ignore
      revalidateTag(`application-${applicationId}`);
      // @ts-ignore
      revalidateTag(`application-${applicationId}-interviews`);
      return { success: true };
    }
    return { success: false, error: "Failed to schedule interview" };
  } catch (error) {
    console.error("Failed to schedule interview:", error);
    return { success: false, error: "Failed to schedule interview" };
  }
}

export async function updateInterview(interviewId: string, data: any) {
  try {
    const response = await serverFetch(`/interviews/${interviewId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });

    if (response.success) {
      // @ts-ignore
      revalidateTag("employer-applications");
      return { success: true };
    }
    return { success: false, error: "Failed to update interview" };
  } catch (error) {
    console.error("Failed to update interview:", error);
    return { success: false, error: "Failed to update interview" };
  }
}

export async function deleteInterview(interviewId: string) {
  try {
    const response = await serverFetch(`/interviews/${interviewId}`, {
      method: "DELETE",
    });

    if (response.success) {
      // @ts-ignore
      revalidateTag("employer-applications");
      return { success: true };
    }
    return { success: false, error: "Failed to delete interview" };
  } catch (error) {
    console.error("Failed to delete interview:", error);
    return { success: false, error: "Failed to delete interview" };
  }
}
