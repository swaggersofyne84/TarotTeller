export interface TarotCard {
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

export interface SpreadPosition {
  index: number;
  name: string;
  roleHint: string;
  x?: number;
  y?: number;
}

export interface TarotSpread {
  id: string;
  name: string;
  description?: string;
  positions: SpreadPosition[];
  layoutHints?: {
    rows?: number;
    cols?: number;
    type?: string;
  };
}

export interface PlacedCard {
  cardId: string;
  orientation: "upright" | "reversed";
  position: number;
  x?: number;
  y?: number;
}

export interface Reading {
  id: string;
  spreadId: string;
  title?: string;
  cards: PlacedCard[];
  interpretation?: InterpretationResult;
  isPublic: boolean;
  shareToken?: string;
  createdAt: Date;
}

export interface InterpretationResult {
  positions: Array<{
    slotName: string;
    cardId: string;
    orientation: "upright" | "reversed";
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
}

export interface CombinationRule {
  id: string;
  name: string;
  cardIds: string[];
  condition: string;
  modifier: string;
  weight: number;
  isActive: boolean;
}

export interface InterpretationOptions {
  reversalMode?: "soft" | "strong";
}
