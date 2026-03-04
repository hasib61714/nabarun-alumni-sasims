import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import nabarunLogo from "@/assets/nabarun-logo.png";
import { supabase } from "@/integrations/supabase/client";

const navLinks = [
  { label: "হোম", path: "/" },
  { label: "আমাদের সম্পর্কে", path: "/about" },
  { label: "প্রাক্তন ছাত্র", path: "/alumni" },
  { label: "ডিরেক্টরি", path: "/directory" },
  { label: "গ্যালারি", path: "/gallery" },
  { label: "ইভেন্ট", path: "/events" },
  { label: "অনুদান", path: "/donations" },
  { label: "নোটিশ", path: "/notices" },
  { label: "যোগাযোগ", path: "/contact" },
];

export default function PublicLayout() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setLoggedIn(!!session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setLoggedIn(!!session));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-card/90 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={nabarunLogo} alt="Nabarun Education Family" className="h-10 w-auto" />
            <span className="font-display text-lg font-bold text-primary hidden sm:block">Nabarun Alumni</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.path}
                to={l.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === l.path
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {loggedIn ? (
              <>
                <Button asChild variant="ghost">
                  <Link to="/dashboard">আমার ড্যাশবোর্ড</Link>
                </Button>
                <Button variant="outline" onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}>
                  লগআউট
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">সাইন ইন</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">রেজিস্টার</Link>
                </Button>
              </>
            )}
          </div>

          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t bg-card p-4 space-y-2">
            {navLinks.map((l) => (
              <Link
                key={l.path}
                to={l.path}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === l.path ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {l.label}
              </Link>
            ))}
            {loggedIn ? (
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)}>আমার ড্যাশবোর্ড</Link>
                </Button>
                <Button variant="outline" className="w-full" onClick={async () => { await supabase.auth.signOut(); setMobileOpen(false); window.location.href = "/"; }}>
                  লগআউট
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" asChild className="flex-1">
                  <Link to="/login">সাইন ইন</Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link to="/register">রেজিস্টার</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t bg-card">
        <div className="container py-12">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src={nabarunLogo} alt="Nabarun" className="h-10 w-auto" />
                <span className="font-display text-lg font-bold text-primary">Nabarun Alumni</span>
              </div>
              <p className="text-sm text-muted-foreground">
                নবারুণ এডুকেশন ফ্যামিলির প্রাক্তন ছাত্র-ছাত্রীদের তথ্য ব্যবস্থাপনা সিস্টেম। প্রজন্ম থেকে প্রজন্মের সংযোগ।
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-3">দ্রুত লিংক</h4>
              <div className="space-y-2">
                {navLinks.map((l) => (
                  <Link key={l.path} to={l.path} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-3">যোগাযোগ</h4>
              <p className="text-sm text-muted-foreground">info.nabarun@gmail.com</p>
              <p className="text-sm text-muted-foreground">+880 1741 919462</p>
              <a href="https://www.nabarun.com.bd" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                www.nabarun.com.bd
              </a>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} নবারুণ এডুকেশন ফ্যামিলি। সর্বস্বত্ব সংরক্ষিত।</p>
            <p className="mt-1 text-xs">Developed with ❤️ | <Link to="/about" className="hover:text-primary transition-colors">ডেভেলপার সম্পর্কে</Link></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
