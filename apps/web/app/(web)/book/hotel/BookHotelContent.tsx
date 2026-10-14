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
  getUrl: (params: { to: string; date: string }) => string;
};

const partners: Partner[] = [
  {
    name: "Trip.com",
    logo: "/images/partners/trip.png",
    desc: "Hotels, apartments and resorts worldwide, from budget stays to luxury escapes.",
    tags: ["Worldwide", "Hotels", "Apartments", "Resorts"],
    getUrl: () => "https://www.trip.com/t/jPlYBCFNuU2",
  },
];

export default function BookHotelContent() {
  const params = useSearchParams();
  const to = params.get("to") || "";
  const date = params.get("date") || "";

  return (
    <>
      <PageBanner
        label="Hotels"
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
            hotel partner
          </>
        }
        intro="Select a trusted partner to find and book your accommodation. You'll be redirected to their site to complete your reservation."
      />
      <div className="book-page">
        {(to || date) && (
          <div className="book-search-summary">
            {to && (
              <div className="book-search-tag">
                <i className="fa-solid fa-location-dot"></i> Destination: <span>{to}</span>
              </div>
            )}
            {date && (
              <div className="book-search-tag">
                <i className="fa-solid fa-calendar"></i> Check-in: <span>{date}</span>
              </div>
            )}
          </div>
        )}
        <PartnerCards
          partners={partners.map(({ getUrl, ...p }) => ({ ...p, href: getUrl({ to, date }), cta: "Book with" }))}
        />
        <ZanzibarEscapes text="Pair your hotel stay with a curated Zanzibar escape — from solo getaways to royal villas for groups." />
      </div>
    </>
  );
}
