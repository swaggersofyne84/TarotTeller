import { Card } from "@/types/tarot";
import { DEFAULT_CARD_IMAGE } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface TarotCardProps {
  card: Card;
  orientation?: "upright" | "reversed";
  size?: "small" | "medium" | "large";
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  className?: string;
  showDetails?: boolean;
  draggable?: boolean;
}

export default function TarotCard({
  card,
  orientation = "upright",
  size = "medium",
  onClick,
  onDragStart,
  onDragEnd,
  className,
  showDetails = true,
  draggable = true,
}: TarotCardProps) {
  const sizeClasses = {
    small: "w-16 h-24",
    medium: "w-20 h-32",
    large: "w-24 h-36",
  };

  const imageUrl = card.imageUrl || DEFAULT_CARD_IMAGE;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/json", JSON.stringify({
      cardId: card.id,
      orientation,
    }));
    if (onDragStart) onDragStart(e);
  };

  return (
    <div
      className={cn(
        "tarot-card bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg border border-primary/30 relative overflow-hidden cursor-pointer",
        sizeClasses[size],
        orientation === "reversed" && "reversed",
        className
      )}
      onClick={onClick}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      data-testid={`tarot-card-${card.id}`}
    >
      <img
        src={imageUrl}
        alt={`${card.name} tarot card`}
        className="w-full h-full object-cover rounded"
        loading="lazy"
      />
      
      {showDetails && (
        <div className="absolute bottom-0 left-0 right-0 text-center bg-gradient-to-t from-black/80 to-transparent pt-4 pb-1 rounded-b">
          <span className="text-xs font-semibold text-white px-1">
            {card.name.length > 12 ? card.name.substring(0, 10) + "..." : card.name}
          </span>
        </div>
      )}

      {orientation === "reversed" && (
        <div className="absolute top-1 right-1 w-3 h-3 bg-accent rounded-full flex items-center justify-center">
          <span className="text-xs text-accent-foreground font-bold">R</span>
        </div>
      )}
    </div>
  );
}
