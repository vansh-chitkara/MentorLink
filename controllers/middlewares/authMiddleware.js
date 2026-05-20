const { verifyToken } = require("../config/jwtConfig");

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

    if (!token) {
        return res.status(401).json({
            status: "error",
            message: "No token provided. Please log in."
        });
    }
    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({
            status: "error",
            message: "Invalid or expired token"
        });
    }
    req.userId = decoded.id;
    req.token = token;

    next();
};

module.exports = authenticateToken;
