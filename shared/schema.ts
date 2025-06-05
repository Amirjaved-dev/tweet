import { z } from "zod";

// Thread generation request schema
export const generateThreadSchema = z.object({
  topic: z.string().min(10, "Topic must be at least 10 characters"),
  tone: z.enum(["professional", "bold", "storytelling", "funny", "educational", "inspirational"]),
  length: z.enum(["short", "medium", "long"]),
});

// Thread content schema
export const threadContentSchema = z.object({
  content: z.string(),
  order: z.number(),
});

// Thread schema
export const threadSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string(),
  topic: z.string(),
  tone: z.string(),
  content: z.string(),
  length: z.number(),
  created_at: z.string(),
});

// User schema for in-memory storage
export const userSchema = z.object({
  id: z.string(),
  plan: z.enum(["free", "pro", "enterprise"]).default("free"),
  created_at: z.string(),
});

// Usage tracking schema
export const usageSchema = z.object({
  user_id: z.string(),
  date: z.string(), // YYYY-MM-DD format
  threads_generated: z.number().default(0),
});

// Insert schemas for database operations
export const insertUserSchema = userSchema.omit({ id: true, created_at: true });
export const insertThreadSchema = threadSchema.omit({ id: true, created_at: true });

// Export types
export type GenerateThreadRequest = z.infer<typeof generateThreadSchema>;
export type ThreadContent = z.infer<typeof threadContentSchema>;
export type Thread = z.infer<typeof threadSchema>;
export type User = z.infer<typeof userSchema>;
export type Usage = z.infer<typeof usageSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertThread = z.infer<typeof insertThreadSchema>;

// Mock table objects for compatibility with Drizzle-style imports
export const users = userSchema;
export const threads = threadSchema;
export const usage = usageSchema;
