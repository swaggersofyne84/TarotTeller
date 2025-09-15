import fs from 'fs';
import path from 'path';
import { storage } from '../server/storage';

/**
 * Database seeding script for Tarot Decoder
 * This script loads and validates the tarot.json and spreads.json data files
 * and can be used to seed a database with the complete tarot deck and spread definitions
 */

interface TarotCard {
  id: string;
  name: string;
  arcana: "Major" | "Minor";
  suit?: string;
  number?: number;
  keywords: string[];
  uprightShort: string;
  uprightLong: string;
  reversedShort: string;
  reversedLong: string;
  imageUrl?: string;
}

interface SpreadPosition {
  index: number;
  name: string;
  roleHint: string;
  x?: number;
  y?: number;
}

interface TarotSpread {
  id: string;
  name: string;
  description?: string;
  positions: SpreadPosition[];
  layoutHints?: {
    rows?: number;
    cols?: number;
    type?: string;
  };
  isActive: boolean;
}

class SeedDataValidator {
  validateCard(card: any, index: number): card is TarotCard {
    const errors: string[] = [];

    if (!card.id || typeof card.id !== 'string') {
      errors.push(`Card ${index}: Missing or invalid id`);
    }

    if (!card.name || typeof card.name !== 'string') {
      errors.push(`Card ${index}: Missing or invalid name`);
    }

    if (!['Major', 'Minor'].includes(card.arcana)) {
      errors.push(`Card ${index}: arcana must be 'Major' or 'Minor'`);
    }

    if (card.arcana === 'Minor' && !card.suit) {
      errors.push(`Card ${index}: Minor Arcana cards must have a suit`);
    }

    if (card.arcana === 'Major' && typeof card.number !== 'number') {
      errors.push(`Card ${index}: Major Arcana cards must have a number (0-21)`);
    }

    if (!Array.isArray(card.keywords)) {
      errors.push(`Card ${index}: keywords must be an array`);
    }

    const requiredTextFields = ['uprightShort', 'uprightLong', 'reversedShort', 'reversedLong'];
    for (const field of requiredTextFields) {
      if (!card[field] || typeof card[field] !== 'string') {
        errors.push(`Card ${index}: Missing or invalid ${field}`);
      }
    }

    if (errors.length > 0) {
      console.error(`Validation errors for card ${index}:`, errors);
      return false;
    }

    return true;
  }

  validateSpread(spread: any, index: number): spread is TarotSpread {
    const errors: string[] = [];

    if (!spread.id || typeof spread.id !== 'string') {
      errors.push(`Spread ${index}: Missing or invalid id`);
    }

    if (!spread.name || typeof spread.name !== 'string') {
      errors.push(`Spread ${index}: Missing or invalid name`);
    }

    if (!Array.isArray(spread.positions) || spread.positions.length === 0) {
      errors.push(`Spread ${index}: positions must be a non-empty array`);
    } else {
      spread.positions.forEach((pos: any, posIndex: number) => {
        if (typeof pos.index !== 'number') {
          errors.push(`Spread ${index}, Position ${posIndex}: Missing or invalid index`);
        }
        if (!pos.name || typeof pos.name !== 'string') {
          errors.push(`Spread ${index}, Position ${posIndex}: Missing or invalid name`);
        }
        if (!pos.roleHint || typeof pos.roleHint !== 'string') {
          errors.push(`Spread ${index}, Position ${posIndex}: Missing or invalid roleHint`);
        }
      });
    }

    if (typeof spread.isActive !== 'boolean') {
      errors.push(`Spread ${index}: isActive must be a boolean`);
    }

    if (errors.length > 0) {
      console.error(`Validation errors for spread ${index}:`, errors);
      return false;
    }

    return true;
  }
}

class TarotSeedData {
  private cards: TarotCard[] = [];
  private spreads: TarotSpread[] = [];
  private validator = new SeedDataValidator();

  async loadData() {
    try {
      // Load cards data
      const cardsPath = path.join(process.cwd(), 'data', 'tarot.json');
      const cardsData = JSON.parse(fs.readFileSync(cardsPath, 'utf-8'));
      
      if (!Array.isArray(cardsData)) {
        throw new Error('tarot.json must contain an array of cards');
      }

      // Validate and filter cards
      this.cards = cardsData.filter((card, index) => 
        this.validator.validateCard(card, index)
      );

      console.log(`✅ Loaded and validated ${this.cards.length} cards`);

      // Load spreads data
      const spreadsPath = path.join(process.cwd(), 'data', 'spreads.json');
      const spreadsData = JSON.parse(fs.readFileSync(spreadsPath, 'utf-8'));
      
      if (!Array.isArray(spreadsData)) {
        throw new Error('spreads.json must contain an array of spreads');
      }

      // Validate and filter spreads
      this.spreads = spreadsData.filter((spread, index) => 
        this.validator.validateSpread(spread, index)
      );

      console.log(`✅ Loaded and validated ${this.spreads.length} spreads`);

    } catch (error) {
      console.error('❌ Error loading seed data:', error);
      throw error;
    }
  }

