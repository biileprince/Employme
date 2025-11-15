import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { RegisterForm } from "../../components/auth/RegisterForm";
import { RoleSelection } from "../../components/auth/RoleSelection";
import { EmailVerification } from "../../components/auth/EmailVerification";
import { useAuth } from "../../contexts/AuthContext";
import { authAPI, apiClient } from "../../services/api";
import type { UserRole } from "../../types/auth";
import skypattern from "../../assets/images/skypattern.jpg";
import imagegreet from "../../assets/images/imagegreet.jpg";

type SignupStep = "role-selection" | "register" | "verify-email";

export default function SignupPage() {
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState<SignupStep>("role-selection");
  const [selectedRole, setSelectedRole] = useState<UserRole | undefined>();
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [isSocialAuth, setIsSocialAuth] = useState(false);
  const [socialEmail, setSocialEmail] = useState<string>("");
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check for social auth parameters
  useEffect(() => {
    const step = searchParams.get("step");
    const social = searchParams.get("social");
    const email = searchParams.get("email");

    if (step === "role-selection" && social === "true" && email) {
      // Retrieve the stored role from localStorage
      const storedRole = localStorage.getItem(
        "pending_social_auth_role"
      ) as UserRole;

      if (storedRole) {
        console.log("Retrieved stored role:", storedRole);
        // Automatically complete registration with the stored role
        completeSocialRegistration(storedRole, email);
      } else {
        // Fallback: show role selection if no role was stored
        setIsSocialAuth(true);
        setSocialEmail(email);
        setCurrentStep("role-selection");
      }
    }
  }, [searchParams]);

  const completeSocialRegistration = async (role: UserRole, email: string) => {
    try {
      const response = await authAPI.completeSocialAuth({
        role,
        email,
      });

      if (response.success && response.data) {
        const data = response.data as { token: string; user: any };

        // Store the token
        apiClient.setToken(data.token);

        // Clear the stored role
        localStorage.removeItem("pending_social_auth_role");

        // Redirect to onboarding since new user doesn't have profile yet
        navigate("/onboarding");
      } else {
        throw new Error(
          response.message || "Failed to complete social authentication"
        );
      }
    } catch (error) {
      console.error("Social auth completion error:", error);
      // Clear the stored role on error
      localStorage.removeItem("pending_social_auth_role");
      // Show role selection as fallback
      setIsSocialAuth(true);
      setSocialEmail(email);
      setCurrentStep("role-selection");
    }
  };

  // Redirect authenticated users based on role and profile status
  useEffect(() => {
    if (user) {
      if (user.hasProfile) {
        if (user.role === "EMPLOYER") {
          navigate("/employer/dashboard");
        } else {
          navigate("/dashboard");
        }
      } else {
        navigate("/onboarding");
      }
    }
  }, [user, navigate]);

  const handleRoleSelect = async (role: UserRole) => {
    setSelectedRole(role);

    // If this is social auth, complete the registration with the selected role
    if (isSocialAuth && socialEmail) {
      try {
        const response = await authAPI.completeSocialAuth({
          role,
          email: socialEmail,
        });

        if (response.success && response.data) {
          const data = response.data as { token: string; user: any };

          // Store the token
          apiClient.setToken(data.token);

          // Redirect to onboarding since new user doesn't have profile yet
          navigate("/onboarding");
        } else {
          throw new Error(
            response.message || "Failed to complete social authentication"
          );
        }
      } catch (error) {
        console.error("Social auth completion error:", error);
        alert("Failed to complete registration. Please try again.");
      }
    } else {
      // Regular registration flow
      setCurrentStep("register");
    }
  };

  const handleBackToRoleSelection = () => {
    setCurrentStep("role-selection");
    setSelectedRole(undefined);
  };

  const handleSwitchToLogin = () => {
    navigate("/login");
  };

  const handleRegistrationSuccess = (email: string) => {
    setPendingEmail(email);
    setCurrentStep("verify-email");
  };

  const handleVerificationSuccess = () => {
    navigate("/login");
  };

  const renderStep = () => {
    switch (currentStep) {
      case "role-selection":
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20 z-10"></div>
              <img
                src={skypattern}
                alt="Professional background"
                className="w-full h-full object-cover opacity-10"
              />
            </div>

            {/* Content */}
            <div className="relative z-20 w-full">
              <RoleSelection
                onRoleSelect={handleRoleSelect}
                selectedRole={selectedRole}
              />
            </div>

            {/* Additional decorative elements */}
            <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl"></div>
            <div className="absolute bottom-20 left-10 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl"></div>
          </div>
        );

      case "register":
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex">
            {/* Left side - Image */}
            <div className="hidden lg:flex lg:w-1/2 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-800/40 to-primary-900/60 dark:from-primary-900/70 dark:to-background/80 z-10"></div>
              <img
                src={imagegreet}
                alt="Professional background"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 z-20 flex items-center justify-center p-12">
                <div className="text-center text-white">
                  <h2 className="text-4xl font-bold mb-4">
                    {selectedRole === "EMPLOYER"
                      ? "Build Your Dream Team"
                      : "Start Your Career Journey"}
                  </h2>
                  <p className="text-xl opacity-90 mb-8">
                    {selectedRole === "EMPLOYER"
                      ? "Connect with talented professionals and grow your business"
                      : "Discover opportunities that match your skills and aspirations"}
                  </p>
                  <div className="w-24 h-1 bg-white/60 mx-auto rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Right side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8"
              >
                <RegisterForm
                  role={selectedRole!}
                  onRegistrationSuccess={handleRegistrationSuccess}
                  onSwitchToLogin={handleSwitchToLogin}
                />

                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleBackToRoleSelection}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center justify-center w-full"
                  >
                    ← Back to role selection
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        );

      case "verify-email":
        return (
          <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="max-w-md w-full">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-card rounded-2xl shadow-xl border border-border p-8"
              >
                <EmailVerification
                  email={pendingEmail}
                  onVerificationSuccess={handleVerificationSuccess}
                  onSwitchToLogin={handleSwitchToLogin}
                />
              </motion.div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderStep();
}
