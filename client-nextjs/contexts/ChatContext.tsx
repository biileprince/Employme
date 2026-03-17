"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { authAPI, chatAPI } from "@/lib/api";

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
  clearActiveConversation: () => void;
  sendMessage: (content: string, attachmentUrl?: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  startConversation: (participantId: string) => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
}

interface ConversationsResponse {
  conversations: Conversation[];
}

interface UnreadCountResponse {
  unreadCount: number;
}

interface MessagesResponse {
  messages: Message[];
}

interface MessageResponse {
  message: Message;
}

interface ConversationResponse {
  conversation: Conversation;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const SERVER_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
  "http://localhost:5001";

export const ChatProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const userIdRef = useRef<string | null>(null);
  const activeConversationRef = useRef<Conversation | null>(null);
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

  // Keep activeConversationRef in sync with activeConversation
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!user) {
      setIsConnected(false);
      return;
    }

    let mounted = true;
    let newSocket: Socket | null = null;
    let isRefreshingToken = false;
    let authRetryCount = 0;
    const maxAuthRetries = 2;

    const fetchSocketToken = async (): Promise<string | null> => {
      try {
        const response = await authAPI.getSocketToken();
        const socketToken = response.data?.token;

        if (!response.success || !socketToken) {
          return null;
        }

        return socketToken;
      } catch (error) {
        console.error("Failed to fetch socket token", error);
        return null;
      }
    };

    const initializeSocket = async () => {
      try {
        const socketToken = await fetchSocketToken();

        if (!mounted || !socketToken) {
          setIsConnected(false);
          return;
        }

        newSocket = io(SERVER_URL, {
          auth: { token: socketToken },
          autoConnect: false,
          withCredentials: true,
        });

        newSocket.on("connect", () => {
          console.log("Socket connected:", newSocket?.id);
          authRetryCount = 0;
          setIsConnected(true);
        });

        newSocket.on("disconnect", () => {
          console.log("Socket disconnected");
          setIsConnected(false);
        });

        newSocket.on("connect_error", async (error) => {
          console.error("Socket connection error:", error);
          setIsConnected(false);

          const message = error?.message?.toLowerCase() || "";
          const isAuthError =
            message.includes("invalid token") ||
            message.includes("authentication error") ||
            message.includes("no token provided");

          if (!isAuthError || isRefreshingToken || !newSocket || !mounted) {
            return;
          }

          if (authRetryCount >= maxAuthRetries) {
            console.error(
              "Socket auth retry limit reached; stopping reconnect attempts.",
            );
            newSocket.disconnect();
            return;
          }

          isRefreshingToken = true;
          try {
            const refreshedToken = await fetchSocketToken();
            if (!mounted || !newSocket || !refreshedToken) {
              return;
            }

            authRetryCount += 1;
            newSocket.auth = { token: refreshedToken };
            newSocket.connect();
          } finally {
            isRefreshingToken = false;
          }
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
              // Not viewing this conversation, increment unread
              console.log("[Socket] Incrementing unread count");
              return current;
            });

            // Update conversation in the list with the new message and unread count
            setConversations((prev) => {
              const target = prev.find(
                (conv) => conv.id === data.conversationId,
              );
              if (!target) return prev;

              const isActive =
                activeConversationRef.current?.id === data.conversationId;
              const updatedConversation: Conversation = {
                ...target,
                messages: [
                  data.message,
                  ...(target.messages || []).filter(
                    (msg) => msg.id !== data.message.id,
                  ),
                ],
                lastMessageAt: data.message.createdAt,
                unreadCount: isActive ? 0 : (target.unreadCount || 0) + 1,
              };

              return [
                updatedConversation,
                ...prev.filter((conv) => conv.id !== data.conversationId),
              ];
            });

            // Update global unread count if not viewing this conversation
            if (activeConversationRef.current?.id !== data.conversationId) {
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
            if (activeConversationRef.current?.id === data.conversationId) {
              const currentUserId = userIdRef.current;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.senderId === currentUserId
                    ? { ...msg, isRead: true }
                    : msg,
                ),
              );
            }
          },
        );

        // Listen for message edits
        newSocket.on(
          "message_edited",
          (data: { conversationId: string; message: Message }) => {
            console.log("[Socket] Message edited:", data);

            // Update messages if viewing this conversation
            setActiveConversation((current) => {
              if (current?.id === data.conversationId) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === data.message.id ? data.message : msg,
                  ),
                );
              }
              return current;
            });

            // Update conversation in the list with the edited message
            setConversations((prev) =>
              prev.map((conv) => {
                if (conv.id === data.conversationId) {
                  return {
                    ...conv,
                    messages: conv.messages?.map((msg) =>
                      msg.id === data.message.id ? data.message : msg,
                    ) || [data.message],
                  };
                }
                return conv;
              }),
            );
          },
        );

        // Listen for message deletes
        newSocket.on(
          "message_deleted",
          (data: { conversationId: string; message: Message }) => {
            console.log("[Socket] Message deleted:", data);

            // Update messages if viewing this conversation
            setActiveConversation((current) => {
              if (current?.id === data.conversationId) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === data.message.id ? data.message : msg,
                  ),
                );
              }
              return current;
            });

            // Update conversation in the list with the deleted message
            setConversations((prev) =>
              prev.map((conv) => {
                if (conv.id === data.conversationId) {
                  return {
                    ...conv,
                    messages: conv.messages?.map((msg) =>
                      msg.id === data.message.id ? data.message : msg,
                    ) || [data.message],
                  };
                }
                return conv;
              }),
            );
          },
        );

        setSocket(newSocket);
        newSocket.connect();
      } catch (error) {
        console.error("Failed to initialize socket session", error);
        setIsConnected(false);
      }
    };

    initializeSocket();

    return () => {
      mounted = false;
      newSocket?.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user, isAuthLoading]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const response = await chatAPI.getConversations();
      if (response.success && response.data) {
        const { conversations = [] } = response.data as ConversationsResponse;
        setConversations(conversations);
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
        const { unreadCount = 0 } = response.data as UnreadCountResponse;
        setUnreadCount(unreadCount);
      }
    } catch (error) {
      console.error("Failed to load unread count:", error);
    }
  }, []);

  // Load conversations and unread count on mount
  useEffect(() => {
    if (user) {
      // Defer initial state updates to avoid sync setState in effect body.
      const timer = setTimeout(() => {
        void loadConversations();
        void loadUnreadCount();
      }, 0);

      return () => clearTimeout(timer);
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
          const { messages = [] } = response.data as MessagesResponse;
          setMessages(messages);
        }

        // Mark as read
        await chatAPI.markAsRead(conversationId);
        loadUnreadCount();
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv,
          ),
        );

        if (socket && user) {
          socket.emit("messages_read", {
            conversationId,
          });
        }
      } catch (error) {
        console.error("Failed to select conversation:", error);
      }
    },
    [conversations, socket, user, loadUnreadCount],
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
          const { message: newMessage } = response.data as MessageResponse;
          console.log("[ChatContext] Message sent successfully:", newMessage);

          // Add message to the messages array immediately
          setMessages((prev) => {
            console.log(
              "[ChatContext] Adding sent message. Previous count:",
              prev.length,
            );
            return [...prev, newMessage];
          });

          // Update conversation preview and move the latest conversation to the top
          setConversations((prev) => {
            const target = prev.find(
              (conv) => conv.id === activeConversation.id,
            );
            if (!target) return prev;

            const updatedConversation: Conversation = {
              ...target,
              messages: [
                newMessage,
                ...(target.messages || []).filter(
                  (msg) => msg.id !== newMessage.id,
                ),
              ],
              lastMessageAt: newMessage.createdAt,
            };

            return [
              updatedConversation,
              ...prev.filter((conv) => conv.id !== activeConversation.id),
            ];
          });

          // Emit socket event for real-time delivery
          socket.emit("message_sent", {
            conversationId: activeConversation.id,
            message: newMessage,
          });
        }
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
    [activeConversation, socket, user],
  );

  // Clear currently selected conversation
  const clearActiveConversation = useCallback(() => {
    const conversationId = activeConversationRef.current?.id;
    if (conversationId) {
      socket?.emit("leave_conversation", conversationId);
    }

    setActiveConversation(null);
    setMessages([]);
  }, [socket]);

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

          // Update conversation list with edited message
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id === activeConversation.id) {
                return {
                  ...conv,
                  messages: conv.messages?.map((msg) =>
                    msg.id === messageId ? updatedMessage : msg,
                  ) || [updatedMessage],
                };
              }
              return conv;
            }),
          );

          // Emit socket event for real-time update
          if (socket && user) {
            socket.emit("message_edited", {
              conversationId: activeConversation.id,
              message: updatedMessage,
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

          // Update conversation list with deleted message
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id === activeConversation.id) {
                return {
                  ...conv,
                  messages: conv.messages?.map((msg) =>
                    msg.id === messageId ? deletedMessage : msg,
                  ) || [deletedMessage],
                };
              }
              return conv;
            }),
          );

          // Emit socket event for real-time update
          if (socket && user) {
            socket.emit("message_deleted", {
              conversationId: activeConversation.id,
              message: deletedMessage,
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
        if (socket && user) {
          socket.emit("messages_read", {
            conversationId,
          });
        }
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    },
    [socket, user, loadUnreadCount],
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
          const { conversation } = response.data as ConversationResponse;

          // Add to conversations and keep newest at the top
          setConversations((prev) => {
            const exists = prev.find((c) => c.id === conversation.id);
            if (!exists) return [conversation, ...prev];
            return [
              conversation,
              ...prev.filter((c) => c.id !== conversation.id),
            ];
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

    socket.emit("typing_start", {
      conversationId: activeConversation.id,
    });
  }, [activeConversation, socket, user]);

  const stopTyping = useCallback(() => {
    if (!activeConversation || !socket || !user) return;

    socket.emit("typing_stop", {
      conversationId: activeConversation.id,
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
    clearActiveConversation,
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
