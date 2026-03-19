import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import type { ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { chatAPI } from "../services/api";

// Types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
  attachmentUrl?: string;
  attachmentType?: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
    role: string;
  };
}

export interface Participant {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  imageUrl: string | null;
  role: string;
  employer?: {
    companyName: string;
    logoUrl: string | null;
  };
  jobSeeker?: {
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
  };
  profile?: {
    companyName?: string;
    fullName?: string;
  };
}

export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  participant1: Participant;
  participant2: Participant;
  messages: Message[];
  unreadCount?: number;
}

interface ChatContextType {
  socket: Socket | null;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  unreadCount: number;
  onlineUsers: string[];
  typingUsers: Record<string, boolean>;
  isConnected: boolean;
  loadConversations: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  sendMessage: (content: string, attachmentUrl?: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  startConversation: (participantId: string) => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const SERVER_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5001";

export const ChatProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const userIdRef = useRef<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [isConnected, setIsConnected] = useState(false);

  // Keep userIdRef in sync with current user
  useEffect(() => {
    userIdRef.current = user?.id || null;
  }, [user]);

  // Initialize Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem("auth_token");

    console.log("[ChatContext] Initializing socket connection...", {
      hasUser: !!user,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : null,
    });

    if (!user || !token) {
      console.log(
        "[ChatContext] Missing user or token, skipping socket connection",
      );
      return;
    }

    const newSocket = io(SERVER_URL, {
      auth: { token },
      autoConnect: true,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    // Listen for online users
    newSocket.on("online_users", (data: { userIds: string[] }) => {
      console.log("[Socket] Online users received:", data.userIds);
      setOnlineUsers(data.userIds);
    });

    newSocket.on("user_online", (data: { userId: string }) => {
      console.log("[Socket] User came online:", data.userId);
      setOnlineUsers((prev) => {
        const updated = [...new Set([...prev, data.userId])];
        console.log("[Socket] Updated online users:", updated);
        return updated;
      });
    });

    newSocket.on("user_offline", (data: { userId: string }) => {
      console.log("[Socket] User went offline:", data.userId);
      setOnlineUsers((prev) => prev.filter((id) => id !== data.userId));
    });

    // Listen for new messages
    newSocket.on(
      "new_message",
      (data: { conversationId: string; message: Message }) => {
        console.log("[Socket] New message received:", data);
        const currentUserId = userIdRef.current;
        console.log(
          "[Socket] Message sender ID:",
          data.message.senderId,
          "Current user ID:",
          currentUserId,
        );

        // Skip if this is our own message (we already added it when sending)
        if (data.message.senderId === currentUserId) {
          console.log("[Socket] Skipping own message");
          return;
        }

        // Add message to the messages array only if it's for active conversation
        setActiveConversation((current) => {
          console.log(
            "[Socket] Active conversation ID:",
            current?.id,
            "Message conversation ID:",
            data.conversationId,
          );

          if (current?.id === data.conversationId) {
            setMessages((prev) => {
              // Check if message already exists to prevent duplicates
              const messageExists = prev.some(
                (msg) => msg.id === data.message.id,
              );
              if (messageExists) {
                console.log("[Socket] Message already exists, skipping");
                return prev;
              }
              console.log(
                "[Socket] Adding message to active conversation. Previous count:",
                prev.length,
              );
              return [...prev, data.message];
            });
            // Mark as read since we're viewing the conversation
            return current;
          }
          return current;
        });

        // Update conversation in the list with the new message
        let shouldIncrementGlobalUnread = false;
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id === data.conversationId) {
              const isActive = activeConversation?.id === data.conversationId;
              shouldIncrementGlobalUnread = !isActive;
              return {
                ...conv,
                messages: [data.message, ...(conv.messages || [])],
                lastMessageAt: data.message.createdAt,
              };
            }
            return conv;
          }),
        );

        // Only increment global unread when conversation already exists in sidebar.
        // Fresh conversations after deletion are counted by conversation_restored/new_conversation_started.
        if (shouldIncrementGlobalUnread) {
          setUnreadCount((prev) => prev + 1);
        }
      },
    );

    // Listen for typing indicators
    newSocket.on(
      "user_typing",
      (data: { conversationId: string; userId: string }) => {
        console.log("[Socket] User typing:", data);
        setTypingUsers((prev) => ({ ...prev, [data.userId]: true }));
      },
    );

    newSocket.on(
      "user_stopped_typing",
      (data: { conversationId: string; userId: string }) => {
        console.log("[Socket] User stopped typing:", data);
        setTypingUsers((prev) => {
          const updated = { ...prev };
          delete updated[data.userId];
          return updated;
        });
      },
    );

    // Listen for read receipts
    newSocket.on(
      "messages_marked_read",
      (data: { conversationId: string; readBy: string }) => {
        if (activeConversation?.id === data.conversationId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.senderId === user.id ? { ...msg, isRead: true } : msg,
            ),
          );
        }
      },
    );

    // Listen for message edits
    newSocket.on(
      "message_edited",
      (data: { conversationId: string; message: Message }) => {
        if (activeConversation?.id === data.conversationId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === data.message.id ? data.message : msg,
            ),
          );
        }
      },
    );

    // Listen for message deletes
    newSocket.on(
      "message_deleted",
      (data: { conversationId: string; message: Message }) => {
        if (activeConversation?.id === data.conversationId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === data.message.id ? data.message : msg,
            ),
          );
        }
      },
    );

    // Listen for new conversation started (when a message arrives after deletion)
    // This indicates a fresh conversation, not just restoration
    newSocket.on(
      "new_conversation_started",
      (data: { conversation: Conversation }) => {
        console.log("[Socket] New conversation started:", data.conversation);
        setConversations((prev) => {
          // Check if conversation already exists
          const exists = prev.some((c) => c.id === data.conversation.id);
          if (exists) {
            // Update the conversation with fresh data
            return prev.map((c) =>
              c.id === data.conversation.id
                ? {
                    ...data.conversation,
                    messages: [], // Fresh conversation has no message history
                  }
                : c,
            );
          } else {
            // Add the new conversation at the top
            return [
              {
                ...data.conversation,
                messages: [],
              },
              ...prev,
            ];
          }
        });
        // Update unread count
        setUnreadCount((prev) => prev + (data.conversation.unreadCount || 1));
      },
    );

    // Keep backward compatibility with conversation_restored event
    newSocket.on(
      "conversation_restored",
      (data: { conversation: Conversation }) => {
        console.log("[Socket] Conversation restored:", data.conversation);
        setConversations((prev) => {
          // Check if conversation already exists
          const exists = prev.some((c) => c.id === data.conversation.id);
          if (exists) {
            // Update the conversation
            return prev.map((c) =>
              c.id === data.conversation.id ? data.conversation : c,
            );
          } else {
            // Add the restored conversation at the top
            return [data.conversation, ...prev];
          }
        });
        // Update unread count
        setUnreadCount((prev) => prev + (data.conversation.unreadCount || 1));
      },
    );

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]); // Removed token from dependencies since it's now declared inside effect

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const response = await chatAPI.getConversations();
      if (response.success && response.data) {
        setConversations((response.data as any).conversations || []);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  }, []);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await chatAPI.getUnreadCount();
      if (response.success && response.data) {
        setUnreadCount((response.data as any).unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to load unread count:", error);
    }
  }, []);

  // Load conversations and unread count on mount
  useEffect(() => {
    if (user) {
      loadConversations();
      loadUnreadCount();
    }
  }, [user, loadConversations, loadUnreadCount]);

  // Select a conversation
  const selectConversation = useCallback(
    async (conversationId: string) => {
      try {
        const conversation = conversations.find((c) => c.id === conversationId);
        if (!conversation) return;

        setActiveConversation(conversation);

        // Join conversation room
        socket?.emit("join_conversation", conversationId);

        // Load messages
        const response = await chatAPI.getMessages(conversationId);
        if (response.success && response.data) {
          setMessages((response.data as any).messages || []);
        }

        // Mark as read
        await markAsRead(conversationId);
      } catch (error) {
        console.error("Failed to select conversation:", error);
      }
    },
    [conversations, socket],
  );

  // Send a message
  const sendMessage = useCallback(
    async (content: string, attachmentUrl?: string) => {
      if (!activeConversation || !socket || !user) return;

      try {
        console.log(
          "[ChatContext] Sending message to conversation:",
          activeConversation.id,
        );
        const response = await chatAPI.sendMessage(
          activeConversation.id,
          content,
          attachmentUrl,
        );

        if (response.success && response.data) {
          const newMessage = (response.data as any).message;
          console.log("[ChatContext] Message sent successfully:", newMessage);

          // Add message to the messages array immediately
          setMessages((prev) => {
            console.log(
              "[ChatContext] Adding sent message. Previous count:",
              prev.length,
            );
            return [...prev, newMessage];
          });

          // Update the conversation in the list with the new message
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id === activeConversation.id) {
                return {
                  ...conv,
                  messages: [newMessage, ...(conv.messages || [])],
                  lastMessageAt: newMessage.createdAt,
                };
              }
              return conv;
            }),
          );

          // Get receiver ID
          const receiverId =
            activeConversation.participant1Id === user.id
              ? activeConversation.participant2Id
              : activeConversation.participant1Id;

          // Emit socket event for real-time delivery
          socket.emit("message_sent", {
            conversationId: activeConversation.id,
            message: newMessage,
            receiverId,
          });
        }
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
    [activeConversation, socket, user],
  );

  // Edit a message
  const editMessage = useCallback(
    async (messageId: string, content: string) => {
      if (!activeConversation) return;

      try {
        const response = await chatAPI.editMessage(
          activeConversation.id,
          messageId,
          content,
        );

        if (response.success && response.data) {
          const updatedMessage = (response.data as { message: Message })
            .message;

          // Update message in local state
          setMessages((prev) =>
            prev.map((msg) => (msg.id === messageId ? updatedMessage : msg)),
          );

          // Emit socket event for real-time update
          if (socket && user) {
            const receiverId =
              activeConversation.participant1Id === user.id
                ? activeConversation.participant2Id
                : activeConversation.participant1Id;

            socket.emit("message_edited", {
              conversationId: activeConversation.id,
              message: updatedMessage,
              receiverId,
            });
          }
        }
      } catch (error) {
        console.error("Failed to edit message:", error);
        throw error;
      }
    },
    [activeConversation, socket, user],
  );

  // Delete a message
  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!activeConversation) return;

      try {
        const response = await chatAPI.deleteMessage(
          activeConversation.id,
          messageId,
        );

        if (response.success && response.data) {
          const deletedMessage = (response.data as { message: Message })
            .message;

          // Update message in local state
          setMessages((prev) =>
            prev.map((msg) => (msg.id === messageId ? deletedMessage : msg)),
          );

          // Emit socket event for real-time update
          if (socket && user) {
            const receiverId =
              activeConversation.participant1Id === user.id
                ? activeConversation.participant2Id
                : activeConversation.participant1Id;

            socket.emit("message_deleted", {
              conversationId: activeConversation.id,
              message: deletedMessage,
              receiverId,
            });
          }
        }
      } catch (error) {
        console.error("Failed to delete message:", error);
        throw error;
      }
    },
    [activeConversation, socket, user],
  );

  // Mark conversation as read
  const markAsRead = useCallback(
    async (conversationId: string) => {
      try {
        await chatAPI.markAsRead(conversationId);

        // Update unread count
        loadUnreadCount();

        // Update conversation unread count
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv,
          ),
        );

        // Emit socket event
        const conversation = conversations.find((c) => c.id === conversationId);
        if (conversation && socket && user) {
          const senderId =
            conversation.participant1Id === user.id
              ? conversation.participant2Id
              : conversation.participant1Id;

          socket.emit("messages_read", {
            conversationId,
            senderId,
          });
        }
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    },
    [conversations, socket, user, loadUnreadCount],
  );

  // Delete conversation
  const deleteConversation = useCallback(
    async (conversationId: string) => {
      try {
        await chatAPI.deleteConversation(conversationId);

        // Remove from local state
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));

        if (activeConversation?.id === conversationId) {
          setActiveConversation(null);
          setMessages([]);
        }

        // Leave conversation room
        socket?.emit("leave_conversation", conversationId);
      } catch (error) {
        console.error("Failed to delete conversation:", error);
      }
    },
    [activeConversation, socket],
  );

  // Start a new conversation
  const startConversation = useCallback(
    async (participantId: string) => {
      try {
        const response = await chatAPI.getOrCreateConversation(participantId);
        if (response.success && response.data) {
          const conversation = (response.data as any).conversation;

          // Add to conversations if new
          setConversations((prev) => {
            const exists = prev.find((c) => c.id === conversation.id);
            return exists ? prev : [conversation, ...prev];
          });

          // Select the conversation
          await selectConversation(conversation.id);
        }
      } catch (error) {
        console.error("Failed to start conversation:", error);
      }
    },
    [selectConversation],
  );

  // Typing indicators
  const startTyping = useCallback(() => {
    if (!activeConversation || !socket || !user) return;

    const receiverId =
      activeConversation.participant1Id === user.id
        ? activeConversation.participant2Id
        : activeConversation.participant1Id;

    socket.emit("typing_start", {
      conversationId: activeConversation.id,
      receiverId,
    });
  }, [activeConversation, socket, user]);

  const stopTyping = useCallback(() => {
    if (!activeConversation || !socket || !user) return;

    const receiverId =
      activeConversation.participant1Id === user.id
        ? activeConversation.participant2Id
        : activeConversation.participant1Id;

    socket.emit("typing_stop", {
      conversationId: activeConversation.id,
      receiverId,
    });
  }, [activeConversation, socket, user]);

  const value: ChatContextType = {
    socket,
    conversations,
    activeConversation,
    messages,
    unreadCount,
    onlineUsers,
    typingUsers,
    isConnected,
    loadConversations,
    selectConversation,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    deleteConversation,
    startConversation,
    startTyping,
    stopTyping,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
