import { describe, expect, it } from "vitest";
import { applyNavSettings, isGroup, isPathActive, NAV } from "./navigation";
import { buildSettings, DEFAULT_SETTINGS, paragraphs, safeHref, telHref } from "./siteSettings";

describe("buildSettings", () => {
  it("returns the defaults when nothing is stored", () => {
    expect(buildSettings([])).toEqual(DEFAULT_SETTINGS);
    expect(buildSettings(null)).toEqual(DEFAULT_SETTINGS);
  });
  it("overlays stored values, keeps the rest, and allows blanking a field", () => {
    const s = buildSettings([{ key: "general", value: { email: "a@b.co", address: "" } }]);
    expect(s.general.email).toBe("a@b.co");
    expect(s.general.address).toBe("");
    expect(s.general.siteName).toBe(DEFAULT_SETTINGS.general.siteName);
  });
  it("ignores values of the wrong type and unknown keys", () => {
    const s = buildSettings([
      { key: "home", value: { heroTitle: 42, showEvents: "yes", features: "nope", bogus: 1 } },
      { key: "nobody", value: { x: 1 } },
    ]);
    expect(s.home.heroTitle).toBe(DEFAULT_SETTINGS.home.heroTitle);
    expect(s.home.showEvents).toBe(true);
    expect(s.home.features).toEqual(DEFAULT_SETTINGS.home.features);
    expect("bogus" in s.home).toBe(false);
  });
  it("accepts a valid card list but rejects a malformed one", () => {
    const ok = buildSettings([{ key: "home", value: { steps: [{ title: "A", desc: "B" }] } }]);
    expect(ok.home.steps).toEqual([{ title: "A", desc: "B" }]);
    const bad = buildSettings([{ key: "home", value: { steps: [{ title: 1 }] } }]);
    expect(bad.home.steps).toEqual(DEFAULT_SETTINGS.home.steps);
  });
  it("survives non-object stored values", () => {
    expect(buildSettings([{ key: "general", value: "oops" }]).general).toEqual(DEFAULT_SETTINGS.general);
    expect(buildSettings([{ key: "general", value: [1, 2] }]).general).toEqual(DEFAULT_SETTINGS.general);
  });
});

describe("safeHref / telHref / paragraphs", () => {
  it("allows only safe link types", () => {
    expect(safeHref("https://x.com/a")).toBe("https://x.com/a");
    expect(safeHref("/register")).toBe("/register");
    expect(safeHref("mailto:a@b.co")).toBe("mailto:a@b.co");
    expect(safeHref("javascript:alert(1)")).toBe("");
    expect(safeHref("//evil.com")).toBe("");
    expect(safeHref("data:text/html,x")).toBe("");
    expect(safeHref("  ")).toBe("");
  });
  it("builds tel links from a display number", () => {
    expect(telHref("+880 1741-919462")).toBe("tel:+8801741919462");
    expect(telHref("")).toBe("");
  });
  it("splits text on blank lines", () => {
    expect(paragraphs("a\n\n b \n\n\nc")).toEqual(["a", "b", "c"]);
  });
});

describe("navigation settings", () => {
  it("renames and hides entries, dropping groups that become empty", () => {
    const nav = applyNavSettings({ labels: { events: "অনুষ্ঠান" }, hidden: ["gallery", "memories", "contact"] });
    const ids = nav.map((e) => e.id);
    expect(ids).not.toContain("media-group");
    expect(ids).not.toContain("contact");
    const activity = nav.find((e) => e.id === "activity-group");
    expect(activity && isGroup(activity) && activity.items.find((i) => i.id === "events")?.label).toBe("অনুষ্ঠান");
  });
  it("hiding a group removes all its links", () => {
    expect(applyNavSettings({ labels: {}, hidden: ["alumni-group"] }).some((e) => e.id === "alumni-group")).toBe(false);
  });
  it("has unique ids and no more than six top level entries", () => {
    const ids = NAV.flatMap((e) => (isGroup(e) ? [e.id, ...e.items.map((i) => i.id)] : [e.id]));
    expect(new Set(ids).size).toBe(ids.length);
    expect(NAV.length).toBeLessThanOrEqual(6);
  });
  it("matches active paths, ignoring hash links", () => {
    expect(isPathActive("/memories/abc", "/memories")).toBe(true);
    expect(isPathActive("/", "/")).toBe(true);
    expect(isPathActive("/about", "/about#institutions")).toBe(false);
    expect(isPathActive("/events", "/")).toBe(false);
  });
});
