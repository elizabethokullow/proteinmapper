import { useEffect, useRef } from "react";
import L from "leaflet";
import { Market, getScoreCategory } from "@/lib/types";

interface MarketMapProps {
  markets: Market[];
  onMarketClick?: (market: Market) => void;
  height?: string;
}

const markerColors = {
  good: "#22c55e",
  limited: "#eab308",
  severe: "#ef4444",
};

export default function MarketMap({ markets, onMarketClick, height = "400px" }: MarketMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([-1.955, 30.08], 13);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org">OSM</a>',
      maxZoom: 18,
    }).addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    map.eachLayer(layer => {
      if (layer instanceof L.CircleMarker) map.removeLayer(layer);
    });

    markets.forEach(market => {
      const cat = getScoreCategory(market.proteinScore);
      const color = markerColors[cat];

      const marker = L.circleMarker([market.latitude, market.longitude], {
        radius: 12,
        fillColor: color,
        color: color,
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.6,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family:system-ui;min-width:160px">
          <strong style="font-size:14px">${market.name}</strong><br/>
          <span style="color:${color};font-weight:600">Score: ${market.proteinScore.toFixed(2)}</span><br/>
          <span style="font-size:12px;color:#666">${market.reportCount} reports ${market.verified ? "✓ Verified" : "⏳ Pending"}</span>
        </div>
      `);

      if (onMarketClick) {
        marker.on("click", () => onMarketClick(market));
      }
    });
  }, [markets, onMarketClick]);

  return <div ref={mapRef} style={{ height, width: "100%" }} className="rounded-lg overflow-hidden border" />;
}
