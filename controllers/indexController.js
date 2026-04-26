const User = require("../models/User");
const Session = require("../models/Session");
const MentorRequest = require("../models/MentorRequest");
const Message = require("../models/Message");
const Feedback = require("../models/Feedback");
const crypto = require("crypto");
const { generateToken } = require("../config/jwtConfig");
const { uploadToCloudinary, deleteFromCloudinary } = require("../config/cloudinaryConfig");
const passport = require("../config/passportConfig");
const { getCache, setCache } = require("../services/cacheService");
const { isEmailServiceConfigured, sendPasswordResetOtpEmail } = require("../services/emailService");

const demoMentors = [
    {
        _id: "demo-mentor-1",
        name: "Aarav Mehta",
        bio: "Senior backend engineer helping students with Node.js, APIs, and system design interviews.",
        skills: ["Node.js", "Express", "MongoDB", "System Design"],
        hourlyRate: 2500,
        experience: "6 years",
        profilePicture: "https://randomuser.me/api/portraits/men/32.jpg",
        rating: 4.9,
    },
    {
        _id: "demo-mentor-2",
        name: "Nisha Kapoor",
        bio: "Frontend mentor focused on React, JavaScript fundamentals, and building polished UI projects.",
        skills: ["React", "JavaScript", "HTML", "CSS"],
        hourlyRate: 1800,
        experience: "4 years",
        profilePicture: "https://randomuser.me/api/portraits/women/44.jpg",
        rating: 4.8,
    },
    {
        _id: "demo-mentor-3",
        name: "Rohan Bhatia",
        bio: "Data science mentor guiding learners in Python, machine learning, and project portfolio strategy.",
        skills: ["Python", "Machine Learning", "Pandas", "SQL"],
        hourlyRate: 3000,
        experience: "7 years",
        profilePicture: "https://randomuser.me/api/portraits/men/58.jpg",
        rating: 4.7,
    },
    {
        _id: "demo-mentor-4",
        name: "Simran Gill",
        bio: "Career mentor for resume reviews, interview prep, and communication confidence for placements.",
        skills: ["Interview Prep", "Career Guidance", "Resume Review"],
        hourlyRate: 1500,
        experience: "5 years",
        profilePicture: "https://randomuser.me/api/portraits/women/65.jpg",
        rating: 4.9,
    },
];

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const filterDemoMentors = ({ skill, hourlyRate }) => {
    const normalizedSkill = normalizeText(skill);
    const maxRate = hourlyRate ? Number.parseInt(hourlyRate, 10) : null;

    return demoMentors.filter((mentor) => {
        const mentorSkills = (mentor.skills || []).map((s) => normalizeText(s));
        const mentorName = normalizeText(mentor.name);
        const mentorRate = Number(mentor.hourlyRate || 0);

        const skillMatch =
            !normalizedSkill ||
            mentorName.includes(normalizedSkill) ||
            mentorSkills.some((skillItem) => skillItem.includes(normalizedSkill));

        const rateMatch =
            maxRate === null || (mentorRate > 0 && mentorRate <= maxRate);

        return skillMatch && rateMatch;
    });
};

const mergeMentorsWithDemo = (dbMentors, options = {}) => {
    const dbList = Array.isArray(dbMentors) ? dbMentors : [];
    const demoList = filterDemoMentors(options);

    const existingIds = new Set(dbList.map((mentor) => String(mentor._id)));
    const existingNames = new Set(dbList.map((mentor) => normalizeText(mentor.name)));

    const uniqueDemoMentors = demoList.filter((mentor) => {
        const demoId = String(mentor._id);
        const demoName = normalizeText(mentor.name);
        return !existingIds.has(demoId) && !existingNames.has(demoName);
    });

    return [...dbList, ...uniqueDemoMentors];
};

/**
 * PAGE CONTROLLERS
 * Render HTML pages with EJS template engine (SSR - Server-Side Rendering)
 */

exports.homePage = (req, res) => {
    res.render("pages/index", { title: "MentorLink - Home" });
};

exports.aboutPage = (req, res) => {
    res.render("pages/about", { title: "About MentorLink" });
};

exports.dashboardPage = (req, res) => {
    if (!req.userId) {
        return res.redirect("/login");
    }
    res.render("pages/dashboard", { title: "Dashboard" });
};

