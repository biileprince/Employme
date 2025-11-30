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
import jwt from "jsonwebtoken";

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

// Import middleware
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { authMiddleware } from "./middleware/auth.js";
import passport from "./middleware/passport.js";

// Import email service
import { testEmailConnection } from "./services/emailService.js";

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO for real-time features
const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.CLIENT_URL || "http://localhost:5174",
      "http://localhost:5173",
      "http://localhost:3000", // Next.js client
    ],
    methods: ["GET", "POST"],
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
  })
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
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased from 100 to 500 for chat functionality
  message: "Too many requests from this IP, please try again later.",
  skip: (req) => req.path.startsWith("/api/chat"), // Skip rate limiting for chat routes
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
  })
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
  })
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
    process.env.CLIENT_URL || "http://localhost:5173"
  );
  res.header("Access-Control-Allow-Methods", "GET");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
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

// Socket.IO connection handling
const onlineUsers = new Map<string, string>(); // userId -> socketId

// Socket.IO authentication middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    console.log("[Socket Auth] Attempting authentication...", {
      hasAuth: !!socket.handshake.auth,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : null,
      authKeys: Object.keys(socket.handshake.auth),
    });

    if (!token) {
      console.error("[Socket Auth] No token provided");
      return next(new Error("Authentication error: No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string; // Changed from 'id' to 'userId' to match JWT payload
    };
    socket.data.userId = decoded.userId; // Changed from decoded.id to decoded.userId
    console.log(
      "[Socket Auth] Authentication successful, userId:",
      decoded.userId
    );
    next();
  } catch (err) {
    console.error("[Socket Auth] Token verification failed:", err);
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
  socket.on("join_conversation", (conversationId: string) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`User ${userId} joined conversation ${conversationId}`);
  });

  // Handle leaving a conversation room
  socket.on("leave_conversation", (conversationId: string) => {
    socket.leave(`conversation_${conversationId}`);
    console.log(`User ${userId} left conversation ${conversationId}`);
  });

  // Handle new message notification (message already saved via API)
  socket.on(
    "message_sent",
    (data: { conversationId: string; message: any; receiverId: string }) => {
      // Send to specific receiver only (not to sender)
      io.to(`user_${data.receiverId}`).emit("new_message", {
        conversationId: data.conversationId,
        message: data.message,
      });

      // Note: We don't emit to conversation room because:
      // 1. Sender already added message locally
      // 2. Receiver gets it via user room above
    }
  );

  // Handle typing indicator
  socket.on(
    "typing_start",
    (data: { conversationId: string; receiverId: string }) => {
      io.to(`user_${data.receiverId}`).emit("user_typing", {
        conversationId: data.conversationId,
        userId,
      });
    }
  );

  socket.on(
    "typing_stop",
    (data: { conversationId: string; receiverId: string }) => {
      io.to(`user_${data.receiverId}`).emit("user_stopped_typing", {
        conversationId: data.conversationId,
        userId,
      });
    }
  );

  // Handle message read receipts
  socket.on(
    "messages_read",
    (data: { conversationId: string; senderId: string }) => {
      io.to(`user_${data.senderId}`).emit("messages_marked_read", {
        conversationId: data.conversationId,
        readBy: userId,
      });
    }
  );

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
      `⚠️  Email service connection failed - check your configuration`
    );
  }
});

export { io }; // Export io instance for use in controllers
export default app;
