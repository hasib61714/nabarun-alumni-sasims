import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone } from "lucide-react";
import { institutions } from "@/data/institutions";

export function InstitutionCards() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {institutions.map((inst, i) => (
        <motion.div
          key={inst.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="glass-card rounded-xl p-6 shadow-card text-center flex flex-col"
        >
          <div className="mx-auto mb-5 flex h-32 w-full items-center justify-center rounded-lg border bg-white p-3">
            <img src={inst.logo} alt={`${inst.name} logo`} className="max-h-full w-auto object-contain" loading="lazy" />
          </div>
          <h3 className="font-display text-lg font-semibold">{inst.name}</h3>
          <p className="text-sm text-muted-foreground">{inst.nameBn}</p>
          {inst.established && (
            <span className="mx-auto mt-2 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
              স্থাপিত {inst.established}
            </span>
          )}
          <div className="mt-4 space-y-2 text-sm">
            <a href={`tel:${inst.phone}`} className="flex items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <Phone className="h-4 w-4 shrink-0" /> {inst.phoneDisplay}
            </a>
            <a href={`mailto:${inst.email}`} className="flex items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors break-all">
              <Mail className="h-4 w-4 shrink-0" /> {inst.email}
            </a>
            {inst.mapUrl && (
              <a href={inst.mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-primary hover:underline">
                <MapPin className="h-4 w-4 shrink-0" /> Google Maps
              </a>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function InstitutionLogos() {
  return (
    <div className="mt-8 border-t pt-6">
      <h4 className="mb-4 text-center font-display font-semibold">আমাদের প্রতিষ্ঠান</h4>
      <div className="flex flex-wrap items-start justify-center gap-6 md:gap-10">
        {institutions.map((inst) => (
          <Link key={inst.id} to="/about#institutions" className="group flex w-28 flex-col items-center gap-2 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-md border bg-white p-1">
              <img src={inst.logo} alt={`${inst.name} logo`} className="max-h-full w-auto object-contain" loading="lazy" />
            </span>
            <span className="text-xs text-muted-foreground transition-colors group-hover:text-primary">{inst.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
