import { motion } from "framer-motion";
import { FaGoogle, FaLinkedin, FaFacebook } from "react-icons/fa";

interface SocialLoginProps {
  className?: string;
  text?: string;
  selectedRole?: string;
}

const SocialLogin: React.FC<SocialLoginProps> = ({
  className = "",
  text = "Continue with",
  selectedRole,
}) => {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

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
          <span className="px-3 bg-background text-muted-foreground font-medium">
            Or continue with
          </span>
        </div>
      </div>

      {/* Responsive Social Login Buttons */}
      <div className="space-y-3">
        {/* Mobile Layout: Full-width buttons with text */}
        <div className="sm:hidden space-y-3">
          {/* Google Login */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSocialLogin("google")}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-xl bg-card hover:bg-muted/50 transition-colors duration-200 text-foreground font-medium"
          >
            <FaGoogle className="w-5 h-5 text-red-500" />
            {text} Google
          </motion.button>

          {/* LinkedIn Login */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSocialLogin("linkedin")}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-xl bg-card hover:bg-muted/50 transition-colors duration-200 text-foreground font-medium"
          >
            <FaLinkedin className="w-5 h-5 text-blue-600" />
            {text} LinkedIn
          </motion.button>

          {/* Facebook Login */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSocialLogin("facebook")}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-xl bg-card hover:bg-muted/50 transition-colors duration-200 text-foreground font-medium"
          >
            <FaFacebook className="w-5 h-5 text-blue-700" />
            {text} Facebook
          </motion.button>
        </div>

        {/* Desktop/Tablet Layout: Side by side buttons */}
        <div className="hidden sm:grid sm:grid-cols-3 gap-2 md:gap-3">
          {/* Google Login */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSocialLogin("google")}
            className="flex items-center justify-center gap-2 px-3 py-3 md:py-4 border border-border rounded-xl bg-card hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-950/20 transition-all duration-200 text-foreground font-medium text-sm group shadow-sm hover:shadow-md"
          >
            <FaGoogle className="w-5 h-5 text-red-500 group-hover:text-red-600 transition-colors flex-shrink-0" />
            <span className="md:inline hidden whitespace-nowrap">Google</span>
          </motion.button>

          {/* LinkedIn Login */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSocialLogin("linkedin")}
            className="flex items-center justify-center gap-2 px-3 py-3 md:py-4 border border-border rounded-xl bg-card hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950/20 transition-all duration-200 text-foreground font-medium text-sm group shadow-sm hover:shadow-md"
          >
            <FaLinkedin className="w-5 h-5 text-blue-600 group-hover:text-blue-700 transition-colors flex-shrink-0" />
            <span className="md:inline hidden whitespace-nowrap">LinkedIn</span>
          </motion.button>

          {/* Facebook Login */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSocialLogin("facebook")}
            className="flex items-center justify-center gap-2 px-3 py-3 md:py-4 border border-border rounded-xl bg-card hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950/20 transition-all duration-200 text-foreground font-medium text-sm group shadow-sm hover:shadow-md"
          >
            <FaFacebook className="w-5 h-5 text-blue-700 group-hover:text-blue-800 transition-colors flex-shrink-0" />
            <span className="md:inline hidden whitespace-nowrap">Facebook</span>
          </motion.button>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-4 leading-relaxed">
        By continuing, you agree to our{" "}
        <a
          href="/terms"
          className="text-primary hover:underline font-medium transition-colors hover:text-primary/80"
        >
          Terms of Service
        </a>{" "}
        and{" "}
        <a
          href="/privacy"
          className="text-primary hover:underline font-medium transition-colors hover:text-primary/80"
        >
          Privacy Policy
        </a>
      </p>
    </div>
  );
};

export default SocialLogin;
