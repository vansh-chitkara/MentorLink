const { verifyToken } = require("../config/jwtConfig");

/**
 * AUTHENTICATION MIDDLEWARE
 * Protects routes by verifying JWT token
 * 
 * HOW IT WORKS:
 * 1. Checks for Authorization header with "Bearer <token>"
 * 2. Verifies token signature and expiration
 * 3. Attaches user info to req.user if valid
 * 4. Sends 401 if token is missing or invalid
 * 
 * USAGE:
 * router.get("/protected-route", authenticateToken, controllerFunction);
 */

const authenticateToken = (req, res, next) => {
    // Extract token from Authorization header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

    if (!token) {
        return res.status(401).json({
            status: "error",
            message: "No token provided. Please log in."
        });
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({
            status: "error",
            message: "Invalid or expired token"
        });
    }

    // Attach user info to request object
    req.userId = decoded.id;
    req.token = token;

    next();
};

module.exports = authenticateToken;
