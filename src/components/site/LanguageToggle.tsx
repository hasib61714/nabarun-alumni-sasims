import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Bengali / English switch. */
export default function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  const options = [
    { value: "bn", short: "বাং", name: "বাংলা", locale: "bn" },
    { value: "en", short: "EN", name: "English", locale: "en" },
  ] as const;
  return (
    <div role="group" aria-label={lang === "en" ? "Language" : "ভাষা"} className={cn("inline-flex items-center rounded-full border bg-background/60 p-0.5 text-xs font-semibold", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          lang={o.locale}
          aria-pressed={lang === o.value}
          aria-label={o.name}
          title={o.name}
          onClick={() => setLang(o.value)}
          className={cn(
            "rounded-full px-2.5 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            lang === o.value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.short}
        </button>
      ))}
    </div>
  );
}
