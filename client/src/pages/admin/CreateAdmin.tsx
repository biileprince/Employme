import { useState } from "react";
import { motion } from "framer-motion";
import {
  MdAdd,
  MdPerson,
  MdEmail,
  MdKey,
  MdSave,
  MdCancel,
} from "react-icons/md";
import Button from "../../components/ui/Button";
import { adminAPI } from "../../services/api";

interface CreateAdminFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  secretKey: string;
}

export default function CreateAdmin() {
  const [formData, setFormData] = useState<CreateAdminFormData>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    secretKey: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validate form
      if (
        !formData.email ||
        !formData.password ||
        !formData.firstName ||
        !formData.lastName ||
        !formData.secretKey
      ) {
        throw new Error("All fields are required");
      }

      if (formData.password.length < 8) {
        throw new Error("Password must be at least 8 characters long");
      }

      const response = await adminAPI.createAdmin(formData);

      if (response.success) {
        setSuccess(`Admin user created successfully! Email: ${formData.email}`);
        // Reset form
        setFormData({
          email: "",
          password: "",
          firstName: "",
          lastName: "",
          secretKey: "",
        });
      } else {
        throw new Error(response.message || "Failed to create admin user");
      }
    } catch (err: unknown) {
      console.error("Failed to create admin:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create admin user. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      secretKey: "",
    });
    setError("");
    setSuccess("");
  };

  return (
    <div className="p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto"
      >
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <MdAdd className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                Create Admin User
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Add a new administrator to the system
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <p className="text-green-700 font-medium">{success}</p>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-red-700 font-medium">{error}</p>
          </motion.div>
        )}

        {/* Form */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Name Fields - Side by side on larger screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  First Name *
                </label>
                <div className="relative">
                  <MdPerson className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    placeholder="Enter first name"
                  />
                </div>
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Last Name *
                </label>
                <div className="relative">
                  <MdPerson className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    placeholder="Enter last name"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address *
              </label>
              <div className="relative">
                <MdEmail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password *
              </label>
              <div className="relative">
                <MdKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter password (min 8 characters)"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Password must be at least 8 characters long
              </p>
            </div>

            {/* Secret Key */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Secret Key *
              </label>
              <div className="relative">
                <MdKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="password"
                  name="secretKey"
                  value={formData.secretKey}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter admin creation secret key"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                This is a special key required to create admin users
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 pt-6">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full sm:w-auto flex items-center justify-center min-h-[44px]"
              >
                <div className="flex items-center justify-center gap-2">
                  <MdSave className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">Create Admin</span>
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleReset}
                disabled={isLoading}
                className="w-full sm:w-auto flex items-center justify-center min-h-[44px]"
              >
                <div className="flex items-center justify-center gap-2">
                  <MdCancel className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">Reset</span>
                </div>
              </Button>
            </div>
          </form>
        </div>

        {/* Info Section */}
        <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
            <MdPerson className="w-4 h-4" />
            Important Notes:
          </h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Admin users have full access to the system</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Use strong passwords for security</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Admin credentials should be kept secure</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>
                New admin users can access all admin features immediately
              </span>
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
