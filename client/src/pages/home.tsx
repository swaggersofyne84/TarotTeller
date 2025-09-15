import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TarotSpread, PlacedCard, Card, InterpretationResult } from "@/types/tarot";
import { apiRequest } from "@/lib/queryClient";
import { shuffleDeck, dealCards } from "@/lib/tarotEngine";
import { useToast } from "@/hooks/use-toast";

import SpreadSelector from "@/components/SpreadSelector";
import SpreadBoard from "@/components/SpreadBoard";
import InterpretationPanel from "@/components/InterpretationPanel";
import CardLibrary from "@/components/CardLibrary";
import ReadingHistory from "@/components/ReadingHistory";

import { Button } from "@/components/ui/button";
import { Eye, Moon, UserCircle, Plus } from "lucide-react";

export default function Home() {
  const [selectedSpread, setSelectedSpread] = useState<TarotSpread | null>(null);
  const [placedCards, setPlacedCards] = useState<PlacedCard[]>([]);
  const [interpretation, setInterpretation] = useState<InterpretationResult | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cards = [] } = useQuery<Card[]>({
    queryKey: ["/api/cards"],
  });

  const interpretMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/interpret", data);
      return response.json();
    },
    onSuccess: (result: InterpretationResult) => {
      setInterpretation(result);
      toast({
        title: "Reading interpreted",
        description: "Your tarot reading has been analyzed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Interpretation failed",
        description: error.message || "Failed to interpret reading",
        variant: "destructive",
      });
    },
  });

  const handleSpreadSelect = (spread: TarotSpread) => {
    setSelectedSpread(spread);
    setPlacedCards([]);
    setInterpretation(null);
    setIsManualMode(false);
  };

  const handleShuffleAndDeal = () => {
    if (!selectedSpread || cards.length === 0) return;

    const shuffled = shuffleDeck(cards);
    const dealt = dealCards(shuffled, selectedSpread);
    setPlacedCards(dealt);
    setInterpretation(null);
    setIsManualMode(false);

    toast({
      title: "Cards dealt",
      description: `${dealt.length} cards have been placed in the spread`,
    });
  };

  const handleManualSelection = () => {
    setIsManualMode(true);
    setPlacedCards([]);
    setInterpretation(null);
    
    toast({
      title: "Manual mode enabled",
      description: "Drag cards from the library to the spread positions",
    });
  };

  const handleCardPlace = (position: number, cardId: string, orientation: "upright" | "reversed") => {
    const existingCardIndex = placedCards.findIndex(pc => pc.position === position);
    const isCardAlreadyPlaced = placedCards.some(pc => pc.cardId === cardId);

    if (isCardAlreadyPlaced) {
      toast({
        title: "Card already in use",
        description: "This card is already placed in the spread",
        variant: "destructive",
      });
      return;
    }

    const newPlacedCards = [...placedCards];
    const newCard: PlacedCard = { cardId, orientation, position };

    if (existingCardIndex >= 0) {
      newPlacedCards[existingCardIndex] = newCard;
    } else {
      newPlacedCards.push(newCard);
    }

    setPlacedCards(newPlacedCards);
    setInterpretation(null); // Clear interpretation when cards change
  };

  const handleCardToggle = (cardId: string) => {
    setPlacedCards(prev =>
      prev.map(pc =>
        pc.cardId === cardId
          ? { ...pc, orientation: pc.orientation === "upright" ? "reversed" : "upright" }
          : pc
      )
    );
    setInterpretation(null); // Clear interpretation when orientation changes
  };

  const handleClearSpread = () => {
    setPlacedCards([]);
    setInterpretation(null);
    toast({
      title: "Spread cleared",
      description: "All cards have been removed from the spread",
    });
  };

  const handleInterpret = () => {
    if (!selectedSpread || placedCards.length === 0) return;

    interpretMutation.mutate({
      spreadId: selectedSpread.id,
      cards: placedCards,
      options: { reversalMode: "soft" },
    });
  };

  const handleSaveReading = () => {
    // TODO: Implement save functionality
    toast({
      title: "Save reading",
      description: "This feature will be implemented soon",
    });
  };

  const handleShareReading = () => {
    // TODO: Implement share functionality
    toast({
      title: "Share reading",
      description: "This feature will be implemented soon",
    });
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    toast({
      title: "Export PDF",
      description: "This feature will be implemented soon",
    });
  };

  const usedCardIds = placedCards.map(pc => pc.cardId);
  const remainingCards = cards.length - usedCardIds.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Eye className="text-accent text-2xl" />
                <h1 className="text-2xl font-serif font-semibold">Tarot Decoder</h1>
              </div>
              <nav className="hidden md:flex space-x-6">
                <a href="#" className="text-foreground hover:text-accent transition-colors">Readings</a>
                <a href="#" className="text-muted-foreground hover:text-accent transition-colors">Spreads</a>
                <a href="#" className="text-muted-foreground hover:text-accent transition-colors">Card Library</a>
                <a href="#" className="text-muted-foreground hover:text-accent transition-colors">History</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Moon className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <UserCircle className="w-4 h-4" />
              </Button>
              <div className="hidden md:block w-px h-6 bg-border"></div>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                New Reading
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Spread Selector */}
          <div className="xl:col-span-1">
            <SpreadSelector
              selectedSpreadId={selectedSpread?.id}
              onSpreadSelect={handleSpreadSelect}
              onShuffleAndDeal={handleShuffleAndDeal}
              onManualSelection={handleManualSelection}
              remainingCards={remainingCards}
            />
          </div>

          {/* Main Reading Area */}
          <div className="xl:col-span-2">
            {selectedSpread ? (
              <SpreadBoard
                spread={selectedSpread}
                placedCards={placedCards}
                allCards={cards}
                onCardPlace={handleCardPlace}
                onCardToggle={handleCardToggle}
                onClearSpread={handleClearSpread}
                onSaveReading={handleSaveReading}
                onShareReading={handleShareReading}
                onInterpret={handleInterpret}
                onExportPDF={handleExportPDF}
              />
            ) : (
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <div className="text-6xl mb-4">🔮</div>
                <h2 className="text-2xl font-serif mb-4">Welcome to Tarot Decoder</h2>
                <p className="text-muted-foreground">
                  Select a spread from the sidebar to begin your tarot reading journey.
                </p>
              </div>
            )}
          </div>

          {/* Interpretation Panel */}
          <div className="xl:col-span-1">
            <InterpretationPanel
              interpretation={interpretation}
              isLoading={interpretMutation.isPending}
              onRegenerate={handleInterpret}
            />
          </div>
        </div>

        {/* Card Library */}
        <div className="mt-12">
          <CardLibrary usedCardIds={usedCardIds} />
        </div>

        {/* Reading History */}
        <div className="mt-12">
          <ReadingHistory />
        </div>
      </div>

      {/* Floating Action Menu */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
        <Button
          size="lg"
          className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all hover:scale-110"
          title="New reading"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
