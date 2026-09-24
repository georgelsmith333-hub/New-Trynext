/**
 * Homepage layout contract shared by the admin Page Builder
 * (`pages/admin/AdminPageBuilder.tsx`) and the public home page
 * (`pages/Home.tsx`).
 *
 * The layout is stored in the `homepage_layout` setting as
 * `{"version":2,"sections":[...]}`. Older builds of the Page Builder saved a
 * bare array that the storefront never rendered; those values are treated as
 * "no custom layout" so deploying this change cannot silently strip sections
 * from a live homepage. The storefront uses the built-in default order until
 * an admin saves a layout from the current Page Builder.
 */

export type HomeSectionPadding = "none" | "sm" | "md" | "lg" | "xl";

export interface HomeSectionSettings {
  title?: string;
  bgColor?: string;
  padding?: HomeSectionPadding;
}

export interface HomeSectionConfig {
  id: string;
  type: HomeSectionType;
  visible: boolean;
  settings: HomeSectionSettings;
}

export const HOME_SECTION_TYPES = [
  "hero",
  "announcement",
  "products",
  "payment-ribbon",
  "categories",
  "flash-sale",
  "features",
  "how-it-works",
  "studio-cta",
  "popular-products",
  "stats",
  "testimonials",
  "trust-badges",
  "blog",
  "recently-viewed",
  "cta",
] as const;

export type HomeSectionType = typeof HOME_SECTION_TYPES[number];

export interface HomeSectionInfo {
  type: HomeSectionType;
  name: string;
  description: string;
  /** Whether the section has a heading that the "Section Title" setting replaces. */
  supportsTitle: boolean;
}

export const HOME_SECTION_INFO: Record<HomeSectionType, HomeSectionInfo> = {
  hero: { type: "hero", name: "Hero Banner", description: "Main promotional header", supportsTitle: false },
  announcement: { type: "announcement", name: "Marquee Ticker", description: "Scrolling highlights strip", supportsTitle: false },
  products: { type: "products", name: "Featured Products", description: "Special offers + product grid", supportsTitle: true },
  "payment-ribbon": { type: "payment-ribbon", name: "Payment Ribbon", description: "Accepted payment methods", supportsTitle: false },
  categories: { type: "categories", name: "Category Grid", description: "Browse by category", supportsTitle: true },
  "flash-sale": { type: "flash-sale", name: "Flash Sale Banner", description: "Countdown promo banner", supportsTitle: false },
  features: { type: "features", name: "Why Choose Us", description: "Feature highlights", supportsTitle: true },
  "how-it-works": { type: "how-it-works", name: "How It Works", description: "Step-by-step process", supportsTitle: true },
  "studio-cta": { type: "studio-cta", name: "Design Studio Banner", description: "Promote the Design Studio", supportsTitle: false },
  "popular-products": { type: "popular-products", name: "Popular Products", description: "Custom product landing cards", supportsTitle: true },
  stats: { type: "stats", name: "Stats Bar", description: "Trust indicators & numbers", supportsTitle: false },
  testimonials: { type: "testimonials", name: "Testimonials", description: "Customer reviews", supportsTitle: true },
  "trust-badges": { type: "trust-badges", name: "Trust Badges", description: "Security & shipping badges", supportsTitle: false },
  blog: { type: "blog", name: "Blog Previews", description: "Most popular articles", supportsTitle: true },
  "recently-viewed": { type: "recently-viewed", name: "Recently Viewed & Social", description: "Visitor history + social links", supportsTitle: false },
  cta: { type: "cta", name: "CTA Banner", description: "Closing call to action", supportsTitle: false },
};

export const HOME_SECTION_PADDING_CLASS: Record<HomeSectionPadding, string> = {
  none: "home-section-pad-none",
  sm: "home-section-pad-sm",
  md: "home-section-pad-md",
  lg: "home-section-pad-lg",
  xl: "home-section-pad-xl",
};

const isSectionType = (value: unknown): value is HomeSectionType =>
  typeof value === "string" && (HOME_SECTION_TYPES as readonly string[]).includes(value);

/** The order the storefront renders when no custom layout has been saved. */
export function defaultHomeLayout(): HomeSectionConfig[] {
  return HOME_SECTION_TYPES.map((type) => ({ id: `default-${type}`, type, visible: true, settings: {} }));
}

const HEX_COLOR = /^#[0-9a-f]{3,8}$/i;
const PADDINGS: readonly HomeSectionPadding[] = ["none", "sm", "md", "lg", "xl"];

function sanitizeSettings(raw: unknown): HomeSectionSettings {
  if (!raw || typeof raw !== "object") return {};
  const s = raw as Record<string, unknown>;
  const out: HomeSectionSettings = {};
  if (typeof s.title === "string" && s.title.trim()) out.title = s.title.slice(0, 160);
  if (typeof s.bgColor === "string" && HEX_COLOR.test(s.bgColor.trim())) out.bgColor = s.bgColor.trim();
  if (typeof s.padding === "string" && (PADDINGS as readonly string[]).includes(s.padding)) {
    out.padding = s.padding as HomeSectionPadding;
  }
  return out;
}

/**
 * Parses the stored `homepage_layout` value. Returns `null` when no usable
 * version-2 layout is stored (empty, legacy bare array, or malformed JSON), in
 * which case callers fall back to {@link defaultHomeLayout}.
 */
export function parseHomeLayout(raw: unknown): HomeSectionConfig[] | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return null; }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const obj = parsed as { version?: unknown; sections?: unknown };
  if (obj.version !== 2 || !Array.isArray(obj.sections)) return null;
  const seen = new Set<HomeSectionType>();
  const sections: HomeSectionConfig[] = [];
  for (const item of obj.sections) {
    if (!item || typeof item !== "object") continue;
    const s = item as Record<string, unknown>;
    if (!isSectionType(s.type) || seen.has(s.type)) continue;
    seen.add(s.type);
    sections.push({
      id: typeof s.id === "string" && s.id ? s.id : `section-${s.type}`,
      type: s.type,
      visible: s.visible !== false,
      settings: sanitizeSettings(s.settings),
    });
  }
  return sections;
}

export function serializeHomeLayout(sections: HomeSectionConfig[]): string {
  return JSON.stringify({ version: 2, sections });
}
