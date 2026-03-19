import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import savedJobsRoutes from "./routes/savedJobsRoutes.js";
import attachmentRoutes from "./routes/attachmentRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import jobAlertRoutes from "./routes/jobAlertRoutes.js";

// Import middleware
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { authMiddleware, verifySocketToken } from "./middleware/auth.js";
import passport from "./middleware/passport.js";

// Import email service
import { testEmailConnection } from "./services/emailService.js";

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const prisma = new PrismaClient();

// Initialize Socket.IO for real-time features
const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.CLIENT_URL || "http://localhost:5174",
      "http://localhost:5173",
      "http://localhost:3000", // Next.js client
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:", "http://localhost:5173"],
      },
    },
  }),
);
app.use(morgan("dev"));

// CORS configuration
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5173",
      "http://localhost:3000", // Next.js client
    ],
    credentials: true,
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased from 100 to 500 for chat functionality
  message: "Too many requests from this IP, please try again later.",
  skip: (req) => req.path === "/api/auth/socket-token", // Socket token can be requested during reconnects
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from uploads directory
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"), {
    setHeaders: (res, path) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET");
      res.header("Cross-Origin-Resource-Policy", "cross-origin");
    },
  }),
);

app.use(cookieParser());

// Session middleware (required for Passport)
app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "your-session-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Image serving endpoint with proper CORS
app.get("/uploads/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(process.cwd(), "uploads", filename);

  // Set CORS headers
  res.header(
    "Access-Control-Allow-Origin",
    process.env.CLIENT_URL || "http://localhost:5173",
  );
  res.header("Access-Control-Allow-Methods", "GET");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );

  // Check if file exists and serve it
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

// Authentication routes (public)
app.use("/api/auth", authRoutes);

// Newsletter routes (public subscription, protected admin)
app.use("/api/newsletter", newsletterRoutes);

// Some job routes should be public for browsing
app.use("/api/jobs", jobRoutes);

