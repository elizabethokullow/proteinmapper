import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import MarketMap from "@/components/MarketMap";
import ScoreBadge from "@/components/ScoreBadge";
import { useMarkets, useReports, MarketData } from "@/hooks/useReports";
import { FOOD_TYPES, getAvailabilityLabel } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function LiveMapPage() {
  const { data: markets = [], isLoading: marketsLoading } = useMarkets();
  const { data: reports = [], isLoading: reportsLoading } = useReports();
  const [selected, setSelected] = useState<MarketData | null>(null);

  const isLoading = marketsLoading || reportsLoading;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <div className="container flex-1 py-4 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold">Live Protein Map</h1>
          <p className="text-sm text-muted-foreground">
            Real-time protein accessibility · {reports.length} reports across {markets.length} markets
          </p>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-score-good" /> Good (0.7–1.0)</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-score-limited" /> Limited (0.4–0.7)</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-score-severe" /> Severe (0–0.4)</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <MarketMap
              markets={markets.map(m => ({
                name: m.name,
                latitude: m.latitude,
                longitude: m.longitude,
                proteinScore: m.proteinScore,
                reportCount: m.reportCount,
                verified: m.verified,
                reports: m.reports.map(r => ({
                  id: r.id,
                  marketName: r.market_name,
                  latitude: r.latitude,
                  longitude: r.longitude,
                  foodType: r.food_type,
                  availability: r.availability,
                  price: Number(r.price),
                  reporterId: r.reporter_id,
                  timestamp: r.created_at,
                  validationStatus: r.validation_status,
                })),
              }))}
              onMarketClick={(m) => setSelected(markets.find(mk => mk.name === m.name) || null)}
              height="50vh"
            />

            {/* Market cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {markets.map(m => (
                <button
                  key={m.name}
                  onClick={() => setSelected(selected?.name === m.name ? null : m)}
                  className={`text-left rounded-lg border bg-card p-4 transition-colors ${
                    selected?.name === m.name ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-card-foreground">{m.name}</h3>
                    <ScoreBadge score={m.proteinScore} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {m.reportCount} reports · {m.verified ? "✓ Verified" : "⏳ Pending"}
                  </p>
                </button>
              ))}
            </div>

            {markets.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No reports yet. Be the first NutriScout to submit data!</p>
              </div>
            )}

            {/* Detail panel */}
            {selected && (
              <div className="rounded-lg border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-card-foreground">{selected.name}</h2>
                  <ScoreBadge score={selected.proteinScore} />
                </div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent Reports</h3>
                <div className="space-y-2">
                  {selected.reports.slice(0, 5).map(r => {
                    const food = FOOD_TYPES.find(f => f.value === r.food_type);
                    return (
                      <div key={r.id} className="flex items-center justify-between rounded-md border p-2.5 text-sm">
                        <span>{food?.emoji} {food?.label}</span>
                        <span className="text-muted-foreground">{getAvailabilityLabel(r.availability)}</span>
                        <span className="font-medium">{Number(r.price) > 0 ? `${r.price}` : "—"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
