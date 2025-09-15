import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Spread, CombinationRule } from "@/types/tarot";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card as UICard, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

import { Eye, Plus, Edit, Trash2, Database, Save, ArrowLeft } from "lucide-react";

const cardSchema = z.object({
  id: z.string().min(1, "Card ID is required"),
  name: z.string().min(1, "Card name is required"),
  arcana: z.enum(["Major", "Minor"]),
  suit: z.string().optional(),
  number: z.number().optional(),
  keywords: z.array(z.string()).default([]),
  uprightShort: z.string().min(1, "Upright short description is required"),
  uprightLong: z.string().min(1, "Upright long description is required"),
  reversedShort: z.string().min(1, "Reversed short description is required"),
  reversedLong: z.string().min(1, "Reversed long description is required"),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

const spreadSchema = z.object({
  id: z.string().min(1, "Spread ID is required"),
  name: z.string().min(1, "Spread name is required"),
  description: z.string().optional(),
  positions: z.array(z.object({
    index: z.number(),
    name: z.string(),
    roleHint: z.string(),
  })),
  layoutHints: z.object({
    rows: z.number().optional(),
    cols: z.number().optional(),
    type: z.string().optional(),
  }).optional(),
});

const combinationRuleSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  cardIds: z.array(z.string()).min(1, "At least one card is required"),
  condition: z.string().min(1, "Condition is required"),
  modifier: z.string().min(1, "Modifier text is required"),
  weight: z.number().min(1).max(10).default(1),
});

