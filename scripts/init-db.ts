import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { 
  users, 
  cards, 
  spreads, 
  readings, 
  combinationRules 
} from "../shared/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = postgres(connectionString);
const db = drizzle(sql);

async function createTables() {
  console.log("🔧 Creating database tables...");
  
  try {
    // Create tables using raw SQL since we don't have migrations set up
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        username text NOT NULL UNIQUE,
        password text NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS cards (
        id varchar PRIMARY KEY,
        name text NOT NULL,
        arcana text NOT NULL,
        suit text,
        number integer,
        keywords text[] DEFAULT ARRAY[]::text[],
        upright_short text NOT NULL,
        upright_long text NOT NULL,
        reversed_short text NOT NULL,
        reversed_long text NOT NULL,
        image_url text,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS spreads (
        id varchar PRIMARY KEY,
        name text NOT NULL,
        description text,
        positions jsonb NOT NULL,
        layout_hints jsonb,
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT now()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS readings (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar REFERENCES users(id),
        spread_id varchar REFERENCES spreads(id) NOT NULL,
        title text,
        cards jsonb NOT NULL,
        interpretation jsonb,
        is_public boolean DEFAULT false,
        share_token varchar UNIQUE,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS combination_rules (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        card_ids text[] NOT NULL,
        condition text,
        modifier text NOT NULL,
        weight integer DEFAULT 1,
        is_active boolean DEFAULT true
      );
    `;

    console.log("✅ Database tables created successfully");

  } catch (error) {
    console.error("❌ Error creating tables:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Export for use in other scripts
export { createTables };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createTables().catch(console.error);
}