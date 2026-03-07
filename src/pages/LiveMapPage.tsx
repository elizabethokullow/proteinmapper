import { useState, useMemo } from "react";
import AppHeader from "@/components/AppHeader";
import MarketMap from "@/components/MarketMap";
import ScoreBadge from "@/components/ScoreBadge";
import { mockReports, getMarkets } from "@/lib/mockData";
import { Market, getAvailabilityLabel, FOOD_TYPES } from "@/lib/types";

export default function LiveMapPage() {
  const markets = useMemo(() => getMarkets(mockReports), []);
  const [selected, setSelected] = useState<Market | null>(null);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <div className="container flex-1 py-4 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold">Live Protein Map</h1>
          <p className="text-sm text-muted-foreground">Real-time protein accessibility across markets</p>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-score-good" /> Good</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-score-limited" /> Limited</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-score-severe" /> Severe</span>
        </div>

        <MarketMap markets={markets} onMarketClick={setSelected} height="50vh" />

        {/* Market list */}
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
                const food = FOOD_TYPES.find(f => f.value === r.foodType);
                return (
                  <div key={r.id} className="flex items-center justify-between rounded-md border p-2.5 text-sm">
                    <span>{food?.emoji} {food?.label}</span>
                    <span className="text-muted-foreground">{getAvailabilityLabel(r.availability)}</span>
                    <span className="font-medium">{r.price > 0 ? `${r.price}` : "—"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
