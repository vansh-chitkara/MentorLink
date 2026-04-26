const express = require("express");
const router = express.Router();
const path = require("path");
const controller = require("../controllers/indexController");
const authenticateToken = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/rbacMiddleware");
const validate = require("../middlewares/validate");
const upload = require("../config/multerConfig");
const {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} = require("../validators/authValidators");
const {
    bookSessionSchema,
    messageSchema,
    feedbackSchema,
    mentorRequestSchema,
} = require("../validators/apiValidators");

/**
 * ROUTE STRUCTURE
 * Routes are organized by feature:
 * - Public Routes: No authentication needed
 * - Protected Routes: Require valid JWT token (authenticateToken middleware)
 * - File Upload Routes: Handle multipart form data (upload middleware)
 */

/**
 * PUBLIC ROUTES (SSR Pages)
 * Server-Side Rendering with EJS templates and HTML pages
 */
router.get("/", controller.homePage);
router.get("/login", (req, res) => {
    res.redirect("/signup");
});
router.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, "../views/pages/signup.html"));
});
router.get("/about", controller.aboutPage);
router.get("/resources", controller.resourcesPage);
router.get("/dashboard-page", (req, res) => {
    res.sendFile(path.join(__dirname, "../views/pages/dashboard-static.html"));
});
router.get("/dashboard", controller.dashboardPage);
router.get("/mentors", controller.mentorsPage);
router.get("/api-docs", controller.apiDocsPage);
router.get("/profile", controller.profilePage);
router.get("/sessions", controller.sessionsPage);
router.get("/messages", controller.messagesPage);

/**
 * AUTHENTICATION ROUTES
 * Register and login endpoints
 */
/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     responses:
 *       201:
 *         description: User created
 */
router.post("/api/auth/register", validate(registerSchema), controller.register);
/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/api/auth/login", validate(loginSchema), controller.login);
router.post("/api/auth/forgot-password", validate(forgotPasswordSchema), controller.forgotPassword);
router.post("/api/auth/reset-password", validate(resetPasswordSchema), controller.resetPassword);
router.get("/auth/google", controller.googleAuth);
router.get("/auth/google/callback", controller.googleCallbackEntry, controller.googleCallback);

/**
 * MENTOR ROUTES
 * Get mentors and manage profiles
 */
router.get("/api/mentors", controller.getMentors);
router.get("/api/mentors/:id", controller.getMentorById);
router.put("/api/profile", authenticateToken, controller.updateProfile);
router.post(
    "/api/profile/picture",
    authenticateToken,
    upload.single("profilePicture"),
    controller.uploadProfilePicture
);

/**
 * SESSION ROUTES
 * Book and manage mentorship sessions
 */
router.post("/api/sessions", authenticateToken, validate(bookSessionSchema), controller.bookSession);
router.get("/api/sessions", authenticateToken, controller.getSessions);
router.put("/api/sessions/:sessionId", authenticateToken, controller.updateSessionStatus);

/**
 * MENTOR REQUEST ROUTES
 * Create and respond to mentorship requests
 */
router.post(
    "/api/mentor-requests",
    authenticateToken,
    authorizeRoles("student"),
    validate(mentorRequestSchema),
    controller.createMentorRequest
);
router.get("/api/mentor-requests", authenticateToken, authorizeRoles("mentor"), controller.getMentorRequests);
router.put(
    "/api/mentor-requests/:requestId",
    authenticateToken,
    authorizeRoles("mentor"),
    controller.respondToRequest
);

/**
 * MESSAGE ROUTES
 * Send and retrieve messages (for chat)
 */
router.post("/api/messages", authenticateToken, validate(messageSchema), controller.sendMessage);
router.get("/api/messages", authenticateToken, controller.getMessages);

/**
 * FEEDBACK ROUTES
 * Submit and view mentor reviews
 */
router.post("/api/feedback", authenticateToken, authorizeRoles("student"), validate(feedbackSchema), controller.submitFeedback);
router.get("/api/feedback/:mentorId", controller.getMentorFeedback);

/**
 * STATS AND ACTIVITY ROUTES
 * Get platform statistics and activities
 */
/**
 * @openapi
 * /api/stats:
 *   get:
 *     tags: [Stats]
 *     summary: Get platform stats
 *     responses:
 *       200:
 *         description: Stats payload
 */
router.get("/api/stats", controller.getStats);
router.get("/api/activities", controller.getActivities);

module.exports = router;
