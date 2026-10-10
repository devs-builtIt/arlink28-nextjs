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
  getUrl: (params: { from: string; to: string; date: string; seat: string }) => string;
};

const partners: Partner[] = [
  {
    name: "Travelstart",
    logo: "/images/partners/travelstart.png",
    desc: "A travel marketplace for flights, hotels and holiday packages across Africa and beyond.",
    tags: ["Domestic", "International"],
    getUrl: () => "https://www.travelstart.com.ng/?affId=223707&utm_source=affiliate&utm_medium=223707",
  },
  {
    name: "Trip.com",
    logo: "/images/partners/trip.png",
    desc: "A global travel platform for flights, hotels, trains and car rentals.",
    tags: ["Global routes", "One-way and return", "Multi-city"],
    getUrl: () => "https://www.trip.com/t/jPlYBCFNuU2",
  },
];

export default function BookFlightContent() {
  const params = useSearchParams();
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const date = params.get("date") || "";
  const seat = params.get("seat") || "economy";

  return (
    <>
      <PageBanner
        label="Flights"
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
            flight partner
          </>
        }
        intro="Select a trusted partner below to complete your booking. You'll be taken to their site with your search details pre-filled where possible."
      />
      <div className="book-page">
        {(from || to || date) && (
          <div className="book-search-summary">
            {from && (
              <div className="book-search-tag">
                <i className="fa-solid fa-plane-departure"></i> From: <span>{from}</span>
              </div>
            )}
            {to && (
              <div className="book-search-tag">
                <i className="fa-solid fa-plane-arrival"></i> To: <span>{to}</span>
              </div>
            )}
            {date && (
              <div className="book-search-tag">
                <i className="fa-solid fa-calendar"></i> Date: <span>{date}</span>
              </div>
            )}
            {seat && (
              <div className="book-search-tag">
                <i className="fa-solid fa-chair"></i> Class: <span>{seat}</span>
              </div>
            )}
          </div>
        )}
        <PartnerCards
          partners={partners.map(({ getUrl, ...p }) => ({
            ...p,
            href: getUrl({ from, to, date, seat }),
            cta: "Book with",
          }))}
        />
        <ZanzibarEscapes text="Pair your flight with a curated Zanzibar stay — from solo getaways to royal villas for groups." />
      </div>
    </>
  );
}
