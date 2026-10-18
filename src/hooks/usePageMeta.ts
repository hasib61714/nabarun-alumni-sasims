import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

function setMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Sets the browser-tab title and the description used by search engines and link previews. */
export function usePageMeta(title?: string, description?: string) {
  const { settings } = useSiteSettings();
  const site = settings.general.siteName;
  useEffect(() => {
    const full = title ? `${title} | ${site}` : `${site} — ${settings.general.tagline}`;
    document.title = full;
    const desc = description || settings.home.heroSubtitle;
    setMeta('meta[name="description"]', "name", "description", desc);
    setMeta('meta[property="og:title"]', "property", "og:title", full);
    setMeta('meta[property="og:description"]', "property", "og:description", desc);
  }, [title, description, site, settings.general.tagline, settings.home.heroSubtitle]);
}
