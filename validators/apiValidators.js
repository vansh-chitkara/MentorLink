const { z } = require("zod");

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

const bookSessionSchema = z.object({
  mentorId: objectIdSchema,
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1000).optional(),
  scheduledDate: z.coerce.date(),
  duration: z.number().int().min(15).max(240).optional(),
});

const messageSchema = z.object({
  recipientId: objectIdSchema,
  message: z.string().trim().min(1).max(5000),
});

const feedbackSchema = z.object({
  mentorId: objectIdSchema,
  rating: z.number().int().min(1).max(5),
  review: z.string().trim().min(3).max(1000),
  sessionId: objectIdSchema.optional(),
});

const mentorRequestSchema = z.object({
  mentorId: objectIdSchema,
  topic: z.string().trim().min(3).max(200),
  message: z.string().trim().min(5).max(1000),
});

module.exports = {
  bookSessionSchema,
  messageSchema,
  feedbackSchema,
  mentorRequestSchema,
};
