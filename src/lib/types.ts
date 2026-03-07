export type FoodType = "eggs" | "beans" | "fish" | "milk" | "meat";
export type Availability = "available" | "limited" | "not_available";
export type ValidationStatus = "pending" | "verified" | "flagged";

export interface Report {
  id: string;
  marketName: string;
  latitude: number;
  longitude: number;
  foodType: FoodType;
  availability: Availability;
  price: number;
  photoUrl?: string;
  reporterId: string;
  timestamp: string;
  validationStatus: ValidationStatus;
}

export interface Market {
  name: string;
  latitude: number;
  longitude: number;
  proteinScore: number;
  reportCount: number;
  verified: boolean;
  reports: Report[];
}

export interface Reporter {
  id: string;
  trustScore: number;
  totalReports: number;
  verifiedReports: number;
}

export function getScoreCategory(score: number): "good" | "limited" | "severe" {
  if (score >= 0.7) return "good";
  if (score >= 0.4) return "limited";
  return "severe";
}

export function getScoreLabel(score: number): string {
  const cat = getScoreCategory(score);
  if (cat === "good") return "Good Access";
  if (cat === "limited") return "Limited Access";
  return "Severe Shortage";
}

export function getAvailabilityLabel(a: Availability): string {
  if (a === "available") return "Available";
  if (a === "limited") return "Limited";
  return "Not Available";
}

export const FOOD_TYPES: { value: FoodType; label: string; emoji: string }[] = [
  { value: "eggs", label: "Eggs", emoji: "🥚" },
  { value: "beans", label: "Beans", emoji: "🫘" },
  { value: "fish", label: "Fish", emoji: "🐟" },
  { value: "milk", label: "Milk", emoji: "🥛" },
  { value: "meat", label: "Meat", emoji: "🥩" },
];
