import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const cards = pgTable("cards", {
  id: varchar("id").primaryKey(), // e.g., "major-0", "wands-1"
  name: text("name").notNull(),
  arcana: text("arcana").notNull(), // "Major" or "Minor"
  suit: text("suit"), // null for Major Arcana, "wands", "cups", "swords", "pentacles"
  number: integer("number"), // 0-21 for Major, 1-14 for Minor
  keywords: text("keywords").array().notNull().default(sql`ARRAY[]::text[]`),
  uprightShort: text("upright_short").notNull(),
  uprightLong: text("upright_long").notNull(),
  reversedShort: text("reversed_short").notNull(),
  reversedLong: text("reversed_long").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const spreads = pgTable("spreads", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  positions: jsonb("positions").notNull(), // Array of {index, name, roleHint, x?, y?}
  layoutHints: jsonb("layout_hints"), // {rows, cols, type}
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const readings = pgTable("readings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  spreadId: varchar("spread_id").references(() => spreads.id).notNull(),
  title: text("title"),
  cards: jsonb("cards").notNull(), // Array of {cardId, orientation, position, x?, y?}
  interpretation: jsonb("interpretation"), // Generated interpretation results
  isPublic: boolean("is_public").default(false),
  shareToken: varchar("share_token").unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const combinationRules = pgTable("combination_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  cardIds: text("card_ids").array().notNull(), // Array of card IDs in the combination
  condition: text("condition"), // "adjacent", "any_position", etc.
  modifier: text("modifier").notNull(), // The interpretation modifier text
  weight: integer("weight").default(1),
  isActive: boolean("is_active").default(true),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCardSchema = createInsertSchema(cards).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertSpreadSchema = createInsertSchema(spreads).omit({
  createdAt: true,
});

export const insertReadingSchema = createInsertSchema(readings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCombinationRuleSchema = createInsertSchema(combinationRules).omit({
  id: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCard = z.infer<typeof insertCardSchema>;
export type Card = typeof cards.$inferSelect;

export type InsertSpread = z.infer<typeof insertSpreadSchema>;
export type Spread = typeof spreads.$inferSelect;

export type InsertReading = z.infer<typeof insertReadingSchema>;
export type Reading = typeof readings.$inferSelect;

export type InsertCombinationRule = z.infer<typeof insertCombinationRuleSchema>;
export type CombinationRule = typeof combinationRules.$inferSelect;

// Additional types for frontend
export type CardOrientation = "upright" | "reversed";

export type PlacedCard = {
  cardId: string;
  orientation: CardOrientation;
  position: number;
  x?: number;
  y?: number;
};

export type SpreadPosition = {
  index: number;
  name: string;
  roleHint: string;
  x?: number;
  y?: number;
};

export type InterpretationResult = {
  positions: Array<{
    slotName: string;
    cardId: string;
    orientation: CardOrientation;
    interpretationShort: string;
    interpretationLong: string;
  }>;
  overallSummary: string;
  keywords: string[];
  confidenceHints: string[];
  suggestedActions: string[];
  dominantSuit?: string;
  majorArcanaCount: number;
  reversedCount: number;
};
