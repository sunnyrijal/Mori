import { pgTable, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(), // matches auth.users.id
  name: text('name'),
  email: text('email'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  isPremium: boolean('is_premium').default(false),
  subscriptionTier: text('subscription_tier').default('Free'),
  lastSurveyDate: timestamp('last_survey_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const inventory_items = pgTable('inventory_items', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => profiles.id).notNull(),
  name: text('name').notNull(),
  category: text('category'),
  confidence: text('confidence'), // Wait, previously confidence was float? In types.ts it says number. I will change confidence to numeric, but text is fine since we parse it anyway. Let's use text for simplicity or keep it aligned with original. Original inventory schema didn't exist in DB.
  interest: text('interest'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const preferences = pgTable('preferences', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => profiles.id).notNull(),
  livingSituation: text('living_situation'),
  partnerUsername: text('partner_username'),
  energyDefaults: text('energy_defaults'),
  hobbies: jsonb('hobbies').default('[]'),
  dataMigrated: boolean('data_migrated').default(false)
});

export const weekly_reflections = pgTable('weekly_reflections', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => profiles.id).notNull(),
  weekTimestamp: timestamp('week_timestamp').defaultNow().notNull(),
  responses: jsonb('responses').notNull(),
});
