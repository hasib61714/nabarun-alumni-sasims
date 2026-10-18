import { describe, expect, it } from "vitest";
import { applyNavSettings, isGroup, isPathActive, NAV } from "./navigation";
import { buildSettings, DEFAULT_SETTINGS, DEFAULT_SETTINGS_EN, paragraphs, safeHref, telHref } from "./siteSettings";

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

describe("English settings", () => {
  it("uses the English defaults when nothing is stored", () => {
    const en = buildSettings([], "en");
    expect(en.home.heroTitle).toBe(DEFAULT_SETTINGS_EN.home.heroTitle);
    expect(en.home.features).toHaveLength(DEFAULT_SETTINGS.home.features.length);
    expect(en.home.steps).toHaveLength(DEFAULT_SETTINGS.home.steps.length);
  });
  it("reads English text from the _en rows and shared fields from the Bengali rows", () => {
    const rows = [
      { key: "general", value: { email: "shared@x.co", address: "বাংলা ঠিকানা" } },
      { key: "general_en", value: { email: "ignored@x.co", address: "English address" } },
      { key: "nav", value: { hidden: ["gallery"] } },
      { key: "home", value: { showEvents: false, heroTitle: "বাংলা শিরোনাম" } },
    ];
    const bn = buildSettings(rows, "bn");
    const en = buildSettings(rows, "en");
    expect(bn.general.address).toBe("বাংলা ঠিকানা");
    expect(en.general.address).toBe("English address");
    expect(en.general.email).toBe("shared@x.co");
    expect(en.nav.hidden).toEqual(["gallery"]);
    expect(en.home.showEvents).toBe(false);
    expect(en.home.heroTitle).toBe(DEFAULT_SETTINGS_EN.home.heroTitle);
  });
  it("keeps institution contact details shared but the written text per language", () => {
    const rows = [
      { key: "institutions", value: { items: { nps: { phoneDisplay: "+880 1", desc: "বাংলা বর্ণনা", hidden: true } } } },
      { key: "institutions_en", value: { items: { nps: { desc: "English text", phoneDisplay: "ignored" } } } },
    ];
    const en = buildSettings(rows, "en").institutions.items.nps;
    expect(en.phoneDisplay).toBe("+880 1");
    expect(en.hidden).toBe(true);
    expect(en.desc).toBe("English text");
  });
  it("labels the menu in English", () => {
    const nav = applyNavSettings({ labels: {}, hidden: [] }, "en");
    expect(nav[0].label).toBe("Home");
    expect(nav.every((e) => !/[\u0980-\u09FF]/.test(e.label))).toBe(true);
  });
});
