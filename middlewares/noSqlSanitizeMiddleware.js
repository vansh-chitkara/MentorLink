const sanitizeObject = (input) => {
  if (!input || typeof input !== "object") return input;

  if (Array.isArray(input)) {
    return input.map(sanitizeObject);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(input)) {
    if (key.startsWith("$") || key.includes(".")) {
      continue;
    }
    sanitized[key] = sanitizeObject(value);
  }
  return sanitized;
};

const noSqlSanitizeMiddleware = (req, res, next) => {
  req.body = sanitizeObject(req.body);
  req.params = sanitizeObject(req.params);
  req.query = sanitizeObject(req.query);
  next();
};

module.exports = noSqlSanitizeMiddleware;
