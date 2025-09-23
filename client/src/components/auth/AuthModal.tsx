import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiX,
  HiLockClosed,
  HiUserAdd,
  HiSave,
  HiDocumentText,
  HiEye,
  HiShieldCheck,
} from "react-icons/hi";
import Button from "../ui/Button";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  actionType?: "save" | "apply" | "view" | "general";
}

const AuthModal = ({
  isOpen,
  onClose,
  title = "Login Required",
  message = "Please login to continue",
  actionType = "general",
}: AuthModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const getActionMessage = () => {
    switch (actionType) {
      case "save":
        return "To save jobs and build your personalized job list, please login to your account.";
      case "apply":
        return "To apply for this job and track your applications, please login to your account.";
      case "view":
        return "To view detailed job information and application status, please login to your account.";
      default:
        return message;
    }
  };

  const getActionIcon = () => {
    switch (actionType) {
      case "save":
        return <HiSave className="w-6 h-6 text-primary" />;
      case "apply":
        return <HiDocumentText className="w-6 h-6 text-primary" />;
      case "view":
        return <HiEye className="w-6 h-6 text-primary" />;
      default:
        return <HiShieldCheck className="w-6 h-6 text-primary" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center space-x-3">
                <div>{getActionIcon()}</div>
                <h2 className="text-xl font-bold text-foreground">{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <HiX className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {getActionMessage()}
              </p>

              <div className="space-y-3">
                <Link to="/login" onClick={onClose}>
                  <Button
                    fullWidth
                    size="lg"
                    className="flex items-center justify-center space-x-2"
                  >
                    <HiLockClosed className="w-5 h-5" />
                    <span>Login to Account</span>
                  </Button>
                </Link>

                <Link to="/signup" onClick={onClose}>
                  <Button
                    variant="outline"
                    fullWidth
                    size="lg"
                    className="flex items-center justify-center space-x-2"
                  >
                    <HiUserAdd className="w-5 h-5" />
                    <span>Create New Account</span>
                  </Button>
                </Link>
              </div>

              {/* Benefits */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold text-foreground mb-2">
                  Why create an account?
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Save your favorite jobs</li>
                  <li>• Track application status</li>
                  <li>• Get personalized job recommendations</li>
                  <li>• Create a professional profile</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
