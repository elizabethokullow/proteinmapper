import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";

type ReportRow = Database["public"]["Tables"]["reports"]["Row"];
type ReportInsert = Database["public"]["Tables"]["reports"]["Insert"];
type ReporterRow = Database["public"]["Tables"]["reporters"]["Row"];

export interface MarketData {
  name: string;
  latitude: number;
  longitude: number;
  proteinScore: number;
  reportCount: number;
  verified: boolean;
  reports: ReportRow[];
}

// Calculate Protein Accessibility Score for a market
function calculateProteinScore(reports: ReportRow[], reporters: ReporterRow[]): number {
  if (reports.length === 0) return 0;

  // Availability score (0-1)
  const availScores = reports.map(r =>
    r.availability === "available" ? 1 : r.availability === "limited" ? 0.5 : 0
  );
  const avgAvail = availScores.reduce((a, b) => a + b, 0) / availScores.length;

  // Affordability score - compare to baseline prices
  const baselines: Record<string, number> = { eggs: 300, beans: 1000, fish: 4000, milk: 700, meat: 5000 };
  const pricedReports = reports.filter(r => r.price > 0);
  let affordability = 1;
  if (pricedReports.length > 0) {
    const ratios = pricedReports.map(r => {
      const baseline = baselines[r.food_type] || 1000;
      return Math.min(baseline / r.price, 1);
    });
    affordability = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  }

  // Report density bonus (more reports = more confidence)
  const reportBonus = Math.min(reports.length / 15, 0.15);

  // Trust score of reporters
  const reporterMap = new Map(reporters.map(r => [r.id, r.trust_score]));
  const trustScores = reports.map(r => Number(reporterMap.get(r.reporter_id) ?? 0.5));
  const avgTrust = trustScores.reduce((a, b) => a + b, 0) / trustScores.length;

  // Weighted score
  const score = avgAvail * 0.4 + affordability * 0.25 + avgTrust * 0.2 + reportBonus;
  return Math.min(Math.round(score * 100) / 100, 1);
}

export function useReports() {
  return useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ReportRow[];
    },
  });
}

export function useReporters() {
  return useQuery({
    queryKey: ["reporters"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reporters").select("*");
      if (error) throw error;
      return data as ReporterRow[];
    },
  });
}

export function useMarkets() {
  const { data: reports = [] } = useReports();
  const { data: reporters = [] } = useReporters();

  return useQuery({
    queryKey: ["markets", reports, reporters],
    queryFn: () => {
      const grouped: Record<string, ReportRow[]> = {};
      reports.forEach(r => {
        if (!grouped[r.market_name]) grouped[r.market_name] = [];
        grouped[r.market_name].push(r);
      });

      const markets: MarketData[] = Object.entries(grouped).map(([name, reps]) => {
        const latest = reps[0];
        const uniqueReporters = new Set(reps.filter(r => r.validation_status !== "flagged").map(r => r.reporter_id));
        const verified = uniqueReporters.size >= 3;

        return {
          name,
          latitude: latest.latitude,
          longitude: latest.longitude,
          proteinScore: calculateProteinScore(reps, reporters),
          reportCount: reps.length,
          verified,
          reports: reps,
        };
      });

      return markets;
    },
    enabled: reports.length > 0,
  });
}

export function useSubmitReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (report: ReportInsert) => {
      const { data, error } = await supabase.from("reports").insert(report).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["reporters"] });
      queryClient.invalidateQueries({ queryKey: ["markets"] });
    },
  });
}

export function useUpdateReportStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "verified" | "flagged" }) => {
      const { error } = await supabase.from("reports").update({ validation_status: status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export type { ReportRow, ReporterRow };
