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

router.post("/api/auth/register", validate(registerSchema), controller.register);
router.post("/api/auth/login", validate(loginSchema), controller.login);
router.post("/api/auth/forgot-password", validate(forgotPasswordSchema), controller.forgotPassword);
router.post("/api/auth/reset-password", validate(resetPasswordSchema), controller.resetPassword);
router.get("/auth/google", controller.googleAuth);
router.get("/auth/google/callback", controller.googleCallbackEntry, controller.googleCallback);
router.get("/api/mentors", controller.getMentors);
router.get("/api/mentors/:id", controller.getMentorById);

router.put("/api/profile", authenticateToken, controller.updateProfile);

router.post(
    "/api/profile/picture",
    authenticateToken,
    upload.single("profilePicture"),
    controller.uploadProfilePicture
);
router.post("/api/sessions", authenticateToken, validate(bookSessionSchema), controller.bookSession);
router.get("/api/sessions", authenticateToken, controller.getSessions);
router.put("/api/sessions/:sessionId", authenticateToken, controller.updateSessionStatus);
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
router.post("/api/messages", authenticateToken, validate(messageSchema), controller.sendMessage);
router.get("/api/messages", authenticateToken, controller.getMessages);
router.post("/api/feedback", authenticateToken, authorizeRoles("student"), validate(feedbackSchema), controller.submitFeedback);
router.get("/api/feedback/:mentorId", controller.getMentorFeedback);
router.get("/api/stats", controller.getStats);
router.get("/api/activities", controller.getActivities);

module.exports = router;