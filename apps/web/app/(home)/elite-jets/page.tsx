import type { Metadata } from "next";
import Link from "next/link";
import "../../styles/home.css";
import "../../(web)/styles/packages.css";
import PageBanner from "@/components/PageBanner";
import ClosingCta from "@/components/home/ClosingCta";
import FaqSection from "@/components/home/FaqSection";
import Reveal from "@/components/home/Reveal";
import StepsOnPhoto from "@/components/home/StepsOnPhoto";
import { ListingProvider, type ListingParams } from "@/components/packages/ListingContext";
import ResultsBar, { ResultsFrame } from "@/components/packages/ResultsBar";
import Pagination from "@/components/packages/Pagination";
import KindSwitcher from "@/components/products/KindSwitcher";
import ProductSearch from "@/components/products/ProductSearch";
import { SERVICE_FAQS } from "@/content/service-faqs";
import { loadEliteTiers } from "@/utils/server/elite";

export const metadata: Metadata = {
  title: "Elite private aviation | ARLink28",
  description:
    "ARLink28 Elite, Elite Signature and Bespoke: private aircraft charter with ground transfers, meet and greet and the level of personal service you choose.",
};

const STEPS = [
  {
    title: "Tell us the journey",
    text: "Where you want to fly, when, and with how many people. Choose a tier, or tell us what you have in mind.",
  },
  {
    title: "We come back with options",
    text: "A member of the Elite team replies with aircraft options and a quote, and checks the details with you.",
  },
  {
    title: "You decide",
    text: "Nothing is charged until you agree. Once you do, we coordinate the flight, the ground and the welcome.",
  },
];

const PAGE_SIZE = 6;

const SORTS: [string, string][] = [
  ["", "Featured first"],
  ["name", "Name, A to Z"],
];

type Search = { searchParams: Record<string, string | string[] | undefined> };
const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export default async function EliteJetsPage({ searchParams }: Search) {
  const all = await loadEliteTiers();
  const bySlug = new Map(all.map((t) => [t.slug, t]));

  // The search box and the tier filter use the same controls as the other service pages. The tier travels in the
  // `destination` slot of the shared list parameters, and the tiers stand in for destinations in the filter.
  const params: ListingParams = {
    destination: one(searchParams.destination),
    category: "",
    partner: "",
    adults: "",
    sort: one(searchParams.sort),
    q: one(searchParams.q).trim(),
  };
  const words = params.q.toLowerCase();
  let tiers = all.filter(
    (t) =>
      (!params.destination || t.slug === params.destination) &&
      (!words || [t.title, t.tier, t.tagline, t.audience, ...t.includes].join(" ").toLowerCase().includes(words)),
  );
  if (params.sort === "name") tiers = [...tiers].sort((a, b) => a.title.localeCompare(b.title));
  const filtered = !!(params.q || params.destination);
  const tierOptions = all.map((t) => ({ slug: t.slug, name: t.title }));

  const pages = Math.max(1, Math.ceil(tiers.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number.parseInt(one(searchParams.page), 10) || 1), pages);
  const visible = tiers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hrefFor = (n: number) => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.destination) query.set("destination", params.destination);
    if (params.sort) query.set("sort", params.sort);
    if (n > 1) query.set("page", String(n));
    const qs = query.toString();
    return qs ? `/elite-jets?${qs}` : "/elite-jets";
  };

  return (
    <div className="hm">
      <Reveal />
      <ListingProvider params={params}>
        <PageBanner
          overlap
          label="ARLink28 Elite"
          photo="elite"
          id="el-h1"
          above={<KindSwitcher active="/elite-jets" />}
          title={
            <>
              Private aircraft charter,
              <br />
              ground transfers included.
            </>
          }
          intro="Ways to fly private with ARLink28, from the essentials done well to a journey designed entirely for you."
        />

        <div className="pkgs-searchwrap">
          <ProductSearch
            destinations={tierOptions}
            placeholder="Tier, service or inclusion"
            label="Elite tiers"
            filterLabel="Tier"
            allLabel="All tiers"
          />
        </div>

        <div className="pkgs-page">
          <ResultsBar total={tiers.length} destinations={tierOptions} noun={["tier", "tiers"]} sorts={SORTS} />
          <ResultsFrame label="Elite tiers">
            {tiers.length === 0 ? (
              <div className="pkgs-empty">
                <h2>No tiers found</h2>
                <p>
                  Nothing matches these filters. Try removing one, or tell us what you have in mind and we will help.
                </p>
                <Link className="pkgs-button" href={filtered ? "/elite-jets" : "/contact?type=Booking"}>
                  {filtered ? "Clear all filters" : "Contact us"}
                </Link>
              </div>
            ) : (
              <>
                <ol className="el-tiers">
                  {visible.map((t) => {
                    const base = t.basedOn ? bySlug.get(t.basedOn) : undefined;
                    return (
                      <li key={t.slug} id={t.slug} className="el-tier">
                        <div className="el-tier-photo">
                          <img src={t.image} alt={t.alt} loading="lazy" decoding="async" width={900} height={675} />
                        </div>
                        <div className="el-tier-body">
                          <p className="el-tier-no">Tier 0{all.indexOf(t) + 1}</p>
                          <h3>{t.title}</h3>
                          <p className="el-tier-tag">{t.tagline}</p>
                          {t.audience && <p className="el-tier-aud">{t.audience}</p>}
                          <p className="el-tier-inc">{base ? `Everything in ${base.title}, plus` : "Includes"}</p>
                          <ul>
                            {t.includes.map((x) => (
                              <li key={x}>{x}</li>
                            ))}
                          </ul>
                          <Link className="hm-btn hm-btn-primary" href={`/contact?type=Booking&slug=${t.slug}`}>
                            Enquire about {t.tier}
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ol>
                <Pagination page={page} pageSize={PAGE_SIZE} total={tiers.length} hrefFor={hrefFor} noun="tiers" />
              </>
            )}
          </ResultsFrame>
        </div>
      </ListingProvider>

      <StepsOnPhoto
        id="el-how"
        heading={
          <>
            From enquiry
            <br />
            to take-off.
          </>
        }
        steps={STEPS}
        photo="/images/home/jet-sunset-1600.webp"
        focus="50% 60%"
        cta={{ href: "/contact?type=Booking", label: "Book a charter" }}
      />

      <FaqSection items={SERVICE_FAQS.elite} />
      <ClosingCta bleed />
    </div>
  );
}
