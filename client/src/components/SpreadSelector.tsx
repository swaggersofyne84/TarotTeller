import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TarotSpread } from "@/types/tarot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shuffle, Hand } from "lucide-react";

interface SpreadSelectorProps {
  selectedSpreadId?: string;
  onSpreadSelect: (spread: TarotSpread) => void;
  onShuffleAndDeal: () => void;
  onManualSelection: () => void;
  remainingCards?: number;
}

export default function SpreadSelector({
  selectedSpreadId,
  onSpreadSelect,
  onShuffleAndDeal,
  onManualSelection,
  remainingCards = 68,
}: SpreadSelectorProps) {
  const { data: spreads = [], isLoading } = useQuery<TarotSpread[]>({
    queryKey: ["/api/spreads"],
  });

  const handleSpreadClick = (spread: TarotSpread) => {
    onSpreadSelect(spread);
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border sticky top-24">
      <CardHeader>
        <CardTitle className="text-xl font-serif text-accent">
          Choose Your Spread
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {spreads.map((spread) => (
          <div
            key={spread.id}
            className={`spread-option p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedSpreadId === spread.id
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => handleSpreadClick(spread)}
            data-testid={`spread-option-${spread.id}`}
          >
            <h3 className={`font-semibold ${
              selectedSpreadId === spread.id ? "text-primary" : "text-foreground"
            }`}>
              {spread.name}
            </h3>
            {spread.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {spread.description}
              </p>
            )}
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                {spread.positions.length} positions
              </span>
              {selectedSpreadId === spread.id && (
                <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary-foreground"></div>
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="space-y-3 pt-4">
          <Button
            onClick={onShuffleAndDeal}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
            disabled={!selectedSpreadId}
            data-testid="button-shuffle-deal"
          >
            <Shuffle className="w-4 h-4 mr-2" />
            Shuffle & Deal
          </Button>
          <Button
            onClick={onManualSelection}
            variant="secondary"
            className="w-full"
            data-testid="button-manual-selection"
          >
            <Hand className="w-4 h-4 mr-2" />
            Manual Selection
          </Button>
        </div>

        <div className="pt-6 border-t border-border">
          <h3 className="font-semibold text-sm mb-3">Deck Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Rider-Waite Deck</span>
              <span className="text-foreground">78 cards</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Remaining</span>
              <span className="text-accent font-medium" data-testid="text-remaining-cards">
                {remainingCards} cards
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
