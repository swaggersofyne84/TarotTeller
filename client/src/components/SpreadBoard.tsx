import { useState, useCallback } from "react";
import { TarotSpread, PlacedCard, Card } from "@/types/tarot";
import TarotCard from "./TarotCard";
import { Button } from "@/components/ui/button";
import { Card as UICard, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RotateCcw, Bookmark, Share2, Wand2, FileText } from "lucide-react";

interface SpreadBoardProps {
  spread: TarotSpread;
  placedCards: PlacedCard[];
  allCards: Card[];
  onCardPlace: (position: number, cardId: string, orientation: "upright" | "reversed") => void;
  onCardToggle: (cardId: string) => void;
  onClearSpread: () => void;
  onSaveReading: () => void;
  onShareReading: () => void;
  onInterpret: () => void;
  onExportPDF: () => void;
}

export default function SpreadBoard({
  spread,
  placedCards,
  allCards,
  onCardPlace,
  onCardToggle,
  onClearSpread,
  onSaveReading,
  onShareReading,
  onInterpret,
  onExportPDF,
}: SpreadBoardProps) {
  const [dragOverPosition, setDragOverPosition] = useState<number | null>(null);

  const cardMap = new Map(allCards.map(c => [c.id, c]));

  const getCardAtPosition = (position: number): PlacedCard | undefined => {
    return placedCards.find(pc => pc.position === position);
  };

  const handleDragOver = useCallback((e: React.DragEvent, position: number) => {
    e.preventDefault();
    setDragOverPosition(position);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverPosition(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, position: number) => {
    e.preventDefault();
    setDragOverPosition(null);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      onCardPlace(position, data.cardId, data.orientation || "upright");
    } catch (error) {
      console.error("Failed to parse drag data:", error);
    }
  }, [onCardPlace]);

  const handleCardClick = (cardId: string) => {
    onCardToggle(cardId);
  };

  const renderCelticCross = () => {
    const positions = spread.positions;
    if (positions.length !== 10) return renderGenericLayout();

    return (
      <div className="relative min-h-[600px] flex items-center justify-center">
        {/* Cross Pattern */}
        <div className="celtic-cross-layout">
          {/* Empty space above cross */}
          <div></div>
          
          {/* Top card (position 2 - Distant Past/Crown) */}
          <div
            className={cn(
              "card-slot bg-muted/30 rounded-lg border-2 border-dashed border-border flex items-center justify-center",
              dragOverPosition === 2 && "drag-over"
            )}
            onDragOver={(e) => handleDragOver(e, 2)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 2)}
            data-testid="card-slot-2"
          >
            {renderCardOrSlot(2)}
          </div>
          
          <div></div>

          {/* Middle row: left (3), center (0&1), right (4) */}
          <div
            className={cn(
              "card-slot bg-muted/30 rounded-lg border-2 border-dashed border-border flex items-center justify-center",
              dragOverPosition === 3 && "drag-over"
            )}
            onDragOver={(e) => handleDragOver(e, 3)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 3)}
            data-testid="card-slot-3"
          >
            {renderCardOrSlot(3)}
          </div>
          
          {/* Center position with main card (0) and crossing card (1) */}
          <div className="relative">
            <div
              className={cn(
                "card-slot bg-muted/30 rounded-lg border-2 border-dashed border-primary mystic-glow flex items-center justify-center",
                dragOverPosition === 0 && "drag-over"
              )}
              onDragOver={(e) => handleDragOver(e, 0)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 0)}
              data-testid="card-slot-0"
            >
              {renderCardOrSlot(0)}
            </div>
            
            {/* Crossing card overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={cn(
                  "w-16 h-10 bg-accent/20 rounded border border-accent/30 transform rotate-90 flex items-center justify-center cursor-pointer",
                  dragOverPosition === 1 && "drag-over"
                )}
                style={{ pointerEvents: "auto" }}
                onDragOver={(e) => handleDragOver(e, 1)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 1)}
                data-testid="card-slot-1"
              >
                {renderCardOrSlot(1, true)}
              </div>
            </div>
          </div>
          
          <div
            className={cn(
              "card-slot bg-muted/30 rounded-lg border-2 border-dashed border-border flex items-center justify-center",
              dragOverPosition === 4 && "drag-over"
            )}
            onDragOver={(e) => handleDragOver(e, 4)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 4)}
            data-testid="card-slot-4"
          >
            {renderCardOrSlot(4)}
          </div>

          {/* Empty space below cross */}
          <div></div>
          
          {/* Bottom card (position 5 - Near Future/Foundation) */}
          <div
            className={cn(
              "card-slot bg-muted/30 rounded-lg border-2 border-dashed border-border flex items-center justify-center",
              dragOverPosition === 5 && "drag-over"
            )}
            onDragOver={(e) => handleDragOver(e, 5)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 5)}
            data-testid="card-slot-5"
          >
            {renderCardOrSlot(5)}
          </div>
          
          <div></div>
        </div>

        {/* Staff of 4 cards on the right */}
        <div className="staff-cards">
          {[6, 7, 8, 9].map((position) => (
            <div
              key={position}
              className={cn(
                "card-slot bg-muted/30 rounded-lg border-2 border-dashed border-border flex items-center justify-center w-24 h-32",
                dragOverPosition === position && "drag-over"
              )}
              onDragOver={(e) => handleDragOver(e, position)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, position)}
              data-testid={`card-slot-${position}`}
            >
              {renderCardOrSlot(position)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderGenericLayout = () => {
    const cols = spread.layoutHints?.cols || Math.ceil(Math.sqrt(spread.positions.length));
    
    return (
      <div 
        className="grid gap-4 justify-center items-center min-h-[400px]"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {spread.positions.map((position) => (
          <div
            key={position.index}
            className={cn(
              "card-slot bg-muted/30 rounded-lg border-2 border-dashed border-border flex items-center justify-center w-24 h-32",
              dragOverPosition === position.index && "drag-over"
            )}
            onDragOver={(e) => handleDragOver(e, position.index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, position.index)}
            data-testid={`card-slot-${position.index}`}
          >
            {renderCardOrSlot(position.index)}
          </div>
        ))}
      </div>
    );
  };

  const renderCardOrSlot = (position: number, isSmall = false) => {
    const placedCard = getCardAtPosition(position);
    
    if (placedCard) {
      const card = cardMap.get(placedCard.cardId);
      if (card) {
        return (
          <TarotCard
            card={card}
            orientation={placedCard.orientation}
            size={isSmall ? "small" : "medium"}
            onClick={() => handleCardClick(placedCard.cardId)}
            draggable={false}
            data-testid={`placed-card-${position}`}
          />
        );
      }
    }
    
    return (
      <div className="text-muted-foreground text-xs text-center p-2">
        <div className="text-2xl mb-1">✨</div>
        <div>Drop card here</div>
        <div className="text-xs mt-1">
          {spread.positions.find(p => p.index === position)?.name}
        </div>
      </div>
    );
  };

  return (
    <UICard className="bg-card border-border overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-serif">
            {spread.name} Reading
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSpread}
              data-testid="button-clear-spread"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSaveReading}
              data-testid="button-save-reading"
            >
              <Bookmark className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onShareReading}
              data-testid="button-share-reading"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8">
        {spread.id === "celtic-cross" ? renderCelticCross() : renderGenericLayout()}
        
        {/* Position Labels */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {spread.positions.slice(0, 6).map((position, index) => (
            <div key={position.index} className="text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
                index === 1 ? "bg-accent" : "bg-primary"
              }`}></div>
              <span className="text-muted-foreground">{position.name}</span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <Button
            onClick={onInterpret}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            disabled={placedCards.length === 0}
            data-testid="button-interpret-reading"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Interpret Reading
          </Button>
          <Button
            onClick={onExportPDF}
            variant="secondary"
            disabled={placedCards.length === 0}
            data-testid="button-export-pdf"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </CardContent>
    </UICard>
  );
}
