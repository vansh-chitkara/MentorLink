const stateChangingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const csrfOriginMiddleware = (req, res, next) => {
  if (!stateChangingMethods.has(req.method)) {
    return next();
  }

  // Bearer-token API clients are not cookie-based and are less CSRF-prone.
  if (req.headers.authorization?.startsWith("Bearer ")) {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000")
    .split(",")
    .map((o) => o.trim());

  const requestHost = req.get("host");
  const requestProtocol = req.protocol;
  const dynamicSameHostOrigin = requestHost ? `${requestProtocol}://${requestHost}` : null;

  const normalizedAllowedOrigins = new Set(
    allowedOrigins
      .map((value) => {
        try {
          return new URL(value).origin;
        } catch {
          return null;
        }
      })
      .filter(Boolean)
  );

  if (dynamicSameHostOrigin) {
    normalizedAllowedOrigins.add(dynamicSameHostOrigin);
  }

  const hasAllowedOrigin = (value) => {
    if (!value) return false;

    try {
      const parsedOrigin = new URL(value).origin;
      return normalizedAllowedOrigins.has(parsedOrigin);
    } catch {
      return false;
    }
  };

  if (
    hasAllowedOrigin(origin) ||
    hasAllowedOrigin(referer)
  ) {
    return next();
  }

  return res.status(403).json({
    status: "error",
    message: "CSRF protection: invalid request origin",
  });
};

module.exports = csrfOriginMiddleware;
