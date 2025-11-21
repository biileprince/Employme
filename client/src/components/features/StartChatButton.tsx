import React from "react";
import { useNavigate } from "react-router-dom";
import { MdMessage } from "react-icons/md";
import { useAuth } from "../../contexts/AuthContext";
import { useChat } from "../../contexts/ChatContext";
import { Button } from "../ui/Button";

interface StartChatButtonProps {
  recipientId: string;
  recipientName: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const StartChatButton: React.FC<StartChatButtonProps> = ({
  recipientId,
  recipientName,
  variant = "outline",
  size = "sm",
  fullWidth = false,
}) => {
  const { user } = useAuth();
  const { startConversation } = useChat();
  const navigate = useNavigate();

  const handleStartChat = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      await startConversation(recipientId);

      // Navigate to messages page based on user role
      if (user.role === "JOB_SEEKER") {
        navigate("/job-seeker/messages");
      } else if (user.role === "EMPLOYER") {
        navigate("/employer/messages");
      }
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      onClick={handleStartChat}
      className="flex items-center gap-2"
    >
      <MdMessage className="w-4 h-4" />
      <span>Message {recipientName}</span>
    </Button>
  );
};

export default StartChatButton;
