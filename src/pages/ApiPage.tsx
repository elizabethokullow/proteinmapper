import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, Copy, ExternalLink, Database, Globe } from "lucide-react";
import { toast } from "sonner";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || "abwlpjebaqrrruvopnmj";
const BASE_URL = `https://${PROJECT_ID}.supabase.co/functions/v1`;

const endpoints = [
  {
    name: "Protein Access",
    path: "/protein-access",
    desc: "Aggregated protein accessibility scores for all markets",
    example: `{
  "markets": [
    {
      "market": "Kibera Market",
      "protein_score": 0.41,
      "affordability_index": 0.32,
      "reports": 12,
      "verified": true,
      "region": "Nairobi"
    }
  ],
  "total_markets": 10,
  "total_reports": 100,
  "generated_at": "2026-03-09T..."
}`,
  },
  {
    name: "Market Reports",
    path: "/market-reports",
    desc: "All submitted market reports with food availability data",
    example: `{
  "reports": [
    {
      "id": "uuid",
      "market_name": "Kibera Market",
      "food_type": "eggs",
      "availability": "limited",
      "price": 18,
      "validation_status": "verified",
      "created_at": "2026-03-09T..."
    }
  ],
  "total": 100
}`,
  },
  {
    name: "Protein Affordability",
    path: "/protein-affordability",
    desc: "Protein Affordability Index (PAI) data per market and food type",
    example: `{
  "affordability": [
    {
      "market": "Kibera Market",
      "food_type": "eggs",
      "avg_price": 18,
      "pai": 0.28,
      "status": "strained",
      "daily_income_baseline": 65
    }
  ],
  "methodology": "PAI = avg_price / daily_income (KSh 65)"
}`,
  },
];

export default function ApiPage() {
  const copyUrl = (path: string) => {
    navigator.clipboard.writeText(`${BASE_URL}${path}`);
    toast.success("URL copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Open Data API</h1>
          <p className="text-sm text-muted-foreground">
            Digital Public Goods — Free access to protein accessibility data for NGOs, governments, and researchers
          </p>
        </div>

        <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-5">
          <div className="flex items-start gap-3">
            <Globe className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h2 className="font-semibold text-card-foreground">Open Data for Impact</h2>
              <p className="text-sm text-muted-foreground mt-1">
                ProteinMapper data is freely available as a Digital Public Good. 
                Use these endpoints to integrate protein accessibility intelligence into your systems.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {endpoints.map(ep => (
            <Card key={ep.path}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    {ep.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyUrl(ep.path)}>
                      <Copy className="h-3 w-3 mr-1" /> Copy URL
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`${BASE_URL}${ep.path}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" /> Try it
                      </a>
                    </Button>
                  </div>
                </div>
                <CardDescription>{ep.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-muted p-3 text-xs font-mono text-muted-foreground mb-3 flex items-center gap-2">
                  <Code className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">GET {BASE_URL}{ep.path}</span>
                </div>
                <details className="group">
                  <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground">
                    Example Response ▸
                  </summary>
                  <pre className="mt-2 rounded-md bg-muted p-3 text-xs overflow-x-auto text-muted-foreground">
                    {ep.example}
                  </pre>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage Example</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="rounded-md bg-muted p-4 text-xs overflow-x-auto text-muted-foreground">{`// Fetch protein accessibility data
const response = await fetch(
  "${BASE_URL}/protein-access"
);
const data = await response.json();

// Find markets with severe shortage
const critical = data.markets.filter(
  m => m.protein_score < 0.4
);
console.log("Markets needing intervention:", critical);`}</pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
