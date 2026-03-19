import { serverFetch } from "@/lib/server-api";
import { redirect } from "next/navigation";
import JobSeekerProfileForm from "@/components/job-seeker/ProfileForm";

export const metadata = {
  title: "My Profile | Employ.me",
  description: "Manage your professional profile and information",
};

interface UserResponse {
  user: {
    id: string;
    email: string;
    imageUrl?: string;
    profile?: {
      id: string;
      firstName: string;
      lastName: string;
      dateOfBirth: string | null;
      location: string | null;
      bio: string | null;
      skills: string[];
      experience: string | null;
      education: string | null;
      cvUrl: string | null;
      profileImageUrl: string | null;
      phone: string | null;
      countryCode: string | null;
      isProfilePublic: boolean;
      resumeAttachments?: Array<{
        id: string;
        url: string;
        filename: string;
        fileType: string;
        fileSize: number;
      }>;
    };
  };
}

export default async function JobSeekerProfilePage() {
  let profileData = null;
  let userEmail = "";
  let userImageUrl = "";

  try {
    const response = await serverFetch<UserResponse>("/users/me", {
      next: { tags: ["user-profile"], revalidate: 0 },
    });

    if (response.success && response.data?.user) {
      const user = response.data.user;
      userEmail = user.email;
      userImageUrl = user.imageUrl || "";
      profileData = user.profile || null;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "";
    if (errorMessage.includes("401") || errorMessage.includes("403")) {
      redirect("/auth/login");
    }
    console.error("Failed to load profile:", error);
  }

  return (
    <JobSeekerProfileForm
      initialProfile={profileData}
      userEmail={userEmail}
      userImageUrl={userImageUrl}
    />
  );
}
