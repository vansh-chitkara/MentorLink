const logger = require("../config/logger");

let totalRequests = 0;

function loggerMiddleware(req, res, next) {
    totalRequests++;
    const startTime = Date.now();
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