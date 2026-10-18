import { Link } from "react-router-dom";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useLang } from "@/lib/i18n";

const NotFound = () => {
  const { t } = useLang();
  usePageMeta(t("পাতাটি পাওয়া যায়নি", "Page not found"));
  return (
    <section className="relative overflow-hidden py-24">
      <div className="orb -left-20 top-0 h-72 w-72 bg-primary/15" aria-hidden />
      <div className="orb -right-20 bottom-0 h-72 w-72 bg-accent/10" aria-hidden />
      <div className="container relative text-center">
        <p className="text-gradient font-display text-8xl font-bold md:text-9xl">{t("৪০৪", "404")}</p>
        <h1 className="mt-4 font-display text-2xl font-bold md:text-3xl">{t("পাতাটি খুঁজে পাওয়া যায়নি", "We couldn't find that page")}</h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">{t("আপনি যে ঠিকানাটি খুঁজছেন সেটি সরানো হয়েছে বা ঠিকানায় ভুল আছে।", "The page you are looking for has moved, or the address is mistyped.")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild className="rounded-full px-6"><Link to="/"><Home className="mr-2 h-4 w-4" /> {t("হোমে ফিরুন", "Back to home")}</Link></Button>
          <Button asChild variant="outline" className="rounded-full px-6"><Link to="/search"><Search className="mr-2 h-4 w-4" /> {t("প্রাক্তন ছাত্র খুঁজুন", "Find alumni")}</Link></Button>
        </div>
      </div>
    </section>
  );
};

export default NotFound;
