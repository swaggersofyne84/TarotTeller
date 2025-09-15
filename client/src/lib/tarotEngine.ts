import { 
  TarotCard, 
  TarotSpread, 
  PlacedCard, 
  InterpretationResult, 
  CombinationRule,
  InterpretationOptions 
} from "@/types/tarot";

/**
 * Core tarot interpretation engine
 * Uses deterministic rule-based algorithms instead of AI/LLM
 */

export async function interpretReading(
  spread: TarotSpread,
  placedCards: PlacedCard[],
  allCards: TarotCard[],
  combinationRules: CombinationRule[],
  options?: InterpretationOptions
): Promise<InterpretationResult> {
  
  const cardMap = new Map(allCards.map(c => [c.id, c]));
  const reversalMode = options?.reversalMode || "soft";
  
  // Build position interpretations
  const positions = placedCards.map(placedCard => {
    const card = cardMap.get(placedCard.cardId);
    if (!card) throw new Error(`Card not found: ${placedCard.cardId}`);
    
    const position = spread.positions.find(p => p.index === placedCard.position);
    if (!position) throw new Error(`Position not found: ${placedCard.position}`);
    
    const baseInterpretation = getBaseInterpretation(card, placedCard.orientation, reversalMode);
    const positionModifier = getPositionModifier(position, card, placedCard.orientation);
    const adjacencyNotes = getAdjacencyInfluence(placedCards, placedCard, cardMap, spread);
    
    return {
      slotName: position.name,
      cardId: card.id,
      orientation: placedCard.orientation,
      interpretationShort: composeShortInterpretation(position, card, placedCard.orientation, baseInterpretation.short, positionModifier),
      interpretationLong: composeLongInterpretation(position, card, placedCard.orientation, baseInterpretation.long, positionModifier, adjacencyNotes),
    };
  });

  // Generate overall analysis
  const analysis = generateOverallAnalysis(placedCards, cardMap, combinationRules);
  
  return {
    positions,
    overallSummary: analysis.summary,
    keywords: analysis.keywords,
    confidenceHints: analysis.confidenceHints,
    suggestedActions: analysis.suggestedActions,
    dominantSuit: analysis.dominantSuit,
    majorArcanaCount: analysis.majorArcanaCount,
    reversedCount: analysis.reversedCount,
  };
}

function getBaseInterpretation(card: TarotCard, orientation: "upright" | "reversed", reversalMode: "soft" | "strong") {
  if (orientation === "upright") {
    return {
      short: card.uprightShort,
      long: card.uprightLong,
    };
  }
  
  // For reversed cards, modify based on reversal mode
  if (reversalMode === "strong") {
    return {
      short: card.reversedShort,
      long: card.reversedLong,
    };
  } else {
    // Soft reversal - blend upright and reversed meanings
    return {
      short: `${card.reversedShort} (blocked or internal)`,
      long: `${card.reversedLong} The energy of ${card.name} is present but may be blocked, internalized, or manifesting in a subtle way.`,
    };
  }
}

function getPositionModifier(position: any, card: TarotCard, orientation: "upright" | "reversed"): string {
  const roleHint = position.roleHint || "";
  const orientationNote = orientation === "reversed" ? "internal or blocked" : "manifesting externally";
  
  return `As ${position.name.toLowerCase()}, this energy is ${orientationNote} and suggests ${roleHint.toLowerCase()}.`;
}

function getAdjacencyInfluence(
  placedCards: PlacedCard[], 
  currentCard: PlacedCard, 
  cardMap: Map<string, TarotCard>,
  spread: TarotSpread
): string {
  const adjacentCards = getAdjacentCards(placedCards, currentCard, spread);
  const influences: string[] = [];
  
  // Check for suit clustering
  const currentCardData = cardMap.get(currentCard.cardId);
  if (currentCardData?.suit) {
    const sameSuitCount = adjacentCards.filter(adj => {
      const adjCard = cardMap.get(adj.cardId);
      return adjCard?.suit === currentCardData.suit;
    }).length;
    
    if (sameSuitCount >= 2) {
      influences.push(`Strong ${currentCardData.suit} influence emphasizes ${getSuitTheme(currentCardData.suit)}.`);
    }
  }
  
  // Check for Major Arcana clustering
  const majorCount = adjacentCards.filter(adj => {
    const adjCard = cardMap.get(adj.cardId);
    return adjCard?.arcana === "Major";
  }).length;
  
  if (majorCount >= 2) {
    influences.push("Multiple Major Arcana nearby indicate significant life themes and spiritual lessons.");
  }
  
  // Check for reversed card patterns
  const reversedCount = adjacentCards.filter(adj => adj.orientation === "reversed").length;
  if (reversedCount >= 2) {
    influences.push("Surrounded by reversed cards suggests internal work or blocked energies.");
  }
  
  return influences.join(" ");
}

function getAdjacentCards(placedCards: PlacedCard[], currentCard: PlacedCard, spread: TarotSpread): PlacedCard[] {
  // Simple adjacency: cards in positions immediately before/after
  const currentPos = currentCard.position;
  return placedCards.filter(card => 
    card.cardId !== currentCard.cardId && 
    Math.abs(card.position - currentPos) <= 1
  );
}

function getSuitTheme(suit: string): string {
  switch (suit) {
    case "wands": return "passion, creativity, and spiritual growth";
    case "cups": return "emotions, relationships, and intuition";
    case "swords": return "thoughts, communication, and challenges";
    case "pentacles": return "material matters, work, and practical concerns";
    default: return "spiritual and life path themes";
  }
}

