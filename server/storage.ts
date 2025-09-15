import { 
  type User, 
  type InsertUser, 
  type Card, 
  type InsertCard,
  type Spread,
  type InsertSpread,
  type Reading,
  type InsertReading,
  type CombinationRule,
  type InsertCombinationRule,
  type InterpretationResult,
  users,
  cards,
  spreads,
  readings,
  combinationRules
} from "@shared/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Card methods
  getAllCards(): Promise<Card[]>;
  getCard(id: string): Promise<Card | undefined>;
  createCard(card: InsertCard): Promise<Card>;
  updateCard(id: string, updates: Partial<InsertCard>): Promise<Card | undefined>;
  deleteCard(id: string): Promise<boolean>;

  // Spread methods
  getAllSpreads(): Promise<Spread[]>;
  getSpread(id: string): Promise<Spread | undefined>;
  createSpread(spread: InsertSpread): Promise<Spread>;
  updateSpread(id: string, updates: Partial<InsertSpread>): Promise<Spread | undefined>;

  // Reading methods
  createReading(reading: InsertReading): Promise<Reading>;
  getReading(id: string): Promise<Reading | undefined>;
  getReadingByShareToken(token: string): Promise<Reading | undefined>;
  getUserReadings(userId: string): Promise<Reading[]>;
  updateReading(id: string, updates: Partial<InsertReading>): Promise<Reading | undefined>;

  // Combination rule methods
  getAllCombinationRules(): Promise<CombinationRule[]>;
  createCombinationRule(rule: InsertCombinationRule): Promise<CombinationRule>;
}

export class DatabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    const sql = postgres(connectionString);
    this.db = drizzle(sql);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const result = await this.db.insert(users).values({
      ...insertUser,
      password: hashedPassword,
    }).returning();
    return result[0];
  }

  // Card methods
  async getAllCards(): Promise<Card[]> {
    return await this.db.select().from(cards);
  }

  async getCard(id: string): Promise<Card | undefined> {
    const result = await this.db.select().from(cards).where(eq(cards.id, id)).limit(1);
    return result[0];
  }

  async createCard(insertCard: InsertCard): Promise<Card> {
    const result = await this.db.insert(cards).values(insertCard).returning();
    return result[0];
  }

  async updateCard(id: string, updates: Partial<InsertCard>): Promise<Card | undefined> {
    const result = await this.db.update(cards).set({
      ...updates,
      updatedAt: new Date(),
    }).where(eq(cards.id, id)).returning();
    return result[0];
  }

  async deleteCard(id: string): Promise<boolean> {
    try {
      await this.db.delete(cards).where(eq(cards.id, id));
      return true;
    } catch (error) {
      return false;
    }
  }

  // Spread methods
  async getAllSpreads(): Promise<Spread[]> {
    return await this.db.select().from(spreads).where(eq(spreads.isActive, true));
  }

  async getSpread(id: string): Promise<Spread | undefined> {
    const result = await this.db.select().from(spreads).where(eq(spreads.id, id)).limit(1);
    return result[0];
  }

  async createSpread(insertSpread: InsertSpread): Promise<Spread> {
    const result = await this.db.insert(spreads).values(insertSpread).returning();
    return result[0];
  }

  async updateSpread(id: string, updates: Partial<InsertSpread>): Promise<Spread | undefined> {
    const result = await this.db.update(spreads).set(updates).where(eq(spreads.id, id)).returning();
    return result[0];
  }

  // Reading methods
  async createReading(insertReading: InsertReading): Promise<Reading> {
    const shareToken = insertReading.isPublic ? randomUUID() : null;
    const result = await this.db.insert(readings).values({
      ...insertReading,
      shareToken,
    }).returning();
    return result[0];
  }

  async getReading(id: string): Promise<Reading | undefined> {
    const result = await this.db.select().from(readings).where(eq(readings.id, id)).limit(1);
    return result[0];
  }

  async getReadingByShareToken(token: string): Promise<Reading | undefined> {
    const result = await this.db.select().from(readings).where(eq(readings.shareToken, token)).limit(1);
    return result[0];
  }

  async getUserReadings(userId: string): Promise<Reading[]> {
    return await this.db.select().from(readings)
      .where(eq(readings.userId, userId))
      .orderBy(desc(readings.createdAt));
  }

  async updateReading(id: string, updates: Partial<InsertReading>): Promise<Reading | undefined> {
    const result = await this.db.update(readings).set({
      ...updates,
      updatedAt: new Date(),
    }).where(eq(readings.id, id)).returning();
    return result[0];
  }

  // Combination rule methods
  async getAllCombinationRules(): Promise<CombinationRule[]> {
    return await this.db.select().from(combinationRules).where(eq(combinationRules.isActive, true));
  }

  async createCombinationRule(insertRule: InsertCombinationRule): Promise<CombinationRule> {
    const result = await this.db.insert(combinationRules).values(insertRule).returning();
    return result[0];
  }
}

