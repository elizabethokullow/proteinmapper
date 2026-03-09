import { useMemo } from "react";
import AppHeader from "@/components/AppHeader";
import ScoreBadge from "@/components/ScoreBadge";
import { useReports, useReporters, useMarkets, type MarketData } from "@/hooks/useReports";
import { FOOD_TYPES, getScoreCategory } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, TrendingDown, TrendingUp, Activity, DollarSign, ShieldAlert, BarChart3, Loader2 } from "lucide-react";

const DAILY_INCOME_KSH = 65; // Kenya low-income daily income baseline

interface PAIData {
  market: string;
  food: string;
  foodEmoji: string;
  price: number;
  pai: number;
  status: "affordable" | "strained" | "high_risk";
}

interface NutritionAlert {
  type: "critical" | "warning" | "info";
  title: string;
  message: string;
  icon: typeof AlertTriangle;
}

function getPAIStatus(pai: number): "affordable" | "strained" | "high_risk" {
  if (pai < 0.2) return "affordable";
  if (pai <= 0.35) return "strained";
  return "high_risk";
}

function getPAILabel(status: "affordable" | "strained" | "high_risk") {
  if (status === "affordable") return "Affordable";
  if (status === "strained") return "Strained";
  return "High Risk";
}

function getPAIColor(status: "affordable" | "strained" | "high_risk") {
  if (status === "affordable") return "text-score-good";
  if (status === "strained") return "text-score-limited";
  return "text-score-severe";
}

