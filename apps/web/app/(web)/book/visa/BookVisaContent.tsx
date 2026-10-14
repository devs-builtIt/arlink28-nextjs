"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PageBanner from "@/components/PageBanner";
import PartnerCards from "@/components/book/PartnerCards";
import ZanzibarEscapes from "@/components/book/ZanzibarEscapes";

type Partner = {
  name: string;
  logo: string;
  desc: string;
  tags: string[];
  getUrl: (params: { to: string }) => string;
};

const partners: Partner[] = [
  {
    name: "iVisa",
    logo: "/images/partners/ivisa.png",
    desc: "Online visa applications for tourist, business and e-visas, with support for many destinations.",
    tags: ["E-visa", "Tourist visa", "Business visa"],
    getUrl: ({ to }) => `https://www.ivisa.com/apply?nationality=NG&destination=${encodeURIComponent(to)}`,
  },
  {
    name: "Sherpa",
    logo: "/images/partners/sherpa.png",
    desc: "Travel requirement and visa guidance for your route, so you know what you need before you travel.",
    tags: ["Visa requirements", "Entry rules", "Health documents"],
    getUrl: ({ to }) =>
      `https://apply.joinsherpa.com/travel-requirements?affiliateId=arlink28&from=NG&to=${encodeURIComponent(to)}`,
  },
];

export default function BookVisaContent() {
  const to = useSearchParams().get("to") || "";

  return (
    <>
      <PageBanner
        label="Visas"
        above={
          <Link href="/" className="pb-back">
            <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
            Back to search
          </Link>
        }
        title={
          <>
            Choose your
            <br />
            visa partner
          </>
        }
        intro="Our trusted visa partners will guide you through the application process and help you with the application."
      />
      <div className="book-page">
        {to && (
          <div className="book-search-summary">
            <div className="book-search-tag">
              <i className="fa-solid fa-passport"></i> Destination: <span>{to}</span>
            </div>
          </div>
        )}
        <PartnerCards
          partners={partners.map(({ getUrl, ...p }) => ({ ...p, href: getUrl({ to }), cta: "Apply with" }))}
        />
        <ZanzibarEscapes text="Already sorted on your visa? Pair your trip with a curated Zanzibar escape — from solo getaways to royal villas for groups." />
      </div>
    </>
  );
}
