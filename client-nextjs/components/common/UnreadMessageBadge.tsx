"use client";

import { useChat } from "@/contexts/ChatContext";

interface UnreadMessageBadgeProps {
  className?: string;
}

export function UnreadMessageBadge({
  className = "",
}: UnreadMessageBadgeProps) {
  const { unreadCount } = useChat();

  if (unreadCount === 0) {
    return null;
  }

  return (
    <span
      className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ${className}`}
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
}
