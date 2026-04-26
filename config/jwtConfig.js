const jwt = require("jsonwebtoken");

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is required. Set it in your .env file.");
    }
    return secret;
};

/**
 * JWT Configuration and Utilities
 * 
 * WHAT IS JWT?
 * - JSON Web Token: A secure way to send information between parties
 * - Structure: Header.Payload.Signature
 * - Used for stateless authentication (no server-side session storage needed)
 * 
 * WHY USE JWT?
 * - Scalable (no database lookup on every request)
 * - Works well with APIs and mobile apps
 * - Portable across different services
 */

/**
 * Generate JWT Token
 * Creates a token that expires after JWT_EXPIRE time
 * Token contains user ID and basic info
 */
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, getJwtSecret(), {
        expiresIn: process.env.JWT_EXPIRE || "7d"
    });
};

/**
 * Verify JWT Token
 * Checks if token is valid and not expired
 * Returns the decoded payload if valid
 */
const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, getJwtSecret());
        return decoded;
    } catch (error) {
        return null;
    }
};

/**
 * Decode JWT Token (without verification)
 * Used to read token claims without verifying signature
 */
const decodeToken = (token) => {
    return jwt.decode(token);
};

module.exports = {
    generateToken,
    verifyToken,
    decodeToken
};
