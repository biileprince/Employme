import React, { useState, useEffect, useRef } from "react";
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
} from "react-icons/md";
import { useChat } from "../contexts/ChatContext";
import { useAuth } from "../contexts/AuthContext";
import { formatImageUrl, chatAPI } from "../services/api";
import type { Participant } from "../contexts/ChatContext";

const Messages: React.FC = () => {
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
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Log online users for debugging
  React.useEffect(() => {
    if (activeConversation) {
      const otherParticipant =
        activeConversation.participant1Id === user?.id
          ? activeConversation.participant2
          : activeConversation.participant1;
      console.log("[Messages] Active participant:", otherParticipant);
      console.log("[Messages] Online users:", onlineUsers);
      console.log(
        "[Messages] Is participant online?",
        onlineUsers.includes(otherParticipant.id)
      );
    }
  }, [activeConversation, onlineUsers, user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load eligible contacts
  const loadEligibleContacts = async () => {
    setLoadingContacts(true);
    try {
      const response = await chatAPI.getEligibleContacts();
      if (response.success && response.data) {
        setEligibleContacts(
          (response.data as { contacts: Participant[] }).contacts || []
        );
      }
    } catch (error) {
      console.error("Failed to load eligible contacts:", error);
    } finally {
      setLoadingContacts(false);
    }
  };

  // Handle starting a new conversation
  const handleStartNewConversation = async (contactId: string) => {
    try {
      await startConversation(contactId);
      setShowNewMessageModal(false);
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  // Get participant name
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

  // Get participant image
  const getParticipantImage = (participant: Participant) => {
    if (participant.role === "EMPLOYER") {
      return participant.employer?.logoUrl;
    }
    if (participant.jobSeeker) {
      return participant.jobSeeker.profileImageUrl;
    }
    return participant.imageUrl;
  };

  // Filter conversations by search query
  const filteredConversations = conversations.filter((conv) => {
    const otherParticipant =
      conv.participant1Id === user?.id ? conv.participant2 : conv.participant1;
    const name = getParticipantName(otherParticipant);
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Handle message input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    // Start typing indicator
    if (e.target.value && !typingTimeoutRef.current) {
      startTyping();
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
      typingTimeoutRef.current = null;
    }, 2000);
  };

  // Handle edit message
  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditContent(content);
  };

  // Save edited message
  const handleSaveEdit = async () => {
    if (!editingMessageId || !editContent.trim()) return;

    try {
      await editMessage(editingMessageId, editContent.trim());
      setEditingMessageId(null);
      setEditContent("");
    } catch (error) {
      console.error("Failed to edit message:", error);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteMessage(messageId);
      } catch (error) {
        console.error("Failed to delete message:", error);
      }
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    await sendMessage(messageInput.trim());
    setMessageInput("");

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    stopTyping();
  };

  // Format timestamp
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

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

  // Get other participant in active conversation
  const activeParticipant = activeConversation
    ? activeConversation.participant1Id === user?.id
      ? activeConversation.participant2
      : activeConversation.participant1
    : null;

  const isTyping = activeParticipant && typingUsers[activeParticipant.id];
  const isOnline =
    activeParticipant && onlineUsers.includes(activeParticipant.id);

  return (
    <div className="flex h-[calc(100vh-120px)] bg-card rounded-lg shadow-lg overflow-hidden border border-border">
      {/* Conversations List */}
      <div
        className={`w-full md:w-1/3 border-r border-border flex flex-col ${
          showMobileChat ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Header with New Message Button */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Messages</h2>
            <button
              onClick={() => {
                setShowNewMessageModal(true);
                loadEligibleContacts();
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <MdAdd className="w-5 h-5" />
              <span className="text-sm font-medium">New</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
            />
          </div>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 text-sm">
            Reconnecting...
          </div>
        )}

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p>No conversations yet</p>
              <p className="text-sm mt-2">
                Start messaging from a job listing or application
              </p>
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
                const isActive = activeConversation?.id === conv.id;
                const isUserOnline = onlineUsers.includes(otherParticipant.id);

                return (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`relative p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                      isActive ? "bg-primary/10 dark:bg-primary/20" : ""
                    }`}
                    onClick={() => {
                      selectConversation(conv.id);
                      setShowMobileChat(true);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
                          {image ? (
                            <img
                              src={formatImageUrl(image)}
                              alt={name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-muted-foreground">
                              {name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        {isUserOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-card rounded-full"></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {name}
                          </h3>
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
                        {conv.unreadCount! > 0 && (
                          <div className="mt-1 inline-flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                            {conv.unreadCount}
                          </div>
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

      {/* Messages Panel */}
      <div
        className={`flex-1 flex-col ${
          showMobileChat ? "flex" : "hidden md:flex"
        }`}
      >
        {activeConversation && activeParticipant ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              {/* Back button for mobile */}
              <button
                onClick={() => setShowMobileChat(false)}
                className="md:hidden mr-2 p-2 hover:bg-muted rounded-full transition-colors"
              >
                <MdArrowBack className="w-5 h-5 text-foreground" />
              </button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
                    {getParticipantImage(activeParticipant) ? (
                      <img
                        src={formatImageUrl(
                          getParticipantImage(activeParticipant)!
                        )}
                        alt={getParticipantName(activeParticipant)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-muted-foreground">
                        {getParticipantName(activeParticipant)
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                  </div>
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-card rounded-full"></div>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">
                    {getParticipantName(activeParticipant)}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {isOnline ? "Online" : "Offline"}
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
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <MdMoreVert className="w-5 h-5 text-muted-foreground" />
                </button>

                {showOptions === activeConversation.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute right-0 top-full mt-2 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to delete this conversation?"
                          )
                        ) {
                          deleteConversation(activeConversation.id);
                          setShowOptions(null);
                        }
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
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
              <AnimatePresence>
                {messages.map((message, index) => {
                  const isOwnMessage = message.senderId === user?.id;
                  const showAvatar =
                    index === 0 ||
                    messages[index - 1].senderId !== message.senderId;

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${
                        isOwnMessage ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex gap-2 max-w-[70%] ${
                          isOwnMessage ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        {showAvatar && !isOwnMessage && (
                          <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
                            {getParticipantImage(activeParticipant) ? (
                              <img
                                src={formatImageUrl(
                                  getParticipantImage(activeParticipant)!
                                )}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-muted-foreground">
                                {getParticipantName(activeParticipant)
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                            )}
                          </div>
                        )}
                        {!showAvatar && !isOwnMessage && (
                          <div className="w-8"></div>
                        )}

                        <div className="relative group">
                          {editingMessageId === message.id ? (
                            // Edit mode
                            <div className="flex flex-col gap-2 min-w-[200px]">
                              <input
                                type="text"
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveEdit();
                                  if (e.key === "Escape") handleCancelEdit();
                                }}
                                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={handleSaveEdit}
                                  className="flex items-center gap-1 px-3 py-1 bg-success text-success-foreground rounded text-xs hover:bg-success/90"
                                >
                                  <MdCheck className="w-4 h-4" />
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="flex items-center gap-1 px-3 py-1 bg-muted text-foreground rounded text-xs hover:bg-muted/80"
                                >
                                  <MdClose className="w-4 h-4" />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            // View mode
                            <>
                              <div
                                className={`rounded-lg px-4 py-2 ${
                                  isOwnMessage
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-card text-foreground border border-border"
                                } ${
                                  message.isDeleted ? "opacity-60 italic" : ""
                                }`}
                              >
                                <p className="break-words">
                                  {message.content}
                                  {message.isEdited && !message.isDeleted && (
                                    <span className="text-xs ml-2 opacity-70">
                                      (edited)
                                    </span>
                                  )}
                                </p>
                                <div
                                  className={`flex items-center gap-1 mt-1 text-xs ${
                                    isOwnMessage
                                      ? "text-primary-foreground/70"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  <span>{formatTime(message.createdAt)}</span>
                                  {isOwnMessage && (
                                    <>
                                      {message.isRead ? (
                                        <MdCheckCircle className="w-3 h-3" />
                                      ) : (
                                        <MdCircle className="w-3 h-3" />
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Edit/Delete menu - only for own messages */}
                              {isOwnMessage && !message.isDeleted && (
                                <div className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="flex gap-1 bg-card border border-border rounded-lg shadow-lg p-1">
                                    <button
                                      onClick={() =>
                                        handleEditMessage(
                                          message.id,
                                          message.content
                                        )
                                      }
                                      className="p-1.5 hover:bg-muted rounded transition-colors"
                                      title="Edit message"
                                    >
                                      <MdEdit className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteMessage(message.id)
                                      }
                                      className="p-1.5 hover:bg-destructive/10 rounded transition-colors"
                                      title="Delete message"
                                    >
                                      <MdDelete className="w-4 h-4 text-destructive" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-muted-foreground text-sm"
                >
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce delay-200"></div>
                  </div>
                  <span>
                    {getParticipantName(activeParticipant)} is typing...
                  </span>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-border bg-card"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={handleInputChange}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <MdSend className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg">
                Select a conversation to start messaging
              </p>
              <p className="text-sm mt-2">Your messages will appear here</p>
            </div>
          </div>
        )}
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col border border-border"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                New Message
              </h3>
              <button
                onClick={() => setShowNewMessageModal(false)}
                className="p-1 hover:bg-muted rounded-full transition-colors"
              >
                <MdClose className="w-6 h-6 text-muted-foreground" />
              </button>
            </div>

            {/* Contact List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingContacts ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : eligibleContacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MdPerson className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p>No contacts available</p>
                  <p className="text-sm mt-1">
                    {user?.role === "JOB_SEEKER"
                      ? "Apply to jobs to message employers"
                      : user?.role === "EMPLOYER"
                      ? "Applicants to your jobs will appear here"
                      : "No users found"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {eligibleContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleStartNewConversation(contact.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors text-left"
                    >
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-semibold">
                          {contact.profile?.companyName?.[0] ||
                            contact.profile?.fullName?.[0] ||
                            contact.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {contact.profile?.companyName ||
                            contact.profile?.fullName ||
                            contact.email}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {contact.role === "EMPLOYER"
                            ? "Employer"
                            : contact.role === "JOB_SEEKER"
                            ? "Job Seeker"
                            : "Admin"}
                        </p>
                      </div>
                      <MdSend className="w-5 h-5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Messages;