exports.mentorsPage = async (req, res, next) => {
    try {
        // Fetch all active mentors from database
        const dbMentors = await User.find({ role: "mentor", isActive: true })
            .select("name bio skills hourlyRate experience profilePicture rating")
            .lean();

        const mentors = mergeMentorsWithDemo(dbMentors);
        
        res.render("pages/mentors", { 
            title: "Find Mentors",
            mentors,
            mentorCount: mentors.length
        });
    } catch (error) {
        next(error);
    }
};

exports.resourcesPage = (req, res) => {
    res.render("pages/resources", { title: "Resources" });
};

exports.apiDocsPage = (req, res) => {
    res.render("pages/api", { title: "API Documentation" });
};

exports.profilePage = (req, res) => {
    res.render("pages/profile", { title: "Profile" });
};

exports.sessionsPage = (req, res) => {
    res.render("pages/sessions", { title: "My Sessions" });
};

exports.messagesPage = (req, res) => {
    res.render("pages/messages", { title: "Messages" });
};

/**
 * AUTHENTICATION ENDPOINTS
 * Register and Login with JWT
 */

exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                status: "error",
                message: "Email already registered"
            });
        }

        // Create new user
        const user = await User.create({
            name,
            email,
            password,
            role: role || "student"
        });

        // Generate JWT token
        const token = generateToken(user._id);

        res.status(201).json({
            status: "success",
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: "error",
                message: "Please provide email and password"
            });
        }

        // Find user and select password field
        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(401).json({
                status: "error",
                message: "Invalid credentials"
            });
        }

        // Compare passwords
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                status: "error",
                message: "Invalid credentials"
            });
        }

        // Generate JWT token
        const token = generateToken(user._id);

        res.status(200).json({
            status: "success",
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const genericMessage = "If an account exists, an OTP has been generated.";

        if (!isEmailServiceConfigured()) {
            return res.status(503).json({
                status: "error",
                message: "Email OTP is not configured on server yet.",
            });
        }

        const user = await User.findOne({ email }).select(
            "+resetOtpHash +resetOtpExpiresAt +resetOtpAttempts +resetOtpLastSentAt"
        );

        if (!user) {
            return res.status(404).json({
                status: "error",
                message: "Email is not registered.",
            });
        }

        const now = new Date();
        const minGapMs = 60 * 1000;
        if (user.resetOtpLastSentAt && now - user.resetOtpLastSentAt < minGapMs) {
            const elapsedMs = now - user.resetOtpLastSentAt;
            const retryAfterSeconds = Math.max(1, Math.ceil((minGapMs - elapsedMs) / 1000));

            return res.status(429).json({
                status: "error",
                message: `Please wait ${retryAfterSeconds} seconds before requesting another OTP.`,
                retryAfterSeconds,
                canUseExistingOtp: true,
            });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

        user.resetOtpHash = otpHash;
        user.resetOtpExpiresAt = new Date(now.getTime() + 10 * 60 * 1000);
        user.resetOtpAttempts = 0;
        user.resetOtpLastSentAt = now;
        await user.save();

        try {
            await sendPasswordResetOtpEmail({
                to: email,
                otp,
            });
        } catch (emailError) {
            user.resetOtpHash = null;
            user.resetOtpExpiresAt = null;
            user.resetOtpAttempts = 0;
            await user.save();

            const smtpAuthFailed =
                emailError?.code === "EAUTH" ||
                String(emailError?.response || "").toLowerCase().includes("badcredentials") ||
                String(emailError?.message || "").toLowerCase().includes("username and password not accepted");

            return res.status(500).json({
                status: "error",
                message: smtpAuthFailed
                    ? "Email sender authentication failed. Use Gmail App Password in EMAIL_PASS."
                    : "Unable to send OTP email right now. Please try again.",
            });
        }

        return res.status(200).json({
            status: "success",
            message: genericMessage,
        });
    } catch (error) {
        next(error);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;

        const user = await User.findOne({ email }).select(
            "+password +resetOtpHash +resetOtpExpiresAt +resetOtpAttempts"
        );

        if (!user || !user.resetOtpHash || !user.resetOtpExpiresAt) {
            return res.status(400).json({
                status: "error",
                message: "Invalid OTP or OTP has expired.",
            });
        }

        if (user.resetOtpExpiresAt.getTime() < Date.now()) {
            user.resetOtpHash = null;
            user.resetOtpExpiresAt = null;
            user.resetOtpAttempts = 0;
            await user.save();

            return res.status(400).json({
                status: "error",
                message: "Invalid OTP or OTP has expired.",
            });
        }

        const maxAttempts = 5;
        if ((user.resetOtpAttempts || 0) >= maxAttempts) {
            user.resetOtpHash = null;
            user.resetOtpExpiresAt = null;
            user.resetOtpAttempts = 0;
            await user.save();

            return res.status(429).json({
                status: "error",
                message: "Too many invalid attempts. Request a new OTP.",
            });
        }

        const incomingHash = crypto.createHash("sha256").update(otp).digest("hex");
        if (incomingHash !== user.resetOtpHash) {
            user.resetOtpAttempts = (user.resetOtpAttempts || 0) + 1;
            await user.save();

            return res.status(400).json({
                status: "error",
                message: "Invalid OTP or OTP has expired.",
            });
        }

        const isSameAsOldPassword = await user.comparePassword(newPassword);
        if (isSameAsOldPassword) {
            return res.status(400).json({
                status: "error",
                message: "New password cannot be same as old password.",
            });
        }

        user.password = newPassword;
        user.resetOtpHash = null;
        user.resetOtpExpiresAt = null;
        user.resetOtpAttempts = 0;
        await user.save();

        return res.status(200).json({
            status: "success",
            message: "Password reset successful. Please sign in with your new password.",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GOOGLE AUTH CALLBACK
 * Generates JWT and pushes it to localStorage via a tiny HTML bridge
 */
exports.googleAuth = (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.redirect("/signup?error=google_not_configured");
    }

    return passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
};

exports.googleCallbackEntry = (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.redirect("/signup?error=google_not_configured");
    }

    return passport.authenticate("google", {
        session: false,
        failureRedirect: "/signup?error=google_auth_failed",
    })(req, res, next);
};

exports.googleCallback = (req, res) => {
    const user = req.user;

    if (!user) {
        return res.redirect("/signup?error=google_auth_failed");
    }

    const token = generateToken(user._id);
    const safeUser = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
    };

    const userBase64 = Buffer.from(JSON.stringify(safeUser), "utf8").toString("base64");

    res.send(`<!DOCTYPE html>
        <html><head><title>Signing you in...</title></head>
        <body>
        <script>
            (function () {
                var token = ${JSON.stringify(token)};
                var userJson = atob(${JSON.stringify(userBase64)});
                localStorage.setItem('token', token);
                sessionStorage.setItem('token', token);
                localStorage.setItem('user', userJson);
                sessionStorage.setItem('user', userJson);
                window.location.replace('/dashboard-page');
            })();
        </script>
        </body></html>`);
};

/**
 * MENTOR ENDPOINTS
 * Get, update, and manage mentor profiles
 */

exports.getMentors = async (req, res, next) => {
    try {
        const { skill, hourlyRate } = req.query;

        // Build filter
        let filter = { role: "mentor", isActive: true };

        if (skill) {
            filter.skills = { $in: [skill] };
        }

        if (hourlyRate) {
            filter.hourlyRate = { $lte: parseInt(hourlyRate) };
        }

        // Get mentors from database
        const dbMentors = await User.find(filter).select(
            "name bio skills hourlyRate experience profilePicture"
        );

        const mentors = mergeMentorsWithDemo(dbMentors, { skill, hourlyRate });

        res.json({
            status: "success",
            count: mentors.length,
            mentors
        });
    } catch (error) {
        next(error);
    }
};

exports.getMentorById = async (req, res, next) => {
    try {
        const mentor = await User.findById(req.params.id);

        if (!mentor || mentor.role !== "mentor") {
            return res.status(404).json({
                status: "error",
                message: "Mentor not found"
            });
        }

        // Get mentor's average rating
        const feedbacks = await Feedback.find({ mentor: mentor._id });
        const avgRating = feedbacks.length > 0
            ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
            : 0;

        res.json({
            status: "success",
            mentor: {
                ...mentor.toObject(),
                avgRating,
                reviewCount: feedbacks.length
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { bio, skills, hourlyRate, experience } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { bio, skills, hourlyRate, experience },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                status: "error",
                message: "User not found"
            });
        }

        res.json({
            status: "success",
            message: "Profile updated successfully",
            user: updatedUser
        });
    } catch (error) {
        next(error);
    }
};

exports.uploadProfilePicture = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: "error",
                message: "No file uploaded"
            });
        }

        const userId = req.userId;

        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.path, "mentorlink/profiles");

        // Update user with profile picture URL
        const user = await User.findByIdAndUpdate(
            userId,
            { profilePicture: result.secure_url },
            { new: true }
        );

        res.json({
            status: "success",
            message: "Profile picture updated",
            profilePicture: result.secure_url,
            user
        });
    } catch (error) {
        next(error);
    }
};

