const { ZodError } = require("zod");

const validate = (schema, source = "body") => (req, res, next) => {
  try {
    req[source] = schema.parse(req[source]);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: error.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
      });
    }
    next(error);
  }
};

module.exports = validate;
