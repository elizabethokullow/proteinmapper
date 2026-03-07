import AppHeader from "@/components/AppHeader";
import ReportForm from "@/components/ReportForm";

export default function SubmitReportPage() {
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
          <ReportForm />
        </div>
      </div>
    </div>
  );
}
