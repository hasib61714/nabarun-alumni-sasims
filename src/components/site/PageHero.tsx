import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface Props {
  title: string;
  subtitle?: string;
  badge?: string;
  children?: ReactNode;
}

/** The coloured banner at the top of every inner page. */
export default function PageHero({ title, subtitle, badge, children }: Props) {
  return (
    <section className="relative overflow-hidden bg-hero-gradient">
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div className="orb animate-float -left-20 -top-24 h-72 w-72 bg-cyan-300/30" aria-hidden />
      <div className="orb animate-float-slow -bottom-28 right-0 h-80 w-80 bg-teal-200/20" aria-hidden />
      <div className="container relative py-16 md:py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl">
          {badge && (
            <span className="mb-4 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/90 backdrop-blur">
              {badge}
            </span>
          )}
          <h1 className="font-display text-4xl font-bold leading-tight text-white md:text-5xl">{title}</h1>
          {subtitle && <p className="mt-4 text-lg text-white/80">{subtitle}</p>}
          {children}
        </motion.div>
      </div>
    </section>
  );
}