/**
 * SESSION ENDPOINTS
 * Book, manage, and complete mentorship sessions
 */

exports.bookSession = async (req, res, next) => {
    try {
        const { mentorId, title, description, scheduledDate, duration } = req.body;
        const studentId = req.userId;

        // Validate mentor exists
        const mentor = await User.findById(mentorId);
        if (!mentor) {
            return res.status(404).json({
                status: "error",
                message: "Mentor not found"
            });
        }

        // Create session
        const session = await Session.create({
            student: studentId,
            mentor: mentorId,
            title,
            description,
            scheduledDate,
            duration: duration || 60
        });

        // Emit real-time notification
        req.app.get("io").emit("session-booked", {
            mentorId,
            session
        });

        res.status(201).json({
            status: "success",
            message: "Session booked successfully",
            session
        });
    } catch (error) {
        next(error);
    }
};

exports.getSessions = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { role, status } = req.query;

        let filter = {};

        if (role === "student") {
            filter.student = userId;
        } else if (role === "mentor") {
            filter.mentor = userId;
        }

        if (status) {
            filter.status = status;
        }

        const sessions = await Session.find(filter)
            .populate("student mentor", "name email profilePicture")
            .sort({ createdAt: -1 });

        res.json({
            status: "success",
            count: sessions.length,
            sessions
        });
    } catch (error) {
        next(error);
    }
};

