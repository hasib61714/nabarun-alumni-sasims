import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, useScroll, useSpring } from "framer-motion";
import { LayoutDashboard, LogIn, LogOut, Menu, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import nabarunLogo from "@/assets/nabarun-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLang } from "@/lib/i18n";
import { applyNavSettings, isGroup, isPathActive, type NavLinkDef } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import LanguageToggle from "./LanguageToggle";
import ThemeToggle from "./ThemeToggle";

const itemBase =
  "rounded-full bg-transparent px-3.5 text-sm font-medium text-foreground/75 hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary data-[state=open]:bg-primary/10 data-[state=open]:text-primary data-[active]:bg-primary/10";

async function signOut() {
  await supabase.auth.signOut();
  window.location.href = "/";
}

function MenuCard({ link, active }: { link: NavLinkDef; active: boolean }) {
  return (
    <NavigationMenuLink asChild>
      <Link
        to={link.path}
        className={cn(
          "group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-primary/10 focus:bg-primary/10 focus:outline-none",
          active && "bg-primary/10",
        )}
      >
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <link.icon className="h-[1.1rem] w-[1.1rem]" />
        </span>
        <span>
          <span className="block text-sm font-semibold leading-tight">{link.label}</span>
          <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{link.desc}</span>
        </span>
      </Link>
    </NavigationMenuLink>
  );
}

export default function Header() {
  const { pathname } = useLocation();
  const { settings } = useSiteSettings();
  const { t, lang } = useLang();
  const { user } = useAuthUser();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const nav = useMemo(() => applyNavSettings(settings.nav, lang), [settings.nav, lang]);
  const { siteName } = settings.general;

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const groupActive = (items: NavLinkDef[]) => items.some((i) => isPathActive(pathname, i.path));

  return (
    <header className={cn("sticky top-0 z-50 glass-header transition-shadow", scrolled ? "border-b shadow-sm" : "border-b border-transparent")}>
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label={`${siteName} — ${t("হোম", "Home")}`}>
          <img src={nabarunLogo} alt="" className="h-8 w-auto sm:h-9" />
          <span className="hidden rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary md:block">Alumni</span>
        </Link>

        <NavigationMenu className="hidden lg:flex" aria-label={t("প্রধান মেনু", "Main menu")}>
          <NavigationMenuList className="gap-0.5">
            {nav.map((entry) =>
              isGroup(entry) ? (
                <NavigationMenuItem key={entry.id}>
                  <NavigationMenuTrigger className={cn(itemBase, groupActive(entry.items) && "bg-primary/10 text-primary")}>
                    {entry.label}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className={cn("grid gap-1 p-3", entry.items.length > 2 ? "w-[34rem] grid-cols-2" : "w-[22rem] grid-cols-1")}>
                      {entry.items.map((l) => (
                        <li key={l.id}><MenuCard link={l} active={isPathActive(pathname, l.path)} /></li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ) : (
                <NavigationMenuItem key={entry.id}>
                  <NavigationMenuLink asChild>
                    <Link
                      to={entry.path}
                      data-active={isPathActive(pathname, entry.path) || undefined}
                      className={cn("group inline-flex h-10 items-center justify-center py-2 transition-colors", itemBase, isPathActive(pathname, entry.path) && "text-primary")}
                    >
                      {entry.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ),
            )}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-1.5">
          <LanguageToggle className="hidden sm:inline-flex" />
          <ThemeToggle className="relative" />
          <div className="hidden items-center gap-1.5 lg:flex">
            {user ? (
              <>
                <Button asChild className="rounded-full px-5 shadow-md shadow-primary/25">
                  <Link to="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> {t("ড্যাশবোর্ড", "Dashboard")}</Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={signOut} aria-label={t("লগআউট", "Log out")} title={t("লগআউট", "Log out")}><LogOut className="h-4 w-4" /></Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild className="rounded-full"><Link to="/login">{t("সাইন ইন", "Sign in")}</Link></Button>
                <Button asChild className="rounded-full px-5 shadow-md shadow-primary/25"><Link to="/register">{t("যোগ দিন", "Join us")}</Link></Button>
              </>
            )}
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("মেনু খুলুন", "Open menu")}><Menu className="h-6 w-6" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-[88vw] max-w-sm flex-col gap-0 p-0">
              <SheetHeader className="border-b p-5 text-left">
                <SheetTitle className="flex items-center gap-2.5">
                  <img src={nabarunLogo} alt="" className="h-9 w-auto" /> {siteName}
                </SheetTitle>
                <SheetDescription>{settings.general.tagline}</SheetDescription>
              </SheetHeader>
              <nav className="flex-1 overflow-y-auto p-3" aria-label={t("মোবাইল মেনু", "Mobile menu")}>
                <Accordion type="multiple" className="w-full">
                  {nav.map((entry) =>
                    isGroup(entry) ? (
                      <AccordionItem key={entry.id} value={entry.id} className="border-b-0">
                        <AccordionTrigger className={cn("rounded-xl px-3 py-3 text-sm font-semibold hover:bg-muted hover:no-underline", groupActive(entry.items) && "text-primary")}>
                          <span className="flex items-center gap-3"><entry.icon className="h-4 w-4 text-primary" /> {entry.label}</span>
                        </AccordionTrigger>
                        <AccordionContent className="pb-1">
                          <ul className="ml-4 space-y-0.5 border-l pl-3">
                            {entry.items.map((l) => (
                              <li key={l.id}>
                                <SheetClose asChild>
                                  <Link to={l.path} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted", isPathActive(pathname, l.path) ? "bg-primary/10 font-semibold text-primary" : "text-foreground/80")}>
                                    <l.icon className="h-4 w-4" /> {l.label}
                                  </Link>
                                </SheetClose>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    ) : (
                      <SheetClose asChild key={entry.id}>
                        <Link to={entry.path} className={cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold hover:bg-muted", isPathActive(pathname, entry.path) && "text-primary")}>
                          <entry.icon className="h-4 w-4 text-primary" /> {entry.label}
                        </Link>
                      </SheetClose>
                    ),
                  )}
                </Accordion>
              </nav>
              <div className="space-y-2 border-t p-4">
                <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{t("ভাষা", "Language")}</span><LanguageToggle /></div>
                {user ? (
                  <>
                    <SheetClose asChild><Button asChild className="w-full rounded-full"><Link to="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> {t("ড্যাশবোর্ড", "Dashboard")}</Link></Button></SheetClose>
                    <Button variant="outline" className="w-full rounded-full" onClick={signOut}><LogOut className="mr-2 h-4 w-4" /> {t("লগআউট", "Log out")}</Button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <SheetClose asChild><Button variant="outline" asChild className="rounded-full"><Link to="/login"><LogIn className="mr-2 h-4 w-4" /> {t("সাইন ইন", "Sign in")}</Link></Button></SheetClose>
                    <SheetClose asChild><Button asChild className="rounded-full"><Link to="/register"><UserPlus className="mr-2 h-4 w-4" /> {t("যোগ দিন", "Join us")}</Link></Button></SheetClose>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <motion.div style={{ scaleX: progress }} className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-primary" aria-hidden />
    </header>
  );
}
