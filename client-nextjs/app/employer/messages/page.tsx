"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdSend,
  MdSearch,
  MdDelete,
  MdMoreVert,
  MdClose,
  MdCheckCircle,
  MdCircle,
  MdAdd,
  MdPerson,
  MdEdit,
  MdCheck,
  MdArrowBack,
  MdFiberManualRecord,
} from "react-icons/md";
import { chatAPI, formatImageUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import type { Participant } from "@/contexts/ChatContext";

export default function EmployerMessagesPage() {
  useRouteGuard();
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    messages,
    onlineUsers,
    typingUsers,
    isConnected,
    selectConversation,
    sendMessage,
    editMessage,
    deleteMessage,
    deleteConversation,
    startConversation,
    startTyping,
    stopTyping,
  } = useChat();

  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showOptions, setShowOptions] = useState<string | null>(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [eligibleContacts, setEligibleContacts] = useState<Participant[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize edit textarea
  useEffect(() => {
    const textarea = editTextareaRef.current;
    if (textarea && editingMessageId) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [editContent, editingMessageId]);

  const loadEligibleContacts = async () => {
    setLoadingContacts(true);
    try {
      const response = await chatAPI.getEligibleContacts();
      if (response.success && response.data) {
        setEligibleContacts((response.data as any).contacts || []);
      }
    } catch (error) {
      console.error("Failed to load contacts:", error);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleStartNewConversation = async (contactId: string) => {
    try {
      await startConversation(contactId);
      setShowNewMessageModal(false);
      setShowMobileChat(true);
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    await selectConversation(conversationId);
    setShowMobileChat(true);
  };

  const getParticipantName = (participant: Participant) => {
    if (participant.role === "EMPLOYER") {
      return participant.employer?.companyName || "Company";
    }
    if (participant.jobSeeker) {
      return `${participant.jobSeeker.firstName} ${participant.jobSeeker.lastName}`;
    }
    return (
      `${participant.firstName || ""} ${participant.lastName || ""}`.trim() ||
      "User"
    );
  };

  const getParticipantImage = (participant: Participant) => {
    if (participant.role === "EMPLOYER") {
      return participant.employer?.logoUrl;
    }
    if (participant.jobSeeker) {
      return participant.jobSeeker.profileImageUrl;
    }
    return participant.imageUrl;
  };

  const filteredConversations = conversations.filter((conv) => {
    const otherParticipant =
      conv.participant1Id === user?.id
        ? conv.participant2
        : conv.participant1;
    const name = getParticipantName(otherParticipant);
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    try {
      await sendMessage(messageInput.trim());
      setMessageInput("");
      stopTyping();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    // Start typing indicator
    startTyping();

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (window.confirm("Are you sure you want to delete this conversation?")) {
      try {
        await deleteConversation(conversationId);
        setShowMobileChat(false);
      } catch (error) {
        console.error("Failed to delete conversation:", error);
      }
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) return;

    try {
      await editMessage(messageId, editContent.trim());
      setEditingMessageId(null);
      setEditContent("");
    } catch (error) {
      console.error("Failed to edit message:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteMessage(messageId);
      } catch (error) {
        console.error("Failed to delete message:", error);
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else if (diffInHours < 168) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const activeParticipant = activeConversation
    ? activeConversation.participant1Id === user?.id
      ? activeConversation.participant2
      : activeConversation.participant1
    : null;

  const isParticipantOnline = activeParticipant
    ? onlineUsers.includes(activeParticipant.id)
    : false;

  const isParticipantTyping = activeParticipant
    ? typingUsers[activeParticipant.id]
    : false;

  return (
    <div className="px-4 sm:px-6">
      {/* Connection status indicator */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        <MdFiberManualRecord
          className={`w-3 h-3 ${isConnected ? "text-green-500" : "text-red-500"}`}
        />
        <span className="text-muted-foreground">
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>

      <div className="flex h-[calc(100vh-200px)] bg-card rounded-xl shadow-sm overflow-hidden border border-border">
        {/* Conversations Sidebar */}
        <div
          className={`w-full md:w-80 border-r border-border flex flex-col ${
            showMobileChat ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Messages</h2>
              <button
                onClick={() => {
                  setShowNewMessageModal(true);
                  loadEligibleContacts();
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                <MdAdd className="w-5 h-5" />
                <span className="text-sm font-medium">New</span>
              </button>
            </div>
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4 text-muted-foreground">
                <p>No conversations yet</p>
                <p className="text-sm mt-2">Click "New" to start</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredConversations.map((conv) => {
                  const otherParticipant =
                    conv.participant1Id === user?.id
                      ? conv.participant2
                      : conv.participant1;
                  const name = getParticipantName(otherParticipant);
                  const image = getParticipantImage(otherParticipant);
                  const lastMessage = conv.messages?.[0];
                  const isOnline = onlineUsers.includes(otherParticipant.id);

                  return (
                    <motion.div
                      key={conv.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 ${
                        activeConversation?.id === conv.id
                          ? "bg-primary/10"
                          : ""
                      }`}
                      onClick={() => handleSelectConversation(conv.id)}
                    >
                      <div className="flex gap-3">
                        <div className="relative w-12 h-12 rounded-full bg-muted overflow-hidden flex-shrink-0">
                          {image ? (
                            <img
                              src={formatImageUrl(image)}
                              alt={name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg font-semibold">
                              {name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {/* Online indicator */}
                          {isOnline && (
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-card rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between mb-1">
                            <h3 className="font-semibold truncate">{name}</h3>
                            {lastMessage && (
                              <span className="text-xs text-muted-foreground">
                                {formatTime(lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          {lastMessage && (
                            <p className="text-sm text-muted-foreground truncate">
                              {lastMessage.senderId === user?.id && "You: "}
                              {lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div
          className={`flex-1 flex-col ${
            showMobileChat ? "flex" : "hidden md:flex"
          }`}
        >
          {activeConversation && activeParticipant ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <button
                  onClick={() => setShowMobileChat(false)}
                  className="md:hidden mr-2 p-2 hover:bg-muted rounded-full"
                >
                  <MdArrowBack className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative w-10 h-10 rounded-full bg-muted overflow-hidden">
                    {getParticipantImage(activeParticipant) ? (
                      <img
                        src={formatImageUrl(
                          getParticipantImage(activeParticipant)!
                        )}
                        alt={getParticipantName(activeParticipant)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-semibold">
                        {getParticipantName(activeParticipant)
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    {/* Online indicator */}
                    {isParticipantOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-semibold truncate">
                      {getParticipantName(activeParticipant)}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {isParticipantOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() =>
                      setShowOptions(
                        showOptions === activeConversation.id
                          ? null
                          : activeConversation.id
                      )
                    }
                    className="p-2 hover:bg-muted rounded-full"
                  >
                    <MdMoreVert className="w-5 h-5 text-muted-foreground" />
                  </button>
                  {showOptions === activeConversation.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute right-0 top-full mt-2 bg-card border rounded-lg shadow-lg z-10"
                    >
                      <button
                        onClick={() => {
                          handleDeleteConversation(activeConversation.id);
                          setShowOptions(null);
                        }}
                        className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 whitespace-nowrap rounded-lg"
                      >
                        <MdDelete className="w-4 h-4" />
                        Delete Conversation
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
                {messages.map((msg) => {
                  const isOwn = msg.senderId === user?.id;
                  const isEditing = editingMessageId === msg.id;

                  if (msg.isDeleted) {
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div className="max-w-[70%] rounded-lg px-4 py-2 bg-muted/50 border border-dashed italic text-muted-foreground text-sm">
                          This message was deleted
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border"
                        }`}
                      >
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              ref={editTextareaRef}
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full min-h-[60px] px-2 py-1 bg-background/50 border border-border rounded resize-none focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditMessage(msg.id)}
                                className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-1"
                              >
                                <MdCheck className="w-4 h-4" />
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingMessageId(null);
                                  setEditContent("");
                                }}
                                className="px-3 py-1 bg-muted text-foreground rounded-lg text-sm hover:bg-muted/80"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="break-words whitespace-pre-wrap">
                              {msg.content}
                            </p>
                            <div
                              className={`flex items-center gap-1 mt-1 text-xs ${
                                isOwn
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              }`}
                            >
                              <span>{formatTime(msg.createdAt)}</span>
                              {msg.isEdited && <span>(edited)</span>}
                              {isOwn &&
                                (msg.isRead ? (
                                  <MdCheckCircle className="w-3 h-3" />
                                ) : (
                                  <MdCircle className="w-3 h-3" />
                                ))}
                            </div>
                          </>
                        )}

                        {/* Edit/Delete buttons (only for own messages) */}
                        {isOwn && !isEditing && (
                          <div className="hidden group-hover:flex gap-2 mt-2">
                            <button
                              onClick={() => {
                                setEditingMessageId(msg.id);
                                setEditContent(msg.content);
                              }}
                              className="p-1 hover:bg-primary-foreground/20 rounded"
                            >
                              <MdEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="p-1 hover:bg-primary-foreground/20 rounded"
                            >
                              <MdDelete className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {isParticipantTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="max-w-[70%] rounded-lg px-4 py-2 bg-card border">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <span
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <span
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t bg-card">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={handleInputChange}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className="p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    <MdSend className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg">Select a conversation</p>
                <p className="text-sm mt-2">Your messages will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col border"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">New Message</h3>
              <button
                onClick={() => setShowNewMessageModal(false)}
                className="p-1 hover:bg-muted rounded-full"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loadingContacts ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : eligibleContacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MdPerson className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No contacts available</p>
                  <p className="text-sm mt-1">Applicants will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {eligibleContacts.map((contact) => {
                    const isOnline = onlineUsers.includes(contact.id);
                    return (
                      <button
                        key={contact.id}
                        onClick={() => handleStartNewConversation(contact.id)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg"
                      >
                        <div className="relative w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold">
                            {contact.profile?.fullName?.[0] ||
                              contact.email[0].toUpperCase()}
                          </span>
                          {isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-medium truncate">
                            {contact.profile?.fullName || contact.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {isOnline ? "Online" : "Offline"}
                          </p>
                        </div>
                        <MdSend className="w-5 h-5 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
