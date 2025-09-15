// Default placeholder image for tarot cards
export const DEFAULT_CARD_IMAGE = "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=500";

// Card suits
export const SUITS = {
  WANDS: "wands",
  CUPS: "cups", 
  SWORDS: "swords",
  PENTACLES: "pentacles",
} as const;

// Arcana types
export const ARCANA = {
  MAJOR: "Major",
  MINOR: "Minor",
} as const;

// Card orientations
export const ORIENTATIONS = {
  UPRIGHT: "upright",
  REVERSED: "reversed",
} as const;

// Position roles for spreads
export const POSITION_ROLES = {
  PRESENT: "present",
  PAST: "past",
  FUTURE: "future",
  CHALLENGE: "challenge",
  FOUNDATION: "foundation",
  OUTCOME: "outcome",
  SELF: "self",
  ENVIRONMENT: "environment",
  HOPES_FEARS: "hopes_fears",
  FINAL_OUTCOME: "final_outcome",
} as const;

// Reversal interpretation modes
export const REVERSAL_MODES = {
  SOFT: "soft", // Subtle modifications to upright meaning
  STRONG: "strong", // Strong opposition or blockage
} as const;

// Default interpretation templates
export const INTERPRETATION_TEMPLATES = {
  SHORT: "[PositionName]: [CardName] ([orientation]) — [BaseShort]. In this position it suggests [PositionModifier].",
  LONG: "[CardName] in [PositionName] ([orientation]) — [BaseLong]. [AdjacencyNotes] [ConcreteAdvice]",
} as const;

// Confidence thresholds for interpretation quality
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.6,
  LOW: 0.4,
} as const;

// Maximum cards for different spread types
export const MAX_CARDS = {
  THREE_CARD: 3,
  CELTIC_CROSS: 10,
  HORSESHOE: 7,
  RELATIONSHIP: 5,
  NINE_CARD: 9,
} as const;