function generateOverallAnalysis(
  placedCards: PlacedCard[], 
  cardMap: Map<string, TarotCard>,
  combinationRules: CombinationRule[]
) {
  const cards = placedCards.map(pc => cardMap.get(pc.cardId)!).filter(Boolean);
  
  // Count major arcana
  const majorArcanaCount = cards.filter(c => c.arcana === "Major").length;
  
  // Count reversed cards
  const reversedCount = placedCards.filter(pc => pc.orientation === "reversed").length;
  
  // Analyze dominant suit
  const suitCounts = new Map<string, number>();
  cards.forEach(card => {
    if (card.suit) {
      suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1);
    }
  });
  
  const dominantSuit = [...suitCounts.entries()]
    .sort(([,a], [,b]) => b - a)[0]?.[0];
  
  // Extract keywords
  const allKeywords = cards.flatMap(c => c.keywords);
  const keywordCounts = new Map<string, number>();
  allKeywords.forEach(kw => {
    keywordCounts.set(kw, (keywordCounts.get(kw) || 0) + 1);
  });
  const topKeywords = [...keywordCounts.entries()]
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([kw]) => kw);
  
  // Generate summary
  const summary = generateSummary(majorArcanaCount, dominantSuit, reversedCount, placedCards.length);
  
  // Generate confidence hints
  const confidenceHints = generateConfidenceHints(majorArcanaCount, dominantSuit, reversedCount);
  
  // Generate suggested actions
  const suggestedActions = generateSuggestedActions(majorArcanaCount, dominantSuit, topKeywords);
  
  return {
    summary,
    keywords: topKeywords,
    confidenceHints,
    suggestedActions,
    dominantSuit,
    majorArcanaCount,
    reversedCount,
  };
}

function generateSummary(majorCount: number, dominantSuit?: string, reversedCount?: number, totalCards?: number): string {
  let summary = "";
  
  if (majorCount >= 3) {
    summary += "This reading reveals significant life changes and spiritual themes. ";
  } else if (majorCount >= 1) {
    summary += "Important life lessons and personal growth are highlighted. ";
  }
  
  if (dominantSuit) {
    const theme = getSuitTheme(dominantSuit);
    summary += `The focus is on ${theme}. `;
  }
  
  if (reversedCount && totalCards && reversedCount >= totalCards / 2) {
    summary += "Many reversed cards suggest internal work and reflection are needed. ";
  }
  
  summary += "Trust your intuition as you interpret these messages for your path forward.";
  
  return summary;
}

function generateConfidenceHints(majorCount: number, dominantSuit?: string, reversedCount?: number): string[] {
  const hints: string[] = [];
  
  if (majorCount >= 3) {
    hints.push(`${majorCount} Major Arcana cards detected — reading focuses on significant life themes`);
  }
  
  if (dominantSuit) {
    hints.push(`Dominant suit: ${dominantSuit} — interpretation emphasizes ${getSuitTheme(dominantSuit)}`);
  }
  
  if (reversedCount && reversedCount >= 3) {
    hints.push(`${reversedCount} reversed cards suggest internal processing or blocked energies`);
  }
  
  return hints;
}

function generateSuggestedActions(majorCount: number, dominantSuit?: string, keywords: string[]): string[] {
  const actions: string[] = [];
  
  if (majorCount >= 2) {
    actions.push("Pay attention to synchronicities and signs in your daily life");
  }
  
  if (dominantSuit === "cups") {
    actions.push("Focus on emotional healing and nurturing relationships");
  } else if (dominantSuit === "wands") {
    actions.push("Take inspired action on creative projects and passions");
  } else if (dominantSuit === "swords") {
    actions.push("Practice clear communication and mental clarity");
  } else if (dominantSuit === "pentacles") {
    actions.push("Focus on practical matters and building stable foundations");
  }
  
  if (keywords.includes("balance")) {
    actions.push("Seek balance and moderation in all areas of life");
  }
  
  if (keywords.includes("transformation")) {
    actions.push("Embrace change as an opportunity for growth");
  }
  
  return actions.slice(0, 3); // Limit to top 3 actions
}

function composeShortInterpretation(
  position: any, 
  card: TarotCard, 
  orientation: "upright" | "reversed", 
  baseShort: string, 
  positionModifier: string
): string {
  return `${position.name}: ${card.name} (${orientation}) — ${baseShort}`;
}

function composeLongInterpretation(
  position: any, 
  card: TarotCard, 
  orientation: "upright" | "reversed", 
  baseLong: string, 
  positionModifier: string, 
  adjacencyNotes: string
): string {
  let interpretation = `${card.name} in ${position.name} (${orientation}) — ${baseLong}`;
  
  if (positionModifier) {
    interpretation += ` ${positionModifier}`;
  }
  
  if (adjacencyNotes) {
    interpretation += ` ${adjacencyNotes}`;
  }
  
  return interpretation;
}

// Utility function to shuffle cards for automatic dealing
export function shuffleDeck(cards: TarotCard[]): TarotCard[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Utility function to automatically deal cards to spread positions
export function dealCards(shuffledCards: TarotCard[], spread: TarotSpread): PlacedCard[] {
  return spread.positions.slice(0, shuffledCards.length).map((position, index) => ({
    cardId: shuffledCards[index].id,
    orientation: Math.random() > 0.7 ? "reversed" : "upright", // 30% chance of reversal
    position: position.index,
  }));
}
