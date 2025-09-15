import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/types/tarot";
import TarotCard from "./TarotCard";
import { Card as UICard, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Settings } from "lucide-react";

interface CardLibraryProps {
  usedCardIds?: string[];
}

export default function CardLibrary({ usedCardIds = [] }: CardLibraryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const { data: cards = [], isLoading } = useQuery<Card[]>({
    queryKey: ["/api/cards"],
  });

  const filteredCards = useMemo(() => {
    let filtered = cards;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(card =>
        card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.keywords.some(keyword => 
          keyword.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply type filter
    if (selectedFilter !== "all") {
      if (selectedFilter === "major") {
        filtered = filtered.filter(card => card.arcana === "Major");
      } else {
        filtered = filtered.filter(card => card.suit === selectedFilter);
      }
    }

    // Sort by arcana and number
    filtered.sort((a, b) => {
      if (a.arcana !== b.arcana) {
        return a.arcana === "Major" ? -1 : 1;
      }
      if (a.arcana === "Major") {
        return (a.number || 0) - (b.number || 0);
      }
      if (a.suit !== b.suit) {
        return (a.suit || "").localeCompare(b.suit || "");
      }
      return (a.number || 0) - (b.number || 0);
    });

    return filtered;
  }, [cards, searchTerm, selectedFilter]);

  const handleCardDragStart = (e: React.DragEvent, card: Card) => {
    e.dataTransfer.setData("application/json", JSON.stringify({
      cardId: card.id,
      orientation: "upright",
    }));
  };

  const availableCards = filteredCards.filter(card => !usedCardIds.includes(card.id));

  if (isLoading) {
    return (
      <UICard className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl font-serif">Card Library</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-3">
              {Array(16).fill(0).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </UICard>
    );
  }

  return (
    <UICard className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-serif">Card Library</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-32" data-testid="select-card-filter">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cards</SelectItem>
                  <SelectItem value="major">Major Arcana</SelectItem>
                  <SelectItem value="wands">Wands</SelectItem>
                  <SelectItem value="cups">Cups</SelectItem>
                  <SelectItem value="swords">Swords</SelectItem>
                  <SelectItem value="pentacles">Pentacles</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-48"
                data-testid="input-search-cards"
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-3 mb-6">
          {availableCards.slice(0, 32).map((card) => (
            <TarotCard
              key={card.id}
              card={card}
              size="small"
              onDragStart={(e) => handleCardDragStart(e, card)}
              className="hover:scale-105 transition-transform"
              data-testid={`library-card-${card.id}`}
            />
          ))}
          
          {availableCards.length > 32 && (
            <div className="col-span-3 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="text-2xl mb-2">⋯</div>
                <p className="text-xs">+{availableCards.length - 32} more cards</p>
                <Button variant="link" className="mt-2 text-xs text-accent hover:text-accent/80">
                  View All
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Drag cards to spread positions or click for details
          </span>
          <div className="flex items-center space-x-4">
            <span className="text-muted-foreground">
              Showing {Math.min(availableCards.length, 32)} of {availableCards.length} cards
            </span>
            <Button
              variant="outline"
              size="sm"
              className="bg-primary/10 text-primary hover:bg-primary/20"
              data-testid="button-card-settings"
            >
              <Settings className="w-4 h-4 mr-2" />
              Card Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </UICard>
  );
}
