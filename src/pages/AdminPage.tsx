import AppHeader from "@/components/AppHeader";
import ScoreBadge from "@/components/ScoreBadge";
import { useReports, useReporters, useMarkets, useUpdateReportStatus } from "@/hooks/useReports";
import { FOOD_TYPES, getAvailabilityLabel } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Flag, Clock, Download, Users, FileText, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminPage() {
  const { data: reports = [], isLoading } = useReports();
  const { data: reporters = [] } = useReporters();
  const { data: markets = [] } = useMarkets();
  const updateStatus = useUpdateReportStatus();

  const flaggedReports = reports.filter(r => r.validation_status === "flagged");

  const handleStatusUpdate = (id: string, status: "verified" | "flagged") => {
    updateStatus.mutate({ id, status }, {
      onSuccess: () => toast.success(`Report ${status}`),
      onError: () => toast.error("Failed to update"),
    });
  };

  const exportCSV = () => {
    const headers = "id,market,food,availability,price,reporter,timestamp,status\n";
    const rows = reports.map(r =>
      `${r.id},${r.market_name},${r.food_type},${r.availability},${r.price},${r.reporter_id},${r.created_at},${r.validation_status}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "protein-mapper-reports.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "verified") return <Check className="h-4 w-4 text-score-good" />;
    if (status === "flagged") return <Flag className="h-4 w-4 text-score-severe" />;
    return <Clock className="h-4 w-4 text-score-limited" />;
  };

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
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage reports, reporters, and data</p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Reports", value: reports.length, icon: FileText },
            { label: "Markets", value: markets.length, icon: FileText },
            { label: "Flagged", value: flaggedReports.length, icon: AlertTriangle },
            { label: "Reporters", value: reporters.length, icon: Users },
          ].map(s => (
            <div key={s.label} className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </div>
              <div className="text-2xl font-bold text-card-foreground">{s.value}</div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="reports">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="reports">All Reports</TabsTrigger>
            <TabsTrigger value="flagged">Flagged ({flaggedReports.length})</TabsTrigger>
            <TabsTrigger value="reporters">Reporters</TabsTrigger>
            <TabsTrigger value="markets">Markets</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="mt-4 space-y-2">
            {reports.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No reports yet</p>}
            {reports.map(r => {
              const food = FOOD_TYPES.find(f => f.value === r.food_type);
              return (
                <div key={r.id} className="rounded-lg border bg-card p-3 flex items-center gap-3 flex-wrap">
                  <StatusIcon status={r.validation_status} />
                  <span className="font-medium text-sm min-w-[120px]">{r.market_name}</span>
                  <span className="text-sm">{food?.emoji} {food?.label}</span>
                  <span className="text-xs text-muted-foreground">{getAvailabilityLabel(r.availability)}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{r.reporter_id}</span>
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                  {r.validation_status !== "verified" && (
                    <Button variant="outline" size="sm" onClick={() => handleStatusUpdate(r.id, "verified")}>
                      <Check className="h-3 w-3 mr-1" /> Verify
                    </Button>
                  )}
                  {r.validation_status !== "flagged" && (
                    <Button variant="outline" size="sm" onClick={() => handleStatusUpdate(r.id, "flagged")}>
                      <Flag className="h-3 w-3 mr-1" /> Flag
                    </Button>
                  )}
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="flagged" className="mt-4 space-y-2">
            {flaggedReports.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No flagged reports</p>
            ) : flaggedReports.map(r => {
              const food = FOOD_TYPES.find(f => f.value === r.food_type);
              return (
                <div key={r.id} className="rounded-lg border border-destructive/30 bg-card p-3 flex items-center gap-3 flex-wrap">
                  <Flag className="h-4 w-4 text-score-severe" />
                  <span className="font-medium text-sm">{r.market_name}</span>
                  <span className="text-sm">{food?.emoji} {food?.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{r.reporter_id}</span>
                  <Button variant="outline" size="sm" onClick={() => handleStatusUpdate(r.id, "verified")}>
                    <Check className="h-3 w-3 mr-1" /> Verify
                  </Button>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="reporters" className="mt-4 space-y-2">
            {reporters.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No reporters yet</p>}
            {reporters.map(rep => (
              <div key={rep.id} className="rounded-lg border bg-card p-4 flex items-center justify-between">
                <div>
                  <span className="font-mono font-semibold text-sm text-card-foreground">{rep.id}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {rep.total_reports} reports · {rep.verified_reports} verified
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-card-foreground">{(Number(rep.trust_score) * 100).toFixed(0)}%</div>
                  <div className="text-xs text-muted-foreground">Trust Score</div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="markets" className="mt-4 space-y-2">
            {markets.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No markets yet</p>}
            {markets.map(m => (
              <div key={m.name} className="rounded-lg border bg-card p-4 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-card-foreground">{m.name}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {m.reportCount} reports · {m.verified ? "✓ Verified" : "⏳ Pending"}
                  </p>
                </div>
                <ScoreBadge score={m.proteinScore} size="sm" />
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
