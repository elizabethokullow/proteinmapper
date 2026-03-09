import { useMemo } from "react";
import AppHeader from "@/components/AppHeader";
import { useReports, useMarkets } from "@/hooks/useReports";
import { FOOD_TYPES } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from "recharts";
import { Loader2, TrendingUp } from "lucide-react";

const SCORE_COLORS = {
  good: "hsl(142, 71%, 45%)",
  limited: "hsl(45, 93%, 55%)",
  severe: "hsl(0, 72%, 51%)",
};

const FOOD_COLORS: Record<string, string> = {
  eggs: "#f59e0b",
  beans: "#84cc16",
  fish: "#06b6d4",
  milk: "#8b5cf6",
  meat: "#ef4444",
};

export default function TrendsPage() {
  const { data: reports = [], isLoading: rLoading } = useReports();
  const { data: markets = [], isLoading: mLoading } = useMarkets();
  const isLoading = rLoading || mLoading;

  // Price trends by food type (grouped by date)
  const priceTrends = useMemo(() => {
    const byDate: Record<string, Record<string, { sum: number; count: number }>> = {};
    reports.forEach(r => {
      if (Number(r.price) <= 0) return;
      const date = new Date(r.created_at).toISOString().split("T")[0];
      if (!byDate[date]) byDate[date] = {};
      if (!byDate[date][r.food_type]) byDate[date][r.food_type] = { sum: 0, count: 0 };
      byDate[date][r.food_type].sum += Number(r.price);
      byDate[date][r.food_type].count++;
    });

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, foods]) => {
        const row: Record<string, any> = { date: new Date(date).toLocaleDateString("en-KE", { month: "short", day: "numeric" }) };
        Object.entries(foods).forEach(([food, { sum, count }]) => {
          row[food] = Math.round(sum / count);
        });
        return row;
      });
  }, [reports]);

  // Availability distribution by market
  const availabilityByMarket = useMemo(() => {
    const byMarket: Record<string, { available: number; limited: number; not_available: number }> = {};
    reports.forEach(r => {
      if (!byMarket[r.market_name]) byMarket[r.market_name] = { available: 0, limited: 0, not_available: 0 };
      byMarket[r.market_name][r.availability]++;
    });
    return Object.entries(byMarket).map(([name, counts]) => ({
      name: name.replace(" Market", ""),
      ...counts,
    }));
  }, [reports]);

  // Food type distribution
  const foodDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => {
      counts[r.food_type] = (counts[r.food_type] || 0) + 1;
    });
    return Object.entries(counts).map(([food, count]) => {
      const info = FOOD_TYPES.find(f => f.value === food);
      return { name: `${info?.emoji} ${info?.label}`, value: count, food };
    });
  }, [reports]);

  // Market scores
  const marketScores = useMemo(() => {
    return markets.map(m => ({
      name: m.name.replace(" Market", ""),
      score: m.proteinScore,
      reports: m.reportCount,
      fill: m.proteinScore >= 0.7 ? SCORE_COLORS.good : m.proteinScore >= 0.4 ? SCORE_COLORS.limited : SCORE_COLORS.severe,
    })).sort((a, b) => b.score - a.score);
  }, [markets]);

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
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Trend Analysis
          </h1>
          <p className="text-sm text-muted-foreground">
            Protein price trends, availability patterns, and market performance over time
          </p>
        </div>

        {/* Price Trends */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Protein Price Trends (KSh)</CardTitle>
            <CardDescription>Average prices by food type over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Legend />
                  {FOOD_TYPES.map(f => (
                    <Line
                      key={f.value}
                      type="monotone"
                      dataKey={f.value}
                      name={`${f.emoji} ${f.label}`}
                      stroke={FOOD_COLORS[f.value]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Market Protein Scores */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Market Protein Scores</CardTitle>
              <CardDescription>Protein accessibility score by market (0–1)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={marketScores} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [value.toFixed(2), "Score"]}
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                      {marketScores.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Food Type Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Reports by Food Type</CardTitle>
              <CardDescription>Distribution of reports across protein categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={foodDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name} (${value})`}
                      labelLine={{ stroke: "hsl(var(--muted-foreground))" }}
                    >
                      {foodDistribution.map((entry) => (
                        <Cell key={entry.food} fill={FOOD_COLORS[entry.food]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Availability by Market */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Availability Status by Market</CardTitle>
            <CardDescription>Breakdown of protein availability reports per market</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={availabilityByMarket}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Legend />
                  <Bar dataKey="available" name="Available" fill={SCORE_COLORS.good} stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="limited" name="Limited" fill={SCORE_COLORS.limited} stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="not_available" name="Not Available" fill={SCORE_COLORS.severe} stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
