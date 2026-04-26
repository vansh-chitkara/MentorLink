/**
 * LOGGER MIDDLEWARE
 * Logs incoming HTTP requests with timing information
 * 
 * WHY MIDDLEWARE?
 * - Middleware lifecycle: Request → Middleware → Route Handler → Response
 * - Allows code to execute before/after route handlers
 * - Can modify req and res objects
 * 
 * WHAT WE LOG:
 * - HTTP method (GET, POST, PUT, DELETE)
 * - Request URL path
 * - Response time
 * - Total requests count
 */

const logger = require("../config/logger");

let totalRequests = 0;

function loggerMiddleware(req, res, next) {
    totalRequests++;

    // Record request start time for response time calculation
    const startTime = Date.now();

    // Intercept res.end() to log after response is sent
    const originalEnd = res.end;
    res.end = function () {
        const responseTime = Date.now() - startTime;
        logger.info({
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            responseTime,
            totalRequests,
        }, "request.completed");
        originalEnd.apply(res, arguments);
    };

    next();
}

module.exports = loggerMiddleware;