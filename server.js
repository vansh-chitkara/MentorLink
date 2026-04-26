require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");
const { xss } = require("express-xss-sanitizer");
const http = require("http");
const socketIo = require("socket.io");
const swaggerUi = require("swagger-ui-express");
const pinoHttp = require("pino-http");

// Database & Config
const connectDB = require("./config/database");
const passportConfig = require("./config/passportConfig");
const swaggerSpec = require("./config/swagger");
const logger = require("./config/logger");

// Middleware
const errorMiddleware = require("./middlewares/errorMiddleware");
const csrfOriginMiddleware = require("./middlewares/csrfOriginMiddleware");
const noSqlSanitizeMiddleware = require("./middlewares/noSqlSanitizeMiddleware");

// Routes
const routes = require("./routes/indexRoutes");

// Initialize Express App
const app = express();
app.disable("x-powered-by");

/**
 * MIDDLEWARE SETUP
 * Middleware executes in order: Request → Middleware 1 → Middleware 2 → Route Handler → Response
 * 
 * KEY MIDDLEWARE:
 * 1. Body Parser (express.json) - parse JSON request bodies
 * 2. URL Encoder (express.urlencoded) - parse form data
 * 3. CORS - allow cross-origin requests
 * 4. Cookie Parser - parse cookies
 * 5. Static Files - serve public assets
 * 6. Passport - authentication
 * 7. Logger - log requests
 * 8. Routes - application routes
 * 9. Error Handler - centralized error handling
 */

// Body Parser Middleware
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
    pinoHttp({
        logger,
        customLogLevel: (req, res, err) => {
            if (res.statusCode >= 500 || err) return "error";
            if (res.statusCode >= 400) return "warn";
            return "info";
        },
    })
);

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
                scriptSrcAttr: ["'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https:"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "https:"],
                fontSrc: ["'self'", "https:", "data:"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
                frameAncestors: ["'self'"],
            },
        },
    })
);
app.use(compression());
app.use(hpp());
app.use(noSqlSanitizeMiddleware);
app.use(xss());

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_MAX || 200),
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
        status: "error",
        message: "Too many requests, please try again later.",
    },
});
app.use("/api", apiLimiter);
app.use(csrfOriginMiddleware);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

// CORS Configuration
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// Cookie Parser
app.use(cookieParser());

// Static Files (CSS, JS, Images)
app.use(express.static(path.join(__dirname, "public")));

// View Engine Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Passport Authentication Setup
app.use(passportConfig.initialize());

// Routes
app.use("/", routes);

// API Docs
app.use("/api-reference-json", (req, res) => res.json(swaggerSpec));
app.use("/api-reference", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health Check Endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        server: "MentorLink v2.0",
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Documentation
app.get("/api-info", (req, res) => {
    res.json({
        title: "MentorLink API",
        version: "2.0.0",
        description: "Advanced mentorship platform with real-time features",
        features: [
            "User Authentication (JWT + Bcrypt)",
            "Real-time Chat (Socket.io)",
            "File Uploads (Multer + Cloudinary)",
            "Session Management (Express-Sessions)",
            "Feedback & Ratings System",
            "Mentor Requests"
        ]
    });
});

// 404 Handler
app.use((req, res) => {
    if (req.originalUrl.startsWith("/api")) {
        return res.status(404).json({
            status: "error",
            message: `Route not found: ${req.originalUrl}`,
        });
    }
    res.status(404).render("pages/404", { path: req.url });
});

// Error Handler (must be last)
app.use(errorMiddleware);

/**
 * SERVER INITIALIZATION
 * 1. Connect to MongoDB
 * 2. Setup Socket.io for real-time features
 * 3. Start listening on port
 */

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Socket.io Setup for Real-time Communication
const io = socketIo(server, {
    cors: {
        origin: process.env.ORIGIN || "http://localhost:3000",
        credentials: true
    }
});

/**
 * SOCKET.IO EVENTS
 * Real-time communication for chat and notifications
 */

io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "socket.connected");

    // Join user room for direct messaging
    socket.on("join", (userId) => {
        socket.join(`user-${userId}`);
        logger.info({ userId, socketId: socket.id }, "socket.joined_room");
    });

    // Send message event
    socket.on("send-message", (data) => {
        io.to(`user-${data.recipientId}`).emit("receive-message", data);
    });

    // Mentor request notification
    socket.on("mentor-request", (data) => {
        io.to(`user-${data.mentorId}`).emit("new-request", data);
    });

    // Session booking notification
    socket.on("session-booked", (data) => {
        io.to(`user-${data.mentorId}`).emit("session-notification", data);
    });

    socket.on("disconnect", () => {
        logger.info({ socketId: socket.id }, "socket.disconnected");
    });
});

// Make io accessible to routes
app.set("io", io);

server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
        logger.error({ port: PORT }, "Port already in use. Run npm run kill:3000 or use a different PORT.");
        process.exit(1);
    }
    logger.error({ message: error.message }, "Server failed to bind port");
    process.exit(1);
});

// Start Server
const startServer = async () => {
    try {
        logger.info("Connecting to database...");
        await connectDB();
        server.listen(PORT, () => {
            logger.info({ port: PORT }, "MentorLink server started");
        });
    } catch (error) {
        logger.error({ error: error.message }, "Failed to start server");
        process.exit(1);
    }
};

if (require.main === module) {
    startServer();
}

// Graceful Shutdown
process.on("SIGINT", () => {
    logger.info("Server shutting down...");
    server.close(() => {
        logger.info("Server stopped");
        process.exit(0);
    });
});

module.exports = { app, server, startServer };
