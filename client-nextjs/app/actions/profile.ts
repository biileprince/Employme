"use server";

import { serverFetch } from "@/lib/server-api";
import { revalidateTag } from "next/cache";

export async function updateJobSeekerProfile(data: any) {
  try {
    const response = await serverFetch("/users/profile/job-seeker", {
      method: "PUT",
      body: JSON.stringify(data),
    });

    if (response.success) {
      // Revalidate any user or profile tags if we implement them
      // @ts-ignore
      revalidateTag("user-profile");
      return { success: true };
    }
    return { success: false, error: response.error || "Failed to update profile" };
  } catch (error) {
    console.error("Failed to update profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}