// For development - fallback to memory storage if DATABASE_URL is not available
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private cards: Map<string, Card>;
  private spreads: Map<string, Spread>;
  private readings: Map<string, Reading>;
  private combinationRules: Map<string, CombinationRule>;

  constructor() {
    this.users = new Map();
    this.cards = new Map();
    this.spreads = new Map();
    this.readings = new Map();
    this.combinationRules = new Map();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = { ...insertUser, id, password: hashedPassword };
    this.users.set(id, user);
    return user;
  }

  // Card methods
  async getAllCards(): Promise<Card[]> {
    return Array.from(this.cards.values());
  }

  async getCard(id: string): Promise<Card | undefined> {
    return this.cards.get(id);
  }

  async createCard(insertCard: InsertCard): Promise<Card> {
    const card: Card = {
      ...insertCard,
      number: insertCard.number ?? null,
      suit: insertCard.suit ?? null,
      imageUrl: insertCard.imageUrl ?? null,
      keywords: insertCard.keywords || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.cards.set(card.id, card);
    return card;
  }

  async updateCard(id: string, updates: Partial<InsertCard>): Promise<Card | undefined> {
    const existing = this.cards.get(id);
    if (!existing) return undefined;
    
    const updated: Card = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.cards.set(id, updated);
    return updated;
  }

  async deleteCard(id: string): Promise<boolean> {
    return this.cards.delete(id);
  }

  // Spread methods
  async getAllSpreads(): Promise<Spread[]> {
    return Array.from(this.spreads.values()).filter(s => s.isActive);
  }

  async getSpread(id: string): Promise<Spread | undefined> {
    return this.spreads.get(id);
  }

  async createSpread(insertSpread: InsertSpread): Promise<Spread> {
    const spread: Spread = {
      ...insertSpread,
      description: insertSpread.description ?? null,
      layoutHints: insertSpread.layoutHints ?? null,
      isActive: insertSpread.isActive ?? true,
      createdAt: new Date(),
    };
    this.spreads.set(spread.id, spread);
    return spread;
  }

  async updateSpread(id: string, updates: Partial<InsertSpread>): Promise<Spread | undefined> {
    const existing = this.spreads.get(id);
    if (!existing) return undefined;
    
    const updated: Spread = {
      ...existing,
      ...updates,
    };
    this.spreads.set(id, updated);
    return updated;
  }

  // Reading methods
  async createReading(insertReading: InsertReading): Promise<Reading> {
    const id = randomUUID();
    const shareToken = insertReading.isPublic ? randomUUID() : null;
    const reading: Reading = {
      ...insertReading,
      id,
      userId: insertReading.userId ?? null,
      title: insertReading.title ?? null,
      interpretation: insertReading.interpretation ?? null,
      isPublic: insertReading.isPublic ?? false,
      shareToken,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.readings.set(id, reading);
    return reading;
  }

  async getReading(id: string): Promise<Reading | undefined> {
    return this.readings.get(id);
  }

  async getReadingByShareToken(token: string): Promise<Reading | undefined> {
    return Array.from(this.readings.values()).find(r => r.shareToken === token);
  }

  async getUserReadings(userId: string): Promise<Reading[]> {
    return Array.from(this.readings.values())
      .filter(r => r.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async updateReading(id: string, updates: Partial<InsertReading>): Promise<Reading | undefined> {
    const existing = this.readings.get(id);
    if (!existing) return undefined;
    
    const updated: Reading = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.readings.set(id, updated);
    return updated;
  }

  // Combination rule methods
  async getAllCombinationRules(): Promise<CombinationRule[]> {
    return Array.from(this.combinationRules.values()).filter(r => r.isActive);
  }

  async createCombinationRule(insertRule: InsertCombinationRule): Promise<CombinationRule> {
    const id = randomUUID();
    const rule: CombinationRule = {
      ...insertRule,
      id,
      condition: insertRule.condition ?? null,
      weight: insertRule.weight ?? 1,
      isActive: insertRule.isActive ?? true,
    };
    this.combinationRules.set(id, rule);
    return rule;
  }
}

// Use DatabaseStorage if DATABASE_URL is available, otherwise fallback to MemStorage
function createStorage(): IStorage {
  if (process.env.DATABASE_URL) {
    try {
      return new DatabaseStorage();
    } catch (error) {
      console.warn('Failed to initialize DatabaseStorage, falling back to MemStorage:', error);
      return new MemStorage();
    }
  }
  return new MemStorage();
}

export const storage = createStorage();
