import { text, timestamp, pgTable, integer, serial, boolean, jsonb } from 'drizzle-orm/pg-core';

// Thread table for storing generated threads
export const threads = pgTable('threads', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  topic: text('topic').notNull(),
  tone: text('tone').notNull(),
  content: text('content').notNull(),
  length: integer('length').notNull().default(0),
  metadata: jsonb('metadata'), // Store additional metadata for Web3 threads
  createdAt: timestamp('created_at').defaultNow(),
});

// User usage table for tracking daily thread generation limits
export const userUsage = pgTable('user_usage', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  date: timestamp('date').defaultNow(),
  generationCount: integer('generation_count').default(0),
  isPaidUser: boolean('is_paid_user').default(false),
});

// Subscription plans table
export const subscriptionPlans = pgTable('subscription_plans', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  planType: text('plan_type').notNull(), // 'free', 'pro', 'premium'
  dailyLimit: integer('daily_limit').notNull(),
  isActive: boolean('is_active').default(true),
  startDate: timestamp('start_date').defaultNow(),
  endDate: timestamp('end_date'),
}); 