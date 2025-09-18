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

// Import routes
import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import savedJobsRoutes from "./routes/savedJobsRoutes.js";
import attachmentRoutes from "./routes/attachmentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// Import middleware
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { authMiddleware } from "./middleware/auth.js";
import passport from "./middleware/passport.js";

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
        imgSrc: ["'self'", "data:", "https:"],
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
    ],
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session middleware for Passport
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Session middleware (required for Passport)
app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "your-session-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Authentication routes (public)
app.use("/api/auth", authRoutes);

// Some job routes should be public for browsing
app.use("/api/jobs", jobRoutes);

// Protected API routes (require authentication)
app.use("/api/users", authMiddleware, userRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/saved-jobs", authMiddleware, savedJobsRoutes);
app.use("/api/attachments", authMiddleware, attachmentRoutes);
app.use("/api/admin", authMiddleware, adminRoutes);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join user to their own room for notifications
  socket.on("join", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Handle real-time messaging (future feature)
  socket.on("send_message", (data) => {
    io.to(`user_${data.receiverId}`).emit("new_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
