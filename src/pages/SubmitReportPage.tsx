import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import ReportForm from "@/components/ReportForm";
import { Report } from "@/lib/types";
import { mockReports } from "@/lib/mockData";
import { toast } from "sonner";

export default function SubmitReportPage() {
  const [, setReports] = useState<Report[]>(mockReports);

  const handleSubmit = (report: Report) => {
    setReports(prev => [report, ...prev]);
    toast.success("Report submitted successfully!");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container max-w-lg py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Submit Report</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Report protein food availability at your local market
          </p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <ReportForm onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
