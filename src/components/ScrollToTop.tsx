import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Starts every page at the top when navigating (pages with a #hash scroll themselves). */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, left: 0 });
  }, [pathname, hash]);
  return null;
}
