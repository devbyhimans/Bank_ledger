/**
 * Generic Zod validation middleware factory.
 * Compatible with Zod v4 (uses `e.issues` instead of `e.errors`).
 *
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate req.body against
 * @returns {import('express').RequestHandler}
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      // Parse and coerce the body — replaces req.body with cleaned/transformed values
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      // Zod v4 uses err.issues; also check by name for cross-module safety
      if (err && err.name === "ZodError" && Array.isArray(err.issues)) {
        const errors = err.issues.map((issue) => ({
          field: issue.path.join(".") || "root",
          message: issue.message,
        }));

        return res.status(400).json({
          status: "validation_error",
          message: "Invalid request data",
          errors,
        });
      }

      // Unknown error — pass to next error handler
      next(err);
    }
  };
}

module.exports = { validate };
