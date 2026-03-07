import { useState } from "react";
import { FOOD_TYPES } from "@/lib/types";
import { useSubmitReport } from "@/hooks/useReports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MapPin, Loader2, Check } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type FoodType = Database["public"]["Enums"]["food_type"];
type AvailabilityStatus = Database["public"]["Enums"]["availability_status"];

export default function ReportForm() {
  const [marketName, setMarketName] = useState("");
  const [foodType, setFoodType] = useState<FoodType | "">("");
  const [availability, setAvailability] = useState<AvailabilityStatus | "">("");
  const [price, setPrice] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useSubmitReport();

  const captureGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setGettingLocation(false);
        toast.success("Location captured");
      },
      () => {
        setGettingLocation(false);
        toast.error("Could not get location");
      },
      { timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marketName || !foodType || !availability) {
      toast.error("Please fill all required fields");
      return;
    }

    const reporterId = localStorage.getItem("protein-mapper-reporter-id") ||
      `ns${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem("protein-mapper-reporter-id", reporterId);

    try {
      await submitMutation.mutateAsync({
        market_name: marketName,
        latitude: lat ?? -1.95,
        longitude: lng ?? 30.06,
        food_type: foodType as FoodType,
        availability: availability as AvailabilityStatus,
        price: parseFloat(price) || 0,
        reporter_id: reporterId,
      });

      setSubmitted(true);
      toast.success("Report submitted!");
      setTimeout(() => {
        setSubmitted(false);
        setMarketName("");
        setFoodType("");
        setAvailability("");
        setPrice("");
      }, 2000);
    } catch {
      toast.error("Failed to submit report");
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Check className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Report Submitted!</h3>
        <p className="text-sm text-muted-foreground">Thank you, NutriScout</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="market">Market Name *</Label>
        <Input id="market" value={marketName} onChange={e => setMarketName(e.target.value)} placeholder="e.g. Kimironko Market" />
      </div>

      <div>
        <Label>GPS Location</Label>
        <Button type="button" variant="outline" size="sm" className="w-full mt-1" onClick={captureGPS} disabled={gettingLocation}>
          {gettingLocation ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MapPin className="h-4 w-4 mr-2" />}
          {lat ? `${lat.toFixed(4)}, ${lng?.toFixed(4)}` : "Capture Location"}
        </Button>
      </div>

      <div>
        <Label>Food Type *</Label>
        <div className="grid grid-cols-5 gap-2 mt-1">
          {FOOD_TYPES.map(f => (
            <button
              type="button"
              key={f.value}
              onClick={() => setFoodType(f.value)}
              className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors ${
                foodType === f.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent"
              }`}
            >
              <span className="text-lg">{f.emoji}</span>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Availability *</Label>
        <div className="grid grid-cols-3 gap-2 mt-1">
          {([
            { value: "available" as const, label: "Available", color: "score-good" },
            { value: "limited" as const, label: "Limited", color: "score-limited" },
            { value: "not_available" as const, label: "None", color: "score-severe" },
          ]).map(a => (
            <button
              type="button"
              key={a.value}
              onClick={() => setAvailability(a.value)}
              className={`rounded-lg border p-2.5 text-sm font-medium transition-colors ${
                availability === a.value
                  ? `border-${a.color} bg-${a.color}/10 text-${a.color}`
                  : "border-border text-muted-foreground hover:bg-accent"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="price">Price (local currency)</Label>
        <Input id="price" type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" />
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={submitMutation.isPending}>
        {submitMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        Submit Report
      </Button>
    </form>
  );
}