exports.updateSessionStatus = async (req, res, next) => {
    try {
        const { status, meetingLink } = req.body;

        const session = await Session.findByIdAndUpdate(
            req.params.sessionId,
            { status, meetingLink },
            { new: true }
        ).populate("student mentor", "name email");

        if (!session) {
            return res.status(404).json({
                status: "error",
                message: "Session not found",
            });
        }

        res.json({
            status: "success",
            message: "Session updated",
            session
        });
    } catch (error) {
        next(error);
    }
};

/**
 * MENTOR REQUEST ENDPOINTS
 * Create and manage mentor connection requests
 */

exports.createMentorRequest = async (req, res, next) => {
    try {
        const { mentorId, topic, message } = req.body;
        const studentId = req.userId;

        // Prevent duplicate requests
        const existingRequest = await MentorRequest.findOne({
            student: studentId,
            mentor: mentorId,
            status: "pending"
        });

        if (existingRequest) {
            return res.status(400).json({
                status: "error",
                message: "Request already pending"
            });
        }

        const request = await MentorRequest.create({
            student: studentId,
            mentor: mentorId,
            topic,
            message
        });

        // Emit real-time notification
        req.app.get("io").emit("mentor-request", {
            mentorId,
            request
        });

        res.status(201).json({
            status: "success",
            message: "Request sent successfully",
            request
        });
    } catch (error) {
        next(error);
    }
};

exports.getMentorRequests = async (req, res, next) => {
    try {
        const userId = req.userId;

        const requests = await MentorRequest.find({ mentor: userId })
            .populate("student", "name email")
            .sort({ createdAt: -1 });

        res.json({
            status: "success",
            count: requests.length,
            requests
        });
    } catch (error) {
        next(error);
    }
};

exports.respondToRequest = async (req, res, next) => {
    try {
        const { status, mentorResponse } = req.body;

        const request = await MentorRequest.findByIdAndUpdate(
            req.params.requestId,
            { status, mentorResponse },
            { new: true }
        ).populate("student mentor", "name email");

        if (!request) {
            return res.status(404).json({
                status: "error",
                message: "Mentor request not found",
            });
        }

        res.json({
            status: "success",
            message: "Request response sent",
            request
        });
    } catch (error) {
        next(error);
    }
};

