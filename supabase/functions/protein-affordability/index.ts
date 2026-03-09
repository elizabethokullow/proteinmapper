import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAILY_INCOME = 65;

function getPAIStatus(pai: number): string {
  if (pai < 0.2) return "affordable";
  if (pai <= 0.35) return "strained";
  return "high_risk";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: reports, error } = await supabase
    .from("reports")
    .select("market_name, food_type, price")
    .gt("price", 0);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const grouped: Record<string, number[]> = {};
  (reports || []).forEach((r: any) => {
    const key = `${r.market_name}||${r.food_type}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(Number(r.price));
  });

  const affordability = Object.entries(grouped).map(([key, prices]) => {
    const [market, food_type] = key.split("||");
    const avg_price = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const pai = Math.round((avg_price / DAILY_INCOME) * 100) / 100;
    return {
      market,
      food_type,
      avg_price,
      pai,
      status: getPAIStatus(pai),
      daily_income_baseline: DAILY_INCOME,
    };
  }).sort((a, b) => b.pai - a.pai);

  return new Response(JSON.stringify({
    affordability,
    methodology: `PAI = avg_price / daily_income (KSh ${DAILY_INCOME})`,
    generated_at: new Date().toISOString(),
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
