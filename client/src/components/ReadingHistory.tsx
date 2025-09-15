import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Reading } from "@/types/tarot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface ReadingHistoryProps {
  userId?: string;
  limit?: number;
}

export default function ReadingHistory({ userId, limit = 3 }: ReadingHistoryProps) {
  const { data: readings = [], isLoading } = useQuery<Reading[]>({
    queryKey: userId ? ["/api/readings", userId] : ["/api/readings"],
    enabled: !!userId,
  });

  const limitedReadings = readings.slice(0, limit);

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl font-serif">Recent Readings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted/20 rounded-lg p-4 border border-border">
                  <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
                  <div className="h-12 bg-muted rounded mb-3"></div>
                  <div className="flex items-center justify-between">
                    <div className="h-3 bg-muted rounded w-16"></div>
                    <div className="h-6 bg-muted rounded w-12"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (limitedReadings.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl font-serif">Recent Readings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📜</div>
            <p className="text-muted-foreground">No readings yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Create your first tarot reading to see it here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getReadingPreview = (reading: Reading): string => {
    if (reading.interpretation?.overallSummary) {
      return reading.interpretation.overallSummary.slice(0, 100) + "...";
    }
    return `A ${reading.cards.length}-card reading awaiting interpretation`;
  };

  const getReadingColors = (reading: Reading): { primary: string; secondary: string; accent: string } => {
    // Generate consistent colors based on reading ID
    const hash = reading.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      { primary: "bg-accent", secondary: "bg-primary", accent: "bg-accent" },
      { primary: "bg-primary", secondary: "bg-accent", accent: "bg-primary" },
      { primary: "bg-accent", secondary: "bg-accent", accent: "bg-primary" },
    ];
    return colors[hash % colors.length];
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-serif">Recent Readings</CardTitle>
          <Button variant="link" className="text-accent hover:text-accent/80">
            View All History
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {limitedReadings.map((reading) => {
            const colors = getReadingColors(reading);
            
            return (
              <div
                key={reading.id}
                className="bg-muted/20 rounded-lg p-4 border border-border hover:border-primary/30 cursor-pointer transition-colors"
                data-testid={`reading-card-${reading.id}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">
                    {reading.title || `${reading.spreadId} Reading`}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(reading.createdAt), { addSuffix: true })}
                  </span>
                </div>
                
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  {getReadingPreview(reading)}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex space-x-1">
                    {reading.cards.slice(0, 3).map((_, index) => (
                      <span
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === 0 ? colors.primary : 
                          index === 1 ? colors.secondary : colors.accent
                        }`}
                      ></span>
                    ))}
                    {reading.cards.length > 3 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        +{reading.cards.length - 3}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {reading.isPublic && (
                      <Badge variant="outline" className="text-xs">
                        Public
                      </Badge>
                    )}
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                      data-testid={`button-open-reading-${reading.id}`}
                    >
                      Open
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