// Protected API routes (require authentication)
app.use("/api/users", authMiddleware, userRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/saved-jobs", authMiddleware, savedJobsRoutes);
app.use("/api/attachments", authMiddleware, attachmentRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/admin", authMiddleware, adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/job-alerts", authMiddleware, jobAlertRoutes);

// Socket.IO connection handling
const onlineUsers = new Map<string, string>(); // userId -> socketId

// Socket.IO authentication middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const decoded = verifySocketToken(token);

    socket.data.userId = decoded.userId; // Changed from decoded.id to decoded.userId
    next();
  } catch (err) {
    console.error("[Socket Auth] Token verification failed");
    next(new Error("Authentication error: Invalid token"));
  }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  const userId = socket.data.userId;
  console.log("User connected:", socket.id, "User ID:", userId);

  // Add user to online users and join their personal room
  onlineUsers.set(userId, socket.id);
  socket.join(`user_${userId}`);

  // Broadcast user's online status to ALL connected clients
  io.emit("user_online", { userId });

  // Send list of online users to the newly connected user
  socket.emit("online_users", { userIds: Array.from(onlineUsers.keys()) });

  // Handle joining a conversation room
  socket.on("join_conversation", async (conversationId: string) => {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { participant1Id: true, participant2Id: true },
      });

      if (!conversation) return;
      if (
        conversation.participant1Id !== userId &&
        conversation.participant2Id !== userId
      ) {
        return;
      }

      socket.join(`conversation_${conversationId}`);
      console.log(`User ${userId} joined conversation ${conversationId}`);
    } catch (error) {
      console.error("Failed to join conversation room");
    }
  });

  // Handle leaving a conversation room
  socket.on("leave_conversation", (conversationId: string) => {
    socket.leave(`conversation_${conversationId}`);
    console.log(`User ${userId} left conversation ${conversationId}`);
  });

  // Handle new message notification (message already saved via API)
  socket.on(
    "message_sent",
    async (data: { conversationId: string; message: any }) => {
      try {
        const conversation = await prisma.conversation.findUnique({
          where: { id: data.conversationId },
          include: {
            participant1: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                imageUrl: true,
                role: true,
                employer: {
                  select: {
                    companyName: true,
                    logoUrl: true,
                  },
                },
                jobSeeker: {
                  select: {
                    firstName: true,
                    lastName: true,
                    profileImageUrl: true,
                  },
                },
              },
            },
            participant2: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                imageUrl: true,
                role: true,
                employer: {
                  select: {
                    companyName: true,
                    logoUrl: true,
                  },
                },
                jobSeeker: {
                  select: {
                    firstName: true,
                    lastName: true,
                    profileImageUrl: true,
                  },
                },
              },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                id: true,
                content: true,
                createdAt: true,
                isRead: true,
                senderId: true,
                isDeleted: true,
              },
            },
          },
        });

        if (!conversation) return;
        if (
          conversation.participant1Id !== userId &&
          conversation.participant2Id !== userId
        ) {
          return;
        }

        const message = await prisma.message.findUnique({
          where: { id: data.message?.id },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
                role: true,
              },
            },
          },
        });

        if (!message) return;
        if (message.conversationId !== data.conversationId) return;
        if (message.senderId !== userId) return;

        const receiverId =
          conversation.participant1Id === userId
            ? conversation.participant2Id
            : conversation.participant1Id;

        const isReceiverParticipant1 =
          conversation.participant1Id === receiverId;
        const wasDeletedByReceiver = isReceiverParticipant1
          ? conversation.deletedByParticipant1
          : conversation.deletedByParticipant2;

        let updatedConversation = conversation;

        // If receiver deleted the conversation, start a fresh conversation
        // by deleting all old messages for this conversation
        if (wasDeletedByReceiver) {
          // Delete all messages from this conversation to make it fresh
          await prisma.message.deleteMany({
            where: { conversationId: data.conversationId },
          });

          // Undelete the conversation
          updatedConversation = await prisma.conversation.update({
            where: { id: data.conversationId },
            data: {
              deletedByParticipant1: false,
              deletedByParticipant2: false,
              createdAt: new Date(), // Reset creation time for fresh start
            },
            include: {
              participant1: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  imageUrl: true,
                  role: true,
                  employer: {
                    select: {
                      companyName: true,
                      logoUrl: true,
                    },
                  },
                  jobSeeker: {
                    select: {
                      firstName: true,
                      lastName: true,
                      profileImageUrl: true,
                    },
                  },
                },
              },
              participant2: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  imageUrl: true,
                  role: true,
                  employer: {
                    select: {
                      companyName: true,
                      logoUrl: true,
                    },
                  },
                  jobSeeker: {
                    select: {
                      firstName: true,
                      lastName: true,
                      profileImageUrl: true,
                    },
                  },
                },
              },
              messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                  id: true,
                  content: true,
                  createdAt: true,
                  isRead: true,
                  senderId: true,
                  isDeleted: true,
                },
              },
            },
          });
        }

        // Send new message notification
        io.to(`user_${receiverId}`).emit("new_message", {
          conversationId: data.conversationId,
          message,
        });

        // If receiver deleted the conversation, emit new conversation event
        // to indicate this is a fresh start, not just a restoration
        if (wasDeletedByReceiver) {
          io.to(`user_${receiverId}`).emit("new_conversation_started", {
            conversation: {
              ...updatedConversation,
              unreadCount: 1, // At least one unread message
            },
          });
        }
      } catch (error) {
        console.error("Failed to handle message_sent event");
      }
    },
  );

  // Handle typing indicator
  socket.on("typing_start", async (data: { conversationId: string }) => {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: data.conversationId },
        select: { participant1Id: true, participant2Id: true },
      });

      if (!conversation) return;
      if (
        conversation.participant1Id !== userId &&
        conversation.participant2Id !== userId
      ) {
        return;
      }

      const receiverId =
        conversation.participant1Id === userId
          ? conversation.participant2Id
          : conversation.participant1Id;

      io.to(`user_${receiverId}`).emit("user_typing", {
        conversationId: data.conversationId,
        userId,
      });
    } catch (error) {
      console.error("Failed to handle typing_start event");
    }
  });

  socket.on("typing_stop", async (data: { conversationId: string }) => {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: data.conversationId },
        select: { participant1Id: true, participant2Id: true },
      });

      if (!conversation) return;
      if (
        conversation.participant1Id !== userId &&
        conversation.participant2Id !== userId
      ) {
        return;
      }

      const receiverId =
        conversation.participant1Id === userId
          ? conversation.participant2Id
          : conversation.participant1Id;

      io.to(`user_${receiverId}`).emit("user_stopped_typing", {
        conversationId: data.conversationId,
        userId,
      });
    } catch (error) {
      console.error("Failed to handle typing_stop event");
    }
  });

  // Handle message read receipts
  socket.on("messages_read", async (data: { conversationId: string }) => {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: data.conversationId },
        select: { participant1Id: true, participant2Id: true },
      });

      if (!conversation) return;
      if (
        conversation.participant1Id !== userId &&
        conversation.participant2Id !== userId
      ) {
        return;
      }

      const senderId =
        conversation.participant1Id === userId
          ? conversation.participant2Id
          : conversation.participant1Id;

      io.to(`user_${senderId}`).emit("messages_marked_read", {
        conversationId: data.conversationId,
        readBy: userId,
      });
    } catch (error) {
      console.error("Failed to handle messages_read event");
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id, "User ID:", userId);
    onlineUsers.delete(userId);

    // Broadcast user's offline status to ALL connected clients
    io.emit("user_offline", { userId });
  });
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

httpServer.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);

  // Test email connection on startup
  console.log(`📧 Testing email connection...`);
  const emailWorking = await testEmailConnection();
  if (emailWorking) {
    console.log(`✅ Email service is ready`);
  } else {
    console.log(
      `⚠️  Email service connection failed - check your configuration`,
    );
  }
});

export { io }; // Export io instance for use in controllers
export default app;