export default function Admin() {
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("cards");
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [editingSpread, setEditingSpread] = useState<Spread | null>(null);
  const [keywordsInput, setKeywordsInput] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: cards = [], isLoading: cardsLoading } = useQuery<Card[]>({
    queryKey: ["/api/cards"],
    enabled: isAuthenticated,
  });

  const { data: spreads = [], isLoading: spreadsLoading } = useQuery<Spread[]>({
    queryKey: ["/api/spreads"],
    enabled: isAuthenticated,
  });

  const { data: combinationRules = [], isLoading: rulesLoading } = useQuery<CombinationRule[]>({
    queryKey: ["/api/combination-rules"],
    enabled: isAuthenticated,
  });

  // Seed mutation
  const seedMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await apiRequest("POST", "/api/seed", { password });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Database seeded successfully",
        description: `Created ${data.cardsCreated} cards and ${data.spreadsCreated} spreads`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/spreads"] });
    },
    onError: (error: any) => {
      toast({
        title: "Seed failed",
        description: error.message || "Failed to seed database",
        variant: "destructive",
      });
    },
  });

  // Card mutations
  const cardMutation = useMutation({
    mutationFn: async (data: { card: any; isEdit: boolean }) => {
      const url = data.isEdit ? `/api/cards/${data.card.id}` : "/api/cards";
      const method = data.isEdit ? "PUT" : "POST";
      const response = await apiRequest(method, url, data.card);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
      setEditingCard(null);
      toast({
        title: editingCard ? "Card updated" : "Card created",
        description: "Changes saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save card",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Spread mutations
  const spreadMutation = useMutation({
    mutationFn: async (data: { spread: any; isEdit: boolean }) => {
      const url = data.isEdit ? `/api/spreads/${data.spread.id}` : "/api/spreads";
      const method = data.isEdit ? "PUT" : "POST";
      const response = await apiRequest(method, url, data.spread);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spreads"] });
      setEditingSpread(null);
      toast({
        title: editingSpread ? "Spread updated" : "Spread created",
        description: "Changes saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save spread",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Combination rule mutation
  const ruleMutation = useMutation({
    mutationFn: async (rule: any) => {
      const response = await apiRequest("POST", "/api/combination-rules", rule);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/combination-rules"] });
      toast({
        title: "Rule created",
        description: "Combination rule added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create rule",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Forms
  const cardForm = useForm({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      id: "",
      name: "",
      arcana: "Major" as const,
      suit: "",
      number: 0,
      keywords: [],
      uprightShort: "",
      uprightLong: "",
      reversedShort: "",
      reversedLong: "",
      imageUrl: "",
    },
  });

  const spreadForm = useForm({
    resolver: zodResolver(spreadSchema),
    defaultValues: {
      id: "",
      name: "",
      description: "",
      positions: [],
      layoutHints: { rows: 3, cols: 3 },
    },
  });

  const ruleForm = useForm({
    resolver: zodResolver(combinationRuleSchema),
    defaultValues: {
      name: "",
      cardIds: [],
      condition: "",
      modifier: "",
      weight: 1,
    },
  });

  const handleLogin = () => {
    const adminPass = import.meta.env.VITE_ADMIN_PASS || "admin";
    if (adminPassword === adminPass) {
      setIsAuthenticated(true);
      toast({
        title: "Access granted",
        description: "Welcome to the admin panel",
      });
    } else {
      toast({
        title: "Access denied",
        description: "Invalid admin password",
        variant: "destructive",
      });
    }
  };

  const handleSeedDatabase = () => {
    seedMutation.mutate(adminPassword);
  };

  const handleCardSubmit = (data: any) => {
    const processedData = {
      ...data,
      keywords: keywordsInput.split(",").map(k => k.trim()).filter(Boolean),
      suit: data.arcana === "Major" ? null : data.suit,
      number: data.arcana === "Major" ? data.number : (data.number || null),
    };
    
    cardMutation.mutate({
      card: processedData,
      isEdit: !!editingCard,
    });
  };

  const handleSpreadSubmit = (data: any) => {
    spreadMutation.mutate({
      spread: data,
      isEdit: !!editingSpread,
    });
  };

  const handleRuleSubmit = (data: any) => {
    ruleMutation.mutate(data);
    ruleForm.reset();
  };

  const startEditCard = (card: Card) => {
    setEditingCard(card);
    cardForm.reset({
      ...card,
      suit: card.suit || "",
      number: card.number || 0,
      imageUrl: card.imageUrl || "",
    });
    setKeywordsInput(card.keywords.join(", "));
    setActiveTab("cards");
  };

  const startEditSpread = (spread: Spread) => {
    setEditingSpread(spread);
    spreadForm.reset({
      ...spread,
      description: spread.description || "",
    });
    setActiveTab("spreads");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <UICard className="w-full max-w-md bg-card border-border">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Eye className="text-accent text-2xl" />
              <CardTitle className="text-2xl font-serif">Admin Access</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Enter admin password"
                data-testid="input-admin-password"
              />
            </div>
            <Button 
              onClick={handleLogin} 
              className="w-full bg-primary hover:bg-primary/90"
              data-testid="button-admin-login"
            >
              Access Admin Panel
            </Button>
          </CardContent>
        </UICard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => window.location.href = "/"}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to App
              </Button>
              <div className="flex items-center space-x-2">
                <Eye className="text-accent text-2xl" />
                <h1 className="text-2xl font-serif font-semibold">Admin Panel</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="bg-accent/10 text-accent hover:bg-accent/20"
                    disabled={seedMutation.isPending}
                    data-testid="button-seed-database"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    {seedMutation.isPending ? "Seeding..." : "Seed Database"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Seed Database</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will populate the database with the complete 78-card Rider-Waite tarot deck and predefined spreads. 
                      Existing data will not be overwritten.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSeedDatabase}>
                      Seed Database
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cards" data-testid="tab-cards">Cards ({cards.length})</TabsTrigger>
            <TabsTrigger value="spreads" data-testid="tab-spreads">Spreads ({spreads.length})</TabsTrigger>
            <TabsTrigger value="rules" data-testid="tab-rules">Rules ({combinationRules.length})</TabsTrigger>
          </TabsList>

          {/* Cards Tab */}
          <TabsContent value="cards" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Card Form */}
              <UICard className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {editingCard ? "Edit Card" : "Add New Card"}
                    {editingCard && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingCard(null);
                          cardForm.reset();
                          setKeywordsInput("");
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={cardForm.handleSubmit(handleCardSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="card-id">Card ID</Label>
                        <Input
                          id="card-id"
                          {...cardForm.register("id")}
                          placeholder="e.g., major-0, wands-1"
                          data-testid="input-card-id"
                        />
                        {cardForm.formState.errors.id && (
                          <p className="text-sm text-destructive mt-1">
                            {cardForm.formState.errors.id.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="card-name">Name</Label>
                        <Input
                          id="card-name"
                          {...cardForm.register("name")}
                          placeholder="e.g., The Fool, Ace of Wands"
                          data-testid="input-card-name"
                        />
                        {cardForm.formState.errors.name && (
                          <p className="text-sm text-destructive mt-1">
                            {cardForm.formState.errors.name.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="card-arcana">Arcana</Label>
                        <Select
                          value={cardForm.watch("arcana")}
                          onValueChange={(value) => cardForm.setValue("arcana", value as "Major" | "Minor")}
                        >
                          <SelectTrigger data-testid="select-card-arcana">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Major">Major Arcana</SelectItem>
                            <SelectItem value="Minor">Minor Arcana</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {cardForm.watch("arcana") === "Minor" && (
                        <div>
                          <Label htmlFor="card-suit">Suit</Label>
                          <Select
                            value={cardForm.watch("suit")}
                            onValueChange={(value) => cardForm.setValue("suit", value)}
                          >
                            <SelectTrigger data-testid="select-card-suit">
                              <SelectValue placeholder="Select suit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="wands">Wands</SelectItem>
                              <SelectItem value="cups">Cups</SelectItem>
                              <SelectItem value="swords">Swords</SelectItem>
                              <SelectItem value="pentacles">Pentacles</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div>
                        <Label htmlFor="card-number">Number</Label>
                        <Input
                          id="card-number"
                          type="number"
                          {...cardForm.register("number", { valueAsNumber: true })}
                          placeholder="0-21 for Major, 1-14 for Minor"
                          data-testid="input-card-number"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="card-keywords">Keywords (comma-separated)</Label>
                      <Input
                        id="card-keywords"
                        value={keywordsInput}
                        onChange={(e) => setKeywordsInput(e.target.value)}
                        placeholder="e.g., new beginnings, innocence, spontaneity"
                        data-testid="input-card-keywords"
                      />
                    </div>

                    <div>
                      <Label htmlFor="card-image">Image URL</Label>
                      <Input
                        id="card-image"
                        {...cardForm.register("imageUrl")}
                        placeholder="https://example.com/card-image.jpg"
                        data-testid="input-card-image"
                      />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="upright-short">Upright Short</Label>
                        <Textarea
                          id="upright-short"
                          {...cardForm.register("uprightShort")}
                          placeholder="Brief upright meaning (1-2 sentences)"
                          rows={2}
                          data-testid="textarea-upright-short"
                        />
                      </div>
                      <div>
                        <Label htmlFor="upright-long">Upright Long</Label>
                        <Textarea
                          id="upright-long"
                          {...cardForm.register("uprightLong")}
                          placeholder="Detailed upright interpretation"
                          rows={3}
                          data-testid="textarea-upright-long"
                        />
                      </div>
                      <div>
                        <Label htmlFor="reversed-short">Reversed Short</Label>
                        <Textarea
                          id="reversed-short"
                          {...cardForm.register("reversedShort")}
                          placeholder="Brief reversed meaning (1-2 sentences)"
                          rows={2}
                          data-testid="textarea-reversed-short"
                        />
                      </div>
                      <div>
                        <Label htmlFor="reversed-long">Reversed Long</Label>
                        <Textarea
                          id="reversed-long"
                          {...cardForm.register("reversedLong")}
                          placeholder="Detailed reversed interpretation"
                          rows={3}
                          data-testid="textarea-reversed-long"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90"
                      disabled={cardMutation.isPending}
                      data-testid="button-save-card"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {cardMutation.isPending ? "Saving..." : editingCard ? "Update Card" : "Create Card"}
                    </Button>
                  </form>
                </CardContent>
              </UICard>

              {/* Cards List */}
              <UICard className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Existing Cards</CardTitle>
                </CardHeader>
                <CardContent>
                  {cardsLoading ? (
                    <div className="space-y-4">
                      {Array(5).fill(0).map((_, i) => (
                        <div key={i} className="animate-pulse bg-muted rounded p-4 h-20"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {cards.map((card) => (
                        <div
                          key={card.id}
                          className="flex items-center justify-between p-3 rounded border border-border hover:bg-muted/20"
                        >
                          <div>
                            <div className="font-semibold">{card.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {card.arcana} {card.suit && `• ${card.suit}`} {card.number !== null && `• ${card.number}`}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {card.keywords.slice(0, 3).map((keyword) => (
                                <Badge key={keyword} variant="outline" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditCard(card)}
                            data-testid={`button-edit-card-${card.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </UICard>
            </div>
          </TabsContent>

          {/* Spreads Tab */}
          <TabsContent value="spreads" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Spread Form */}
              <UICard className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {editingSpread ? "Edit Spread" : "Add New Spread"}
                    {editingSpread && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingSpread(null);
                          spreadForm.reset();
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={spreadForm.handleSubmit(handleSpreadSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="spread-id">Spread ID</Label>
                        <Input
                          id="spread-id"
                          {...spreadForm.register("id")}
                          placeholder="e.g., celtic-cross, three-card"
                          data-testid="input-spread-id"
                        />
                      </div>
                      <div>
                        <Label htmlFor="spread-name">Name</Label>
                        <Input
                          id="spread-name"
                          {...spreadForm.register("name")}
                          placeholder="e.g., Celtic Cross, Three Card Draw"
                          data-testid="input-spread-name"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="spread-description">Description</Label>
                      <Textarea
                        id="spread-description"
                        {...spreadForm.register("description")}
                        placeholder="Brief description of the spread"
                        rows={2}
                        data-testid="textarea-spread-description"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="layout-rows">Layout Rows</Label>
                        <Input
                          id="layout-rows"
                          type="number"
                          {...spreadForm.register("layoutHints.rows", { valueAsNumber: true })}
                          placeholder="3"
                          data-testid="input-layout-rows"
                        />
                      </div>
                      <div>
                        <Label htmlFor="layout-cols">Layout Columns</Label>
                        <Input
                          id="layout-cols"
                          type="number"
                          {...spreadForm.register("layoutHints.cols", { valueAsNumber: true })}
                          placeholder="3"
                          data-testid="input-layout-cols"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90"
                      disabled={spreadMutation.isPending}
                      data-testid="button-save-spread"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {spreadMutation.isPending ? "Saving..." : editingSpread ? "Update Spread" : "Create Spread"}
                    </Button>
                  </form>
                </CardContent>
              </UICard>

              {/* Spreads List */}
              <UICard className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Existing Spreads</CardTitle>
                </CardHeader>
                <CardContent>
                  {spreadsLoading ? (
                    <div className="space-y-4">
                      {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="animate-pulse bg-muted rounded p-4 h-20"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {spreads.map((spread) => (
                        <div
                          key={spread.id}
                          className="flex items-center justify-between p-3 rounded border border-border hover:bg-muted/20"
                        >
                          <div>
                            <div className="font-semibold">{spread.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {spread.positions.length} positions
                              {spread.description && ` • ${spread.description.slice(0, 50)}...`}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditSpread(spread)}
                            data-testid={`button-edit-spread-${spread.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </UICard>
            </div>
          </TabsContent>

          {/* Combination Rules Tab */}
          <TabsContent value="rules" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Rule Form */}
              <UICard className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Add Combination Rule</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={ruleForm.handleSubmit(handleRuleSubmit)} className="space-y-4">
                    <div>
                      <Label htmlFor="rule-name">Rule Name</Label>
                      <Input
                        id="rule-name"
                        {...ruleForm.register("name")}
                        placeholder="e.g., Sun + Empress Abundance"
                        data-testid="input-rule-name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="rule-condition">Condition</Label>
                      <Select
                        value={ruleForm.watch("condition")}
                        onValueChange={(value) => ruleForm.setValue("condition", value)}
                      >
                        <SelectTrigger data-testid="select-rule-condition">
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="adjacent">Adjacent cards</SelectItem>
                          <SelectItem value="any_position">Any position</SelectItem>
                          <SelectItem value="same_spread">Same spread</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="rule-modifier">Modifier Text</Label>
                      <Textarea
                        id="rule-modifier"
                        {...ruleForm.register("modifier")}
                        placeholder="Interpretation modifier when this combination appears"
                        rows={3}
                        data-testid="textarea-rule-modifier"
                      />
                    </div>

                    <div>
                      <Label htmlFor="rule-weight">Weight (1-10)</Label>
                      <Input
                        id="rule-weight"
                        type="number"
                        min="1"
                        max="10"
                        {...ruleForm.register("weight", { valueAsNumber: true })}
                        data-testid="input-rule-weight"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90"
                      disabled={ruleMutation.isPending}
                      data-testid="button-save-rule"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {ruleMutation.isPending ? "Creating..." : "Create Rule"}
                    </Button>
                  </form>
                </CardContent>
              </UICard>

              {/* Rules List */}
              <UICard className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Existing Rules</CardTitle>
                </CardHeader>
                <CardContent>
                  {rulesLoading ? (
                    <div className="space-y-4">
                      {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="animate-pulse bg-muted rounded p-4 h-16"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {combinationRules.map((rule) => (
                        <div
                          key={rule.id}
                          className="p-3 rounded border border-border hover:bg-muted/20"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold">{rule.name}</div>
                            <Badge variant="outline">Weight: {rule.weight}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mb-1">
                            Condition: {rule.condition}
                          </div>
                          <div className="text-sm">{rule.modifier}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </UICard>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
