const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const JWTStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const crypto = require("crypto");

const User = require("../models/User");

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is required. Set it in your .env file.");
    }
    return secret;
};

/**
 * Passport Configuration
 * 
 * WHAT IS PASSPORT?
 * - Authentication middleware for Node.js
 * - Supports multiple strategies (local, JWT, OAuth, etc.)
 * 
 * STRATEGIES USED:
 * 1. Local Strategy: Email + Password login
 * 2. JWT Strategy: Token-based authentication for API routes
 */

/**
 * LOCAL STRATEGY
 * Used for login/registration with email and password
 * Compares plaintext password with hashed password in database
 */
passport.use(
    new LocalStrategy(
        {
            usernameField: "email",
            passwordField: "password"
        },
        async (email, password, done) => {
            try {
                // Find user by email
                const user = await User.findOne({ email }).select("+password");

                if (!user) {
                    return done(null, false, { message: "User not found" });
                }

                // Compare password with hashed password
                const isPasswordValid = await user.comparePassword(password);

                if (!isPasswordValid) {
                    return done(null, false, { message: "Invalid password" });
                }

                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }
    )
);

/**
 * JWT STRATEGY
 * Used to verify JWT tokens from Authorization header
 * Protects routes that require authentication
 */
passport.use(
    new JWTStrategy(
        {
            // Extract JWT from Authorization header: "Bearer <token>"
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: getJwtSecret()
        },
        async (jwtPayload, done) => {
            try {
                // Find user by ID from token payload
                const user = await User.findById(jwtPayload.id);

                if (!user) {
                    return done(null, false);
                }

                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }
    )
);

/**
 * GOOGLE OAUTH STRATEGY (optional)
 * Only registers if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.
 */
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback"
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails && profile.emails[0]?.value;
                    const name = profile.displayName || "Google User";

                    if (!email) {
                        return done(null, false, { message: "No email from Google" });
                    }

                    let user = await User.findOne({ email });

                    if (!user) {
                        // Create a user with a random password (not used for Google sign-in)
                        const randomPassword = crypto.randomBytes(16).toString("hex");
                        user = await User.create({
                            name,
                            email,
                            password: randomPassword,
                            isVerified: true
                        });
                    }

                    return done(null, user);
                } catch (error) {
                    return done(error);
                }
            }
        )
    );
}

module.exports = passport;
