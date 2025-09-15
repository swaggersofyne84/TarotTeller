import { useState } from "react";
import { InterpretationResult } from "@/types/tarot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Copy, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InterpretationPanelProps {
  interpretation?: InterpretationResult;
  isLoading?: boolean;
  onRegenerate?: () => void;
}

export default function InterpretationPanel({
  interpretation,
  isLoading,
  onRegenerate,
}: InterpretationPanelProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopy = async () => {
    if (!interpretation) return;
    
    const text = `
Reading Interpretation
${interpretation.overallSummary}

Individual Cards:
${interpretation.positions.map(pos => 
  `${pos.slotName}: ${pos.cardId} (${pos.orientation}) - ${pos.interpretationShort}`
).join('\n')}

Keywords: ${interpretation.keywords.join(', ')}
Suggested Actions: ${interpretation.suggestedActions.join('. ')}
    `.trim();
    
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Reading interpretation has been copied",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border sticky top-24">
        <CardHeader>
          <CardTitle className="text-xl font-serif text-accent">
            Reading Interpretation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-20 bg-muted rounded"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!interpretation) {
    return (
      <Card className="bg-card border-border sticky top-24">
        <CardHeader>
          <CardTitle className="text-xl font-serif text-accent">
            Reading Interpretation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🔮</div>
            <p className="text-muted-foreground">
              Place cards in the spread and click "Interpret Reading" to see your guidance.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border sticky top-24">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-serif text-accent">
            Reading Interpretation
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              data-testid="button-regenerate-interpretation"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              data-testid="button-copy-interpretation"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Summary */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h3 className="font-semibold mb-3 text-accent">Overall Summary</h3>
          <p className="text-sm leading-relaxed text-muted-foreground" data-testid="text-overall-summary">
            {interpretation.overallSummary}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {interpretation.keywords.map((keyword) => (
              <Badge
                key={keyword}
                variant="secondary"
                className="bg-primary/20 text-primary"
                data-testid={`keyword-${keyword}`}
              >
                {keyword}
              </Badge>
            ))}
          </div>
        </div>

        {/* Individual Card Interpretations */}
        <ScrollArea className="max-h-96 interpretation-scroll">
          <div className="space-y-4 pr-4">
            {interpretation.positions.map((position, index) => (
              <div
                key={`${position.cardId}-${position.slotName}`}
                className={`border-l-4 pl-4 ${
                  index % 2 === 0 ? "border-primary" : "border-accent"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{position.cardId}</h4>
                  <Badge
                    variant="outline"
                    className={index % 2 === 0 ? "border-primary text-primary" : "border-accent text-accent"}
                  >
                    {position.slotName}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed" data-testid={`interpretation-${position.cardId}`}>
                  {expandedCard === position.cardId
                    ? position.interpretationLong
                    : position.interpretationShort}
                </p>
                {position.interpretationLong !== position.interpretationShort && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs text-accent hover:text-accent/80 mt-1"
                    onClick={() => setExpandedCard(
                      expandedCard === position.cardId ? null : position.cardId
                    )}
                    data-testid={`button-expand-${position.cardId}`}
                  >
                    {expandedCard === position.cardId ? "Show Less" : "Read More"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Reading Insights */}
        <div className="pt-6 border-t border-border">
          <h3 className="font-semibold text-sm mb-3">Reading Insights</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Major Arcana Count</span>
              <span className="text-foreground font-medium" data-testid="text-major-count">
                {interpretation.majorArcanaCount}/{interpretation.positions.length}
              </span>
            </div>
            {interpretation.dominantSuit && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Dominant Element</span>
                <span className="text-accent font-medium" data-testid="text-dominant-suit">
                  {interpretation.dominantSuit}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Reversed Cards</span>
              <span className="text-foreground font-medium" data-testid="text-reversed-count">
                {interpretation.reversedCount}/{interpretation.positions.length}
              </span>
            </div>
          </div>
        </div>

        {/* Confidence Hints */}
        {interpretation.confidenceHints.length > 0 && (
          <div className="text-xs text-muted-foreground space-y-1">
            {interpretation.confidenceHints.map((hint, index) => (
              <div key={index} className="flex items-start" data-testid={`confidence-hint-${index}`}>
                <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 mr-2 flex-shrink-0"></div>
                <span>{hint}</span>
              </div>
            ))}
          </div>
        )}

        {/* Suggested Actions */}
        {interpretation.suggestedActions.length > 0 && (
          <div className="p-4 bg-accent/10 rounded-lg">
            <h3 className="font-semibold text-sm text-accent mb-2">Suggested Actions</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              {interpretation.suggestedActions.map((action, index) => (
                <li key={index} className="flex items-start" data-testid={`suggested-action-${index}`}>
                  <ArrowRight className="w-3 h-3 text-accent mt-0.5 mr-2 flex-shrink-0" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
