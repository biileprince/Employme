"use client";

import { useChat } from "@/contexts/ChatContext";

interface MessageCountBadgeProps {
  className?: string;
}

export function MessageCountBadge({ className = "" }: MessageCountBadgeProps) {
  const { unreadCount } = useChat();

  if (unreadCount === 0) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold text-white bg-red-500 rounded-full ${className}`}
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
}
