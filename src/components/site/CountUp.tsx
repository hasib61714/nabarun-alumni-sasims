import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";
import { formatNumber } from "@/lib/format";

/** Counts up to `value` the first time it scrolls into view (instantly when motion is reduced). */
export default function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setShown(value); return; }
    const controls = animate(0, value, { duration: 1.4, ease: "easeOut", onUpdate: (v) => setShown(Math.round(v)) });
    return () => controls.stop();
  }, [inView, value]);

  return <span ref={ref}>{formatNumber(inView ? shown : 0)}{suffix}</span>;
}