/**
 * MESSAGING ENDPOINTS
 * Send and retrieve messages between users
 */

exports.sendMessage = async (req, res, next) => {
    try {
        const { recipientId, message } = req.body;
        const senderId = req.userId;

        const msg = await Message.create({
            sender: senderId,
            recipient: recipientId,
            message
        });

        // Emit real-time message
        req.app.get("io").to(`user-${recipientId}`).emit("new-message", {
            sender: senderId,
            message: msg.message,
            timestamp: msg.createdAt
        });

        res.status(201).json({
            status: "success",
            message: "Message sent",
            msg
        });
    } catch (error) {
        next(error);
    }
};

exports.getMessages = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { otherUserId } = req.query;

        if (!otherUserId) {
            return res.status(400).json({
                status: "error",
                message: "otherUserId is required",
            });
        }

        const messages = await Message.find({
            $or: [
                { sender: userId, recipient: otherUserId },
                { sender: otherUserId, recipient: userId }
            ]
        }).sort({ createdAt: 1 });

        res.json({
            status: "success",
            count: messages.length,
            messages
        });
    } catch (error) {
        next(error);
    }
};

/**
 * FEEDBACK ENDPOINTS
 * Submit and retrieve mentor reviews
 */

exports.submitFeedback = async (req, res, next) => {
    try {
        const { mentorId, rating, review, sessionId } = req.body;
        const studentId = req.userId;

        const feedback = await Feedback.findOneAndUpdate(
            { student: studentId, mentor: mentorId },
            { rating, review, session: sessionId },
            { upsert: true, new: true }
        );

        res.json({
            status: "success",
            message: "Feedback submitted successfully",
            feedback
        });
    } catch (error) {
        next(error);
    }
};

exports.getMentorFeedback = async (req, res, next) => {
    try {
        const mentorId = req.params.mentorId;

        const feedbacks = await Feedback.find({ mentor: mentorId })
            .populate("student", "name profilePicture");

        const avgRating = feedbacks.length > 0
            ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
            : 0;

        res.json({
            status: "success",
            avgRating: avgRating.toFixed(1),
            reviewCount: feedbacks.length,
            feedbacks
        });
    } catch (error) {
        next(error);
    }
};

/**
 * STATS ENDPOINTS
 * Get platform statistics
 */

exports.getStats = async (req, res, next) => {
    try {
        const cached = await getCache("stats:global");
        if (cached) {
            return res.json({ status: "success", stats: cached, cached: true });
        }

        const totalUsers = await User.countDocuments();
        const totalMentors = await User.countDocuments({ role: "mentor" });
        const totalStudents = await User.countDocuments({ role: "student" });
        const totalSessions = await Session.countDocuments();
        const totalFeedbacks = await Feedback.countDocuments();

        const stats = {
            totalUsers,
            totalMentors,
            totalStudents,
            totalSessions,
            totalFeedbacks
        };

        await setCache("stats:global", stats, 60);

        res.json({
            status: "success",
            stats
        });
    } catch (error) {
        next(error);
    }
};

/**
 * ACTIVITY ENDPOINTS
 * Track platform activities
 */

exports.getActivities = async (req, res, next) => {
    try {
        const activities = [];

        // Recent sessions
        const recentSessions = await Session.find()
            .limit(5)
            .sort({ createdAt: -1 })
            .populate("student mentor", "name");

        recentSessions.forEach(session => {
            activities.push({
                type: "session",
                description: `${session.student.name} booked session with ${session.mentor.name}`,
                timestamp: session.createdAt
            });
        });

        // Recent feedbacks
        const recentFeedbacks = await Feedback.find()
            .limit(5)
            .sort({ createdAt: -1 })
            .populate("student mentor", "name");

        recentFeedbacks.forEach(feedback => {
            activities.push({
                type: "feedback",
                description: `${feedback.student.name} gave ${feedback.rating} stars to ${feedback.mentor.name}`,
                timestamp: feedback.createdAt
            });
        });

        activities.sort((a, b) => b.timestamp - a.timestamp);

        res.json({
            status: "success",
            count: activities.length,
            activities
        });
    } catch (error) {
        next(error);
    }
};