  validateDataIntegrity() {
    console.log('\n📊 Data Integrity Report:');
    
    // Check for complete Major Arcana (0-21)
    const majorArcana = this.cards.filter(card => card.arcana === 'Major');
    const majorNumbers = majorArcana.map(card => card.number).sort((a, b) => (a || 0) - (b || 0));
    
    console.log(`Major Arcana: ${majorArcana.length}/22 cards`);
    const expectedMajor = Array.from({length: 22}, (_, i) => i);
    const missingMajor = expectedMajor.filter(num => !majorNumbers.includes(num));
    if (missingMajor.length > 0) {
      console.log(`⚠️  Missing Major Arcana: ${missingMajor.join(', ')}`);
    }

    // Check Minor Arcana suits
    const suits = ['wands', 'cups', 'swords', 'pentacles'];
    suits.forEach(suit => {
      const suitCards = this.cards.filter(card => card.suit === suit);
      console.log(`${suit.charAt(0).toUpperCase() + suit.slice(1)}: ${suitCards.length}/14 cards`);
      
      if (suitCards.length !== 14) {
        const suitNumbers = suitCards.map(card => card.number).sort((a, b) => (a || 0) - (b || 0));
        const expectedMinor = Array.from({length: 14}, (_, i) => i + 1);
        const missing = expectedMinor.filter(num => !suitNumbers.includes(num));
        if (missing.length > 0) {
          console.log(`⚠️  Missing ${suit} cards: ${missing.join(', ')}`);
        }
      }
    });

    // Check for duplicate card IDs
    const cardIds = this.cards.map(card => card.id);
    const duplicateIds = cardIds.filter((id, index) => cardIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      console.log(`⚠️  Duplicate card IDs: ${duplicateIds.join(', ')}`);
    }

    // Check spread position continuity
    this.spreads.forEach(spread => {
      const positions = spread.positions.map(pos => pos.index).sort((a, b) => a - b);
      const expected = Array.from({length: positions.length}, (_, i) => i);
      const gaps = expected.filter(num => !positions.includes(num));
      if (gaps.length > 0) {
        console.log(`⚠️  Spread "${spread.name}" has position gaps: ${gaps.join(', ')}`);
      }
    });

    console.log('\n✅ Data integrity check complete\n');
  }

  getCards(): TarotCard[] {
    return this.cards;
  }

  getSpreads(): TarotSpread[] {
    return this.spreads;
  }

  getStats() {
    return {
      totalCards: this.cards.length,
      majorArcana: this.cards.filter(card => card.arcana === 'Major').length,
      minorArcana: this.cards.filter(card => card.arcana === 'Minor').length,
      totalSpreads: this.spreads.length,
      activeSpreads: this.spreads.filter(spread => spread.isActive).length,
    };
  }

  // Database seeding method
  async seedDatabase() {
    console.log('🌱 Starting database seeding...');
    
    try {
      // Seed cards
      console.log('📚 Seeding cards...');
      let cardsSeedCount = 0;
      for (const card of this.cards) {
        try {
          await storage.createCard({
            id: card.id,
            name: card.name,
            arcana: card.arcana,
            suit: card.suit || null,
            number: card.number || 0,
            keywords: card.keywords,
            uprightShort: card.uprightShort,
            uprightLong: card.uprightLong,
            reversedShort: card.reversedShort,
            reversedLong: card.reversedLong,
            imageUrl: card.imageUrl || null,
          });
          cardsSeedCount++;
          console.log(`  ✓ ${card.name}`);
        } catch (error) {
          console.log(`  ⚠ ${card.name} (already exists or error)`);
        }
      }
      
      // Seed spreads
      console.log('🔮 Seeding spreads...');
      let spreadsSeedCount = 0;
      for (const spread of this.spreads) {
        try {
          await storage.createSpread({
            id: spread.id,
            name: spread.name,
            description: spread.description || null,
            positions: spread.positions,
            layoutHints: spread.layoutHints || null,
            isActive: spread.isActive,
          });
          spreadsSeedCount++;
          console.log(`  ✓ ${spread.name}`);
        } catch (error) {
          console.log(`  ⚠ ${spread.name} (already exists or error)`);
        }
      }
      
      console.log(`\n✅ Seeding completed successfully!`);
      console.log(`   Cards seeded: ${cardsSeedCount}/${this.cards.length}`);
      console.log(`   Spreads seeded: ${spreadsSeedCount}/${this.spreads.length}`);
      
      // Verify by counting database contents
      const dbCards = await storage.getAllCards();
      const dbSpreads = await storage.getAllSpreads();
      console.log(`\n📊 Database verification:`);
      console.log(`   Total cards in database: ${dbCards.length}`);
      console.log(`   Total spreads in database: ${dbSpreads.length}`);
      
      return {
        success: true,
        cardsSeeded: cardsSeedCount,
        spreadsSeeded: spreadsSeedCount,
        totalCardsInDb: dbCards.length,
        totalSpreadsInDb: dbSpreads.length,
      };
      
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    }
  }

  // Export method for use with APIs
  exportForAPI() {
    return {
      cards: this.cards,
      spreads: this.spreads,
      stats: this.getStats(),
    };
  }
}

// Main execution function
async function main() {
  console.log('🔮 Tarot Decoder - Database Seeder\n');
  
  try {
    const seedData = new TarotSeedData();
    await seedData.loadData();
    seedData.validateDataIntegrity();
    
    const stats = seedData.getStats();
    console.log('📈 Data Statistics:');
    console.log(`Total Cards: ${stats.totalCards}`);
    console.log(`Major Arcana: ${stats.majorArcana}`);
    console.log(`Minor Arcana: ${stats.minorArcana}`);
    console.log(`Total Spreads: ${stats.totalSpreads}`);
    console.log(`Active Spreads: ${stats.activeSpreads}`);
    
    // Perform database seeding
    const result = await seedData.seedDatabase();
    
    console.log('\n✨ Database seeding process completed!');
    return result;
    
  } catch (error) {
    console.error('💥 Seed process failed:', error);
    process.exit(1);
  }
}

// Export for use in other modules
export { TarotSeedData, SeedDataValidator };
export type { TarotCard, TarotSpread, SpreadPosition };

// Run if called directly
if (require.main === module) {
  main();
}
