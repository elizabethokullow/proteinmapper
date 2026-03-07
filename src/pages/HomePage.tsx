import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, ClipboardList, Map, Shield, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/AppHeader";

const features = [
  { icon: ClipboardList, title: "Quick Reporting", desc: "NutriScouts submit food data in under 15 seconds" },
  { icon: Map, title: "Live Map", desc: "Real-time protein accessibility scores on a public map" },
  { icon: Shield, title: "Data Credibility", desc: "Multi-report verification and trust scoring" },
  { icon: BarChart3, title: "Protein Score", desc: "0–1 score combining availability, price & trust" },
  { icon: Users, title: "Community-Driven", desc: "Powered by local reporters who know their markets" },
  { icon: MapPin, title: "Open Data", desc: "API access for NGOs, governments and researchers" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Hero */}
      <section className="container py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border bg-accent px-4 py-1.5 text-sm text-accent-foreground mb-6">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse-gentle" />
            Mapping protein access in real-time
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Every child deserves
            <span className="text-primary"> protein-rich food</span>
          </h1>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            ProteinMapper collects real-time community data about protein food availability
            in local markets to identify nutrition gaps affecting children and vulnerable families.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/submit">
                <ClipboardList className="h-4 w-4 mr-2" />
                Submit a Report
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/map">
                <Map className="h-4 w-4 mr-2" />
                View Live Map
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features grid */}
      <section className="container pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
              className="rounded-lg border bg-card p-5"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-card-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="container pb-16">
        <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
        <div className="flex flex-col md:flex-row gap-6 max-w-3xl mx-auto">
          {[
            { step: "1", title: "Report", desc: "NutriScouts visit markets and submit food availability data" },
            { step: "2", title: "Verify", desc: "3+ independent reports verify market status automatically" },
            { step: "3", title: "Map", desc: "Protein accessibility scores appear on the live map" },
          ].map(s => (
            <div key={s.step} className="flex-1 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                {s.step}
              </div>
              <h3 className="font-semibold mt-3">{s.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        ProteinMapper — Open source nutrition data for everyone
      </footer>
    </div>
  );
}
