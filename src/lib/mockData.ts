import { Report, Market, Reporter } from "./types";

const now = new Date();
const h = (hours: number) => new Date(now.getTime() - hours * 3600000).toISOString();

export const mockReports: Report[] = [
  { id: "r1", marketName: "Kimironko Market", latitude: -1.9403, longitude: 30.1025, foodType: "eggs", availability: "available", price: 200, reporterId: "ns001", timestamp: h(1), validationStatus: "verified" },
  { id: "r2", marketName: "Kimironko Market", latitude: -1.9403, longitude: 30.1025, foodType: "beans", availability: "available", price: 800, reporterId: "ns002", timestamp: h(2), validationStatus: "verified" },
  { id: "r3", marketName: "Kimironko Market", latitude: -1.9403, longitude: 30.1025, foodType: "fish", availability: "limited", price: 3500, reporterId: "ns003", timestamp: h(3), validationStatus: "verified" },
  { id: "r4", marketName: "Nyabugogo Market", latitude: -1.9467, longitude: 30.0448, foodType: "eggs", availability: "limited", price: 250, reporterId: "ns001", timestamp: h(4), validationStatus: "verified" },
  { id: "r5", marketName: "Nyabugogo Market", latitude: -1.9467, longitude: 30.0448, foodType: "meat", availability: "not_available", price: 0, reporterId: "ns002", timestamp: h(5), validationStatus: "pending" },
  { id: "r6", marketName: "Nyabugogo Market", latitude: -1.9467, longitude: 30.0448, foodType: "milk", availability: "limited", price: 600, reporterId: "ns004", timestamp: h(6), validationStatus: "verified" },
  { id: "r7", marketName: "Kicukiro Market", latitude: -1.9780, longitude: 30.1100, foodType: "beans", availability: "available", price: 750, reporterId: "ns003", timestamp: h(7), validationStatus: "verified" },
  { id: "r8", marketName: "Kicukiro Market", latitude: -1.9780, longitude: 30.1100, foodType: "eggs", availability: "not_available", price: 0, reporterId: "ns005", timestamp: h(8), validationStatus: "flagged" },
  { id: "r9", marketName: "Kicukiro Market", latitude: -1.9780, longitude: 30.1100, foodType: "fish", availability: "not_available", price: 0, reporterId: "ns001", timestamp: h(10), validationStatus: "verified" },
  { id: "r10", marketName: "Remera Market", latitude: -1.9550, longitude: 30.1060, foodType: "meat", availability: "available", price: 4000, reporterId: "ns002", timestamp: h(1), validationStatus: "pending" },
  { id: "r11", marketName: "Remera Market", latitude: -1.9550, longitude: 30.1060, foodType: "eggs", availability: "available", price: 180, reporterId: "ns004", timestamp: h(2), validationStatus: "verified" },
  { id: "r12", marketName: "Remera Market", latitude: -1.9550, longitude: 30.1060, foodType: "milk", availability: "available", price: 500, reporterId: "ns003", timestamp: h(3), validationStatus: "verified" },
];

export function getMarkets(reports: Report[]): Market[] {
  const grouped: Record<string, Report[]> = {};
  reports.forEach(r => {
    if (!grouped[r.marketName]) grouped[r.marketName] = [];
    grouped[r.marketName].push(r);
  });

  return Object.entries(grouped).map(([name, reps]) => {
    const latest = reps[0];
    const availScores = reps.map(r => r.availability === "available" ? 1 : r.availability === "limited" ? 0.5 : 0);
    const avgAvail = availScores.reduce((a, b) => a + b, 0) / availScores.length;
    const verified = reps.filter(r => r.validationStatus === "verified").length >= 3;
    const reportBonus = Math.min(reps.length / 10, 0.2);
    const score = Math.min(avgAvail * 0.7 + reportBonus + (verified ? 0.1 : 0), 1);

    return {
      name,
      latitude: latest.latitude,
      longitude: latest.longitude,
      proteinScore: Math.round(score * 100) / 100,
      reportCount: reps.length,
      verified,
      reports: reps,
    };
  });
}

export const mockReporters: Reporter[] = [
  { id: "ns001", trustScore: 0.92, totalReports: 45, verifiedReports: 41 },
  { id: "ns002", trustScore: 0.85, totalReports: 32, verifiedReports: 27 },
  { id: "ns003", trustScore: 0.78, totalReports: 28, verifiedReports: 21 },
  { id: "ns004", trustScore: 0.65, totalReports: 15, verifiedReports: 9 },
  { id: "ns005", trustScore: 0.30, totalReports: 5, verifiedReports: 1 },
];
