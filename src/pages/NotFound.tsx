import { Link } from "react-router-dom";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/usePageMeta";

const NotFound = () => {
  usePageMeta("পাতাটি পাওয়া যায়নি");
  return (
    <section className="relative overflow-hidden py-24">
      <div className="orb -left-20 top-0 h-72 w-72 bg-primary/15" aria-hidden />
      <div className="orb -right-20 bottom-0 h-72 w-72 bg-accent/10" aria-hidden />
      <div className="container relative text-center">
        <p className="text-gradient font-display text-8xl font-bold md:text-9xl">৪০৪</p>
        <h1 className="mt-4 font-display text-2xl font-bold md:text-3xl">পাতাটি খুঁজে পাওয়া যায়নি</h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">আপনি যে ঠিকানাটি খুঁজছেন সেটি সরানো হয়েছে বা ঠিকানায় ভুল আছে।</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild className="rounded-full px-6"><Link to="/"><Home className="mr-2 h-4 w-4" /> হোমে ফিরুন</Link></Button>
          <Button asChild variant="outline" className="rounded-full px-6"><Link to="/search"><Search className="mr-2 h-4 w-4" /> প্রাক্তন ছাত্র খুঁজুন</Link></Button>
        </div>
      </div>
    </section>
  );
};

export default NotFound;
