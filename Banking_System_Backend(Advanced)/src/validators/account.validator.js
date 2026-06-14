const { z } = require("zod");

const createAccountSchema = z.object({
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, "Currency must be a 3-letter code (e.g. INR, USD)")
    .optional()
    .default("INR"),
});

module.exports = { createAccountSchema };
