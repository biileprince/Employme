import express from "express";
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markAsRead,
  deleteConversation,
  getUnreadCount,
  getEligibleContacts,
  editMessage,
  deleteMessage,
} from "../controllers/chatController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// All chat routes require authentication
router.use(authMiddleware);

// Get eligible contacts for messaging based on role
router.get("/eligible-contacts", getEligibleContacts);

// Get all conversations for the authenticated user
router.get("/conversations", getConversations);

// Get unread message count
router.get("/unread-count", getUnreadCount);

// Get or create conversation with a specific user
router.get("/conversations/:participantId", getOrCreateConversation);

// Get messages in a conversation (with pagination)
router.get("/conversations/:conversationId/messages", getMessages);

// Send a message in a conversation
router.post("/conversations/:conversationId/messages", sendMessage);

// Edit a message
router.patch("/conversations/:conversationId/messages/:messageId", editMessage);

// Delete a message
router.delete(
  "/conversations/:conversationId/messages/:messageId",
  deleteMessage
);

// Mark messages as read in a conversation
router.patch("/conversations/:conversationId/read", markAsRead);

// Delete a conversation
router.delete("/conversations/:conversationId", deleteConversation);

export default router;
