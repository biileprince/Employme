"use client";

import { motion } from "framer-motion";
import { FaGoogle, FaLinkedin, FaFacebook } from "react-icons/fa";

interface SocialLoginProps {
  className?: string;
  text?: string;
  selectedRole?: string;
}

export const SocialLogin: React.FC<SocialLoginProps> = ({
  className = "",
  text = "Continue with",
  selectedRole,
}) => {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

  const handleSocialLogin = async (provider: string) => {
    try {
      // Store the selected role in localStorage before OAuth redirect
      if (selectedRole) {
        localStorage.setItem("pending_social_auth_role", selectedRole);
        console.log("Stored role for social auth:", selectedRole);
      }

      // Clear any existing session before OAuth to prevent conflicts
      await fetch(`${baseUrl}/auth/clear-session`, {
        method: "POST",
        credentials: "include",
      });

      // Small delay to ensure session is cleared and role is stored
      setTimeout(() => {
        // Redirect to the backend OAuth route with role parameter
        const roleParam = selectedRole ? `?role=${selectedRole}` : "";
        window.location.href = `${baseUrl}/auth/${provider}${roleParam}`;
      }, 100);
    } catch (error) {
      console.error("Failed to clear session:", error);
      // Store role and proceed anyway
      if (selectedRole) {
        localStorage.setItem("pending_social_auth_role", selectedRole);
      }
      const roleParam = selectedRole ? `?role=${selectedRole}` : "";
      window.location.href = `${baseUrl}/auth/${provider}${roleParam}`;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-background px-3 font-medium text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      {/* Responsive Social Login Buttons */}
      <div className="space-y-3">
        {/* Mobile Layout: Full-width buttons with text */}
        <div className="space-y-3 sm:hidden">
          {/* Google Login */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSocialLogin("google")}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3 font-medium text-foreground transition-colors duration-200 hover:bg-muted/50"
          >
            <FaGoogle className="h-5 w-5 text-red-500" />
            {text} Google
          </motion.button>

          {/* LinkedIn Login */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSocialLogin("linkedin")}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3 font-medium text-foreground transition-colors duration-200 hover:bg-muted/50"
          >
            <FaLinkedin className="h-5 w-5 text-blue-600" />
            {text} LinkedIn
          </motion.button>

          {/* Facebook Login */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSocialLogin("facebook")}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3 font-medium text-foreground transition-colors duration-200 hover:bg-muted/50"
          >
            <FaFacebook className="h-5 w-5 text-blue-700" />
            {text} Facebook
          </motion.button>
        </div>

        {/* Desktop/Tablet Layout: Side by side buttons */}
        <div className="hidden gap-2 sm:grid sm:grid-cols-3 md:gap-3">
          {/* Google Login */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSocialLogin("google")}
            className="group flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-3 text-sm font-medium text-foreground shadow-sm transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:shadow-md dark:hover:bg-red-950/20 md:py-4"
          >
            <FaGoogle className="h-5 w-5 shrink-0 text-red-500 transition-colors group-hover:text-red-600" />
            <span className="hidden whitespace-nowrap md:inline">Google</span>
          </motion.button>

          {/* LinkedIn Login */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSocialLogin("linkedin")}
            className="group flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-3 text-sm font-medium text-foreground shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md dark:hover:bg-blue-950/20 md:py-4"
          >
            <FaLinkedin className="h-5 w-5 shrink-0 text-blue-600 transition-colors group-hover:text-blue-700" />
            <span className="hidden whitespace-nowrap md:inline">LinkedIn</span>
          </motion.button>

          {/* Facebook Login */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSocialLogin("facebook")}
            className="group flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-3 text-sm font-medium text-foreground shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md dark:hover:bg-blue-950/20 md:py-4"
          >
            <FaFacebook className="h-5 w-5 shrink-0 text-blue-700 transition-colors group-hover:text-blue-800" />
            <span className="hidden whitespace-nowrap md:inline">Facebook</span>
          </motion.button>
        </div>
      </div>

      <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
        By continuing, you agree to our{" "}
        <a
          href="/terms"
          className="font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
        >
          Terms of Service
        </a>{" "}
        and{" "}
        <a
          href="/privacy"
          className="font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
        >
          Privacy Policy
        </a>
      </p>
    </div>
  );
};
