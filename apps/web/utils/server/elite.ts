// The Elite tiers for the public pages: read from the catalogue (products of type PrivateCharter) and
// laid over the built-in content, so the page is complete before the tiers are published and survives the
// catalogue being unreachable. A published entry replaces the built-in one with the same slug.
import { ELITE_TIERS, type EliteTier } from "@/content/elite-tiers";
import { listPackages } from "@/utils/server/catalogue";

type Stored = {
  tier?: unknown;
  tagline?: unknown;
  audience?: unknown;
  basedOn?: unknown;
  includes?: unknown;
};

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const lines = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

export async function loadEliteTiers(): Promise<EliteTier[]> {
  let items: Awaited<ReturnType<typeof listPackages>>["items"] = [];
  try {
    // An API that does not know the type yet answers with holidays, so keep only real tiers.
    items = (await listPackages({ type: "PrivateCharter", size: 12 })).items.filter(
      (p) => p.productType === "PrivateCharter",
    );
  } catch {
    return ELITE_TIERS;
  }
  const bySlug = new Map(items.map((p) => [p.slug, p]));
  const tiers = ELITE_TIERS.map((base) => {
    const stored = bySlug.get(base.slug);
    if (!stored) return base;
    const d = (stored.details ?? {}) as Stored;
    const includes = lines(d.includes);
    return {
      ...base,
      title: stored.title || base.title,
      tier: str(d.tier) ?? base.tier,
      tagline: str(d.tagline) ?? base.tagline,
      audience: str(d.audience) ?? base.audience,
      basedOn: str(d.basedOn) ?? base.basedOn,
      includes: includes.length > 0 ? includes : base.includes,
    };
  });
  // Tiers added in the admin that the built-in list does not know are shown after it.
  const known = new Set(ELITE_TIERS.map((t) => t.slug));
  const extra = items
    .filter((p) => !known.has(p.slug))
    .map((p): EliteTier => {
      const d = (p.details ?? {}) as Stored;
      return {
        slug: p.slug,
        title: p.title,
        tier: str(d.tier) ?? p.title,
        tagline: str(d.tagline) ?? "",
        audience: str(d.audience) ?? "",
        basedOn: str(d.basedOn),
        includes: lines(d.includes),
        image: "/images/home/jet-tarmac-900.webp",
        alt: "",
      };
    });
  return [...tiers, ...extra];
}
