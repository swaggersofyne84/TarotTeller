import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCardSchema, 
  insertSpreadSchema, 
  insertReadingSchema,
  insertCombinationRuleSchema,
  type PlacedCard,
  type InterpretationResult
} from "@shared/schema";
import { interpretReading } from "../client/src/lib/tarotEngine";
import { TarotSeedData } from "../scripts/seed";
import { z } from "zod";

// Type conversion helpers to handle database types (null) vs frontend types (undefined)
function convertDbSpreadToFrontendSpread(dbSpread: any): any {
  return {
    ...dbSpread,
    description: dbSpread.description ?? undefined,
    layoutHints: dbSpread.layoutHints ?? undefined,
  };
}

function convertDbCardToFrontendCard(dbCard: any): any {
  return {
    ...dbCard,
    suit: dbCard.suit ?? undefined,
    number: dbCard.number ?? undefined,
    imageUrl: dbCard.imageUrl ?? undefined,
  };
}

function convertDbCombinationRuleToFrontendRule(dbRule: any): any {
  return {
    ...dbRule,
    condition: dbRule.condition ?? undefined,
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Card routes
  app.get("/api/cards", async (req, res) => {
    try {
      const cards = await storage.getAllCards();
      res.json(cards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cards" });
    }
  });

  app.get("/api/cards/:id", async (req, res) => {
    try {
      const card = await storage.getCard(req.params.id);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }
      res.json(card);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch card" });
    }
  });

  app.post("/api/cards", async (req, res) => {
    try {
      const validatedData = insertCardSchema.parse(req.body);
      const card = await storage.createCard(validatedData);
      res.status(201).json(card);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid card data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create card" });
    }
  });

  app.put("/api/cards/:id", async (req, res) => {
    try {
      const updates = insertCardSchema.partial().parse(req.body);
      const card = await storage.updateCard(req.params.id, updates);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }
      res.json(card);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid card data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update card" });
    }
  });

  // Spread routes
  app.get("/api/spreads", async (req, res) => {
    try {
      const spreads = await storage.getAllSpreads();
      res.json(spreads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch spreads" });
    }
  });

  app.get("/api/spreads/:id", async (req, res) => {
    try {
      const spread = await storage.getSpread(req.params.id);
      if (!spread) {
        return res.status(404).json({ message: "Spread not found" });
      }
      res.json(spread);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch spread" });
    }
  });

  app.post("/api/spreads", async (req, res) => {
    try {
      const validatedData = insertSpreadSchema.parse(req.body);
      const spread = await storage.createSpread(validatedData);
      res.status(201).json(spread);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid spread data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create spread" });
    }
  });

  // Reading routes
  app.post("/api/readings", async (req, res) => {
    try {
      const validatedData = insertReadingSchema.parse(req.body);
      const reading = await storage.createReading(validatedData);
      res.status(201).json(reading);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid reading data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create reading" });
    }
  });

  app.get("/api/readings/:id", async (req, res) => {
    try {
      const reading = await storage.getReading(req.params.id);
      if (!reading) {
        return res.status(404).json({ message: "Reading not found" });
      }
      res.json(reading);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reading" });
    }
  });

  app.get("/api/readings/share/:token", async (req, res) => {
    try {
      const reading = await storage.getReadingByShareToken(req.params.token);
      if (!reading) {
        return res.status(404).json({ message: "Reading not found" });
      }
      res.json(reading);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reading" });
    }
  });

  // Interpretation route
  const interpretRequestSchema = z.object({
    spreadId: z.string(),
    cards: z.array(z.object({
      cardId: z.string(),
      orientation: z.enum(["upright", "reversed"]),
      position: z.number(),
    })),
    options: z.object({
      reversalMode: z.enum(["soft", "strong"]).optional(),
    }).optional(),
  });

  app.post("/api/interpret", async (req, res) => {
    try {
      const { spreadId, cards, options } = interpretRequestSchema.parse(req.body);
      
      // Get spread and cards data
      const spread = await storage.getSpread(spreadId);
      if (!spread) {
        return res.status(404).json({ message: "Spread not found" });
      }

      const allCards = await storage.getAllCards();
      const cardMap = new Map(allCards.map(c => [c.id, c]));

      // Validate all cards exist
      for (const placedCard of cards) {
        if (!cardMap.has(placedCard.cardId)) {
          return res.status(400).json({ message: `Card not found: ${placedCard.cardId}` });
        }
      }

      const combinationRules = await storage.getAllCombinationRules();
      
      // Convert database types to frontend types
      const frontendSpread = convertDbSpreadToFrontendSpread(spread);
      const frontendCards = allCards.map(convertDbCardToFrontendCard);
      const frontendRules = combinationRules.map(convertDbCombinationRuleToFrontendRule);
      
      // Generate interpretation
      const interpretation = await interpretReading(
        frontendSpread,
        cards,
        frontendCards,
        frontendRules,
        options
      );

      res.json(interpretation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid interpretation request", errors: error.errors });
      }
      console.error("Interpretation error:", error);
      res.status(500).json({ message: "Failed to interpret reading" });
    }
  });

  // Seed data route
  app.post("/api/seed", async (req, res) => {
    try {
      // Check admin password
      const adminPass = process.env.ADMIN_PASS || "admin";
      const providedPass = req.body.password;
      
      if (providedPass !== adminPass) {
        return res.status(401).json({ message: "Invalid admin password" });
      }

      // Use TarotSeedData class for proper seeding with validation
      const seedData = new TarotSeedData();
      await seedData.loadData();
      seedData.validateDataIntegrity();
      
      const result = await seedData.seedDatabase();
      
      res.json({
        message: "Seed completed successfully",
        cardsCreated: result.cardsSeeded,
        spreadsCreated: result.spreadsSeeded,
        totalCardsInDb: result.totalCardsInDb,
        totalSpreadsInDb: result.totalSpreadsInDb
      });
    } catch (error) {
      console.error("Seed error:", error);
      res.status(500).json({ message: "Failed to seed database" });
    }
  });

  // Combination rules routes
  app.get("/api/combination-rules", async (req, res) => {
    try {
      const rules = await storage.getAllCombinationRules();
      res.json(rules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch combination rules" });
    }
  });

  app.post("/api/combination-rules", async (req, res) => {
    try {
      const validatedData = insertCombinationRuleSchema.parse(req.body);
      const rule = await storage.createCombinationRule(validatedData);
      res.status(201).json(rule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid rule data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create combination rule" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
