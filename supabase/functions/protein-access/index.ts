import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAILY_INCOME = 65;
const baselines: Record<string, number> = { eggs: 300, beans: 1000, fish: 4000, milk: 700, meat: 5000 };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: reports } = await supabase.from("reports").select("*");
  const { data: reporters } = await supabase.from("reporters").select("*");

  if (!reports || !reporters) {
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const grouped: Record<string, typeof reports> = {};
  reports.forEach((r: any) => {
    if (!grouped[r.market_name]) grouped[r.market_name] = [];
    grouped[r.market_name].push(r);
  });

  const reporterMap = new Map(reporters.map((r: any) => [r.id, r.trust_score]));

  const markets = Object.entries(grouped).map(([name, reps]) => {
    const latest = reps[0];
    const availScores = reps.map((r: any) => r.availability === "available" ? 1 : r.availability === "limited" ? 0.5 : 0);
    const avgAvail = availScores.reduce((a: number, b: number) => a + b, 0) / availScores.length;

    const pricedReports = reps.filter((r: any) => r.price > 0);
    let affordability = 1;
    if (pricedReports.length > 0) {
      const ratios = pricedReports.map((r: any) => Math.min((baselines[r.food_type] || 1000) / r.price, 1));
      affordability = ratios.reduce((a: number, b: number) => a + b, 0) / ratios.length;
    }

    const trustScores = reps.map((r: any) => Number(reporterMap.get(r.reporter_id) ?? 0.5));
    const avgTrust = trustScores.reduce((a: number, b: number) => a + b, 0) / trustScores.length;
    const reportBonus = Math.min(reps.length / 15, 0.15);
    const score = Math.min(Math.round((avgAvail * 0.4 + affordability * 0.25 + avgTrust * 0.2 + reportBonus) * 100) / 100, 1);

    // PAI
    const avgPrice = pricedReports.length > 0 ? pricedReports.reduce((s: number, r: any) => s + Number(r.price), 0) / pricedReports.length : 0;
    const pai = Math.round((avgPrice / DAILY_INCOME) * 100) / 100;

    const uniqueReporters = new Set(reps.filter((r: any) => r.validation_status !== "flagged").map((r: any) => r.reporter_id));
    const region = latest.longitude > 35 ? "Nairobi" : "Migori";

    return {
      market: name,
      latitude: latest.latitude,
      longitude: latest.longitude,
      protein_score: score,
      affordability_index: pai,
      reports: reps.length,
      verified: uniqueReporters.size >= 3,
      region,
    };
  });

  return new Response(JSON.stringify({
    markets,
    total_markets: markets.length,
    total_reports: reports.length,
    generated_at: new Date().toISOString(),
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