export default function InsightsPage() {
  const { data: reports = [], isLoading: rLoading } = useReports();
  const { data: reporters = [] } = useReporters();
  const { data: markets = [], isLoading: mLoading } = useMarkets();

  const isLoading = rLoading || mLoading;

  // Calculate PAI for each market-food combination
  const paiData = useMemo<PAIData[]>(() => {
    const grouped: Record<string, { prices: number[]; food: string }> = {};
    reports.forEach(r => {
      if (Number(r.price) > 0) {
        const key = `${r.market_name}||${r.food_type}`;
        if (!grouped[key]) grouped[key] = { prices: [], food: r.food_type };
        grouped[key].prices.push(Number(r.price));
      }
    });

    return Object.entries(grouped).map(([key, data]) => {
      const [market] = key.split("||");
      const avgPrice = data.prices.reduce((a, b) => a + b, 0) / data.prices.length;
      const pai = avgPrice / DAILY_INCOME_KSH;
      const foodInfo = FOOD_TYPES.find(f => f.value === data.food);
      return {
        market,
        food: foodInfo?.label || data.food,
        foodEmoji: foodInfo?.emoji || "🍽️",
        price: Math.round(avgPrice),
        pai: Math.round(pai * 100) / 100,
        status: getPAIStatus(pai),
      };
    }).sort((a, b) => b.pai - a.pai);
  }, [reports]);

  // Generate nutrition risk alerts
  const alerts = useMemo<NutritionAlert[]>(() => {
    const result: NutritionAlert[] = [];

    // Alert: markets with severe protein access
    markets.forEach(m => {
      if (m.proteinScore < 0.4) {
        result.push({
          type: "critical",
          title: `Severe protein shortage: ${m.name}`,
          message: `Protein accessibility score dropped to ${m.proteinScore.toFixed(2)}. Immediate attention needed for vulnerable families in this area.`,
          icon: ShieldAlert,
        });
      }
    });

    // Alert: high-risk PAI items
    const highRiskItems = paiData.filter(p => p.status === "high_risk");
    if (highRiskItems.length > 0) {
      const marketNames = [...new Set(highRiskItems.map(h => h.market))];
      result.push({
        type: "critical",
        title: `Protein affordability crisis in ${marketNames.length} market${marketNames.length > 1 ? "s" : ""}`,
        message: `${highRiskItems.length} protein items exceed affordable thresholds (PAI > 0.35). Most affected: ${marketNames.slice(0, 3).join(", ")}.`,
        icon: DollarSign,
      });
    }

    // Alert: unavailable food types
    const unavailableByMarket: Record<string, string[]> = {};
    reports.forEach(r => {
      if (r.availability === "not_available") {
        if (!unavailableByMarket[r.market_name]) unavailableByMarket[r.market_name] = [];
        const foodLabel = FOOD_TYPES.find(f => f.value === r.food_type)?.label || r.food_type;
        if (!unavailableByMarket[r.market_name].includes(foodLabel)) {
          unavailableByMarket[r.market_name].push(foodLabel);
        }
      }
    });

    const marketsWithUnavailable = Object.entries(unavailableByMarket).filter(([, foods]) => foods.length >= 2);
    if (marketsWithUnavailable.length > 0) {
      result.push({
        type: "warning",
        title: `Multiple proteins unavailable in ${marketsWithUnavailable.length} markets`,
        message: marketsWithUnavailable.map(([m, foods]) => `${m}: ${foods.join(", ")}`).join(" · "),
        icon: AlertTriangle,
      });
    }

    // Alert: limited access markets
    const limitedMarkets = markets.filter(m => m.proteinScore >= 0.4 && m.proteinScore < 0.7);
    if (limitedMarkets.length > 0) {
      result.push({
        type: "info",
        title: `${limitedMarkets.length} markets with limited protein access`,
        message: `Markets at risk: ${limitedMarkets.map(m => `${m.name} (${m.proteinScore.toFixed(2)})`).join(", ")}. Monitoring recommended.`,
        icon: Activity,
      });
    }

    // Insight: best performing market
    const bestMarket = markets.reduce<MarketData | null>((best, m) => (!best || m.proteinScore > best.proteinScore) ? m : best, null);
    if (bestMarket) {
      result.push({
        type: "info",
        title: `Best protein access: ${bestMarket.name}`,
        message: `Score: ${bestMarket.proteinScore.toFixed(2)} with ${bestMarket.reportCount} reports. Good model for other markets.`,
        icon: TrendingUp,
      });
    }

    return result;
  }, [markets, paiData, reports]);

  // Generate text insights
  const insights = useMemo(() => {
    const result: string[] = [];

    // Price insights by food type
    const priceByFood: Record<string, number[]> = {};
    reports.forEach(r => {
      if (Number(r.price) > 0) {
        if (!priceByFood[r.food_type]) priceByFood[r.food_type] = [];
        priceByFood[r.food_type].push(Number(r.price));
      }
    });

    Object.entries(priceByFood).forEach(([food, prices]) => {
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const max = Math.max(...prices);
      const min = Math.min(...prices);
      const spread = ((max - min) / avg * 100).toFixed(0);
      const foodInfo = FOOD_TYPES.find(f => f.value === food);
      if (Number(spread) > 30) {
        result.push(`${foodInfo?.emoji} ${foodInfo?.label} prices vary ${spread}% across markets (KSh ${min}–${max}), indicating supply chain inconsistency.`);
      }
    });

    // High-risk PAI insight
    const highRiskEggs = paiData.filter(p => p.food === "Eggs" && p.status === "high_risk");
    if (highRiskEggs.length > 0) {
      result.push(`🥚 Egg affordability is critical in ${highRiskEggs.map(h => h.market).join(", ")}. PAI exceeds 0.35, making eggs unaffordable for low-income households.`);
    }

    // Availability insight
    const totalReports = reports.length;
    const unavailable = reports.filter(r => r.availability === "not_available").length;
    const pctUnavailable = ((unavailable / totalReports) * 100).toFixed(0);
    result.push(`📊 ${pctUnavailable}% of all reports indicate protein foods are completely unavailable, highlighting critical supply gaps in Kenya's informal markets.`);

    // Market coverage insight
    const nairobiMarkets = markets.filter(m => m.latitude < -1.0 && m.longitude > 36);
    const migoriMarkets = markets.filter(m => m.longitude < 35);
    result.push(`🗺️ Coverage: ${nairobiMarkets.length} markets mapped in Nairobi, ${migoriMarkets.length} in Migori County. ${reports.length} total reports from ${new Set(reports.map(r => r.reporter_id)).size} NutriScouts.`);

    // Score distribution
    const severe = markets.filter(m => getScoreCategory(m.proteinScore) === "severe").length;
    const limited = markets.filter(m => getScoreCategory(m.proteinScore) === "limited").length;
    const good = markets.filter(m => getScoreCategory(m.proteinScore) === "good").length;
    result.push(`🏥 Protein access: ${good} markets with good access, ${limited} with limited access, ${severe} with severe shortage. ${severe > 0 ? "Urgent intervention needed." : ""}`);

    return result;
  }, [reports, markets, paiData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container py-6 space-y-6">
        {/* Hero */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nutrition Intelligence</h1>
          <p className="text-sm text-muted-foreground">
            Real-time insights from {reports.length} reports across {markets.length} markets in Kenya
          </p>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Markets</div>
              <div className="text-2xl font-bold text-card-foreground">{markets.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground flex items-center gap-1"><Activity className="h-3 w-3" /> Reports</div>
              <div className="text-2xl font-bold text-card-foreground">{reports.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> High Risk PAI</div>
              <div className="text-2xl font-bold text-score-severe">{paiData.filter(p => p.status === "high_risk").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground flex items-center gap-1"><ShieldAlert className="h-3 w-3" /> Alerts</div>
              <div className="text-2xl font-bold text-score-limited">{alerts.filter(a => a.type === "critical").length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Nutrition Risk Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-score-severe" />
              Automated Nutrition Risk Alerts
            </CardTitle>
            <CardDescription>Real-time alerts generated from community data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert, i) => (
              <Alert key={i} variant={alert.type === "critical" ? "destructive" : "default"} className={alert.type === "warning" ? "border-score-limited/50" : ""}>
                <alert.icon className="h-4 w-4" />
                <AlertTitle>{alert.title}</AlertTitle>
                <AlertDescription className="text-xs mt-1">{alert.message}</AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>

        {/* Protein Affordability Index */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Protein Affordability Index (PAI)
            </CardTitle>
            <CardDescription>
              PAI = price of protein portion ÷ daily income (KSh {DAILY_INCOME_KSH})
              <span className="block mt-1 text-xs">
                &lt;0.2 = Affordable · 0.2–0.35 = Strained · &gt;0.35 = High Risk
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground">Market</th>
                    <th className="pb-2 font-medium text-muted-foreground">Food</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Price (KSh)</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">PAI</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paiData.slice(0, 20).map((item, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2 text-card-foreground">{item.market}</td>
                      <td className="py-2">{item.foodEmoji} {item.food}</td>
                      <td className="py-2 text-right text-card-foreground">{item.price}</td>
                      <td className={`py-2 text-right font-semibold ${getPAIColor(item.status)}`}>{item.pai.toFixed(2)}</td>
                      <td className="py-2 text-right">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.status === "affordable" ? "score-badge-good" :
                          item.status === "strained" ? "score-badge-limited" :
                          "score-badge-severe"
                        }`}>
                          {getPAILabel(item.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Generated Insights */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-primary" />
              Intelligence Insights
            </CardTitle>
            <CardDescription>Actionable intelligence generated from market data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.map((insight, i) => (
              <div key={i} className="rounded-lg border bg-muted/30 p-3 text-sm text-card-foreground leading-relaxed">
                {insight}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Market Scores Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Market Protein Accessibility Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {markets.map(m => (
                <div key={m.name} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <span className="font-medium text-card-foreground">{m.name}</span>
                    <p className="text-xs text-muted-foreground">{m.reportCount} reports · {m.verified ? "✓ Verified" : "⏳ Pending"}</p>
                  </div>
                  <ScoreBadge score={m.proteinScore} size="sm" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Value Proposition */}
        <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-6 text-center">
          <p className="text-lg font-semibold text-card-foreground leading-relaxed">
            ProteinMapper turns community market observations<br />
            into <span className="text-primary">real-time intelligence about child nutrition risk.</span>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {markets.length} markets · {reports.length} reports · {new Set(reports.map(r => r.reporter_id)).size} NutriScouts · Kenya
          </p>
        </div>
      </div>
    </div>
  );
}
