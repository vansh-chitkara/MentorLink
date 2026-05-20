const logger = require("../config/logger");

function errorMiddleware(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    logger.error({
        message: err.message,
        stack: err.stack,
        path: req.originalUrl,
        method: req.method,
    }, "request.failed");
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors)
            .map(e => e.message)
            .join(", ");
    }
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyPattern)[0];
        message = `${field} already exists`;
    }
    if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid resource identifier";
    }
    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token";
    }

    if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Token has expired";
    }

    res.status(statusCode).json({
        status: "error",
        statusCode,
        message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
}

module.exports = errorMiddleware;