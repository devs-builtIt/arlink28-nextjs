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
    name: "GetYourGuide",
    logo: "/images/partners/getyourguide.png",
    desc: "A marketplace for tours, attractions and activities across Africa and beyond.",
    tags: ["Tours & activities", "Day trips", "Attraction tickets"],
    getUrl: ({ to }) => `https://www.getyourguide.com/s/?q=${encodeURIComponent(to || "Africa")}`,
  },
  {
    name: "Viator",
    logo: "/images/partners/viator.png",
    desc: "A TripAdvisor company offering bookable tours, excursions and experiences at your destination.",
    tags: ["Tours & experiences", "Guided tours", "Adventure"],
    getUrl: () => "https://www.viator.com/?pid=P00304315&mcid=42383&medium=link",
  },
  {
    name: "Trip.com",
    logo: "/images/partners/trip.png",
    desc: "Holiday packages that combine flights, hotels and transfers.",
    tags: ["Flight + hotel", "Group packages"],
    getUrl: ({ to, date }) =>
      `https://www.trip.com/holidays/?destination=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`,
  },
];

export default function BookHolidayContent() {
  const params = useSearchParams();
  const to = params.get("to") || "";
  const date = params.get("date") || "";

  return (
    <>
      <PageBanner
        label="Holiday packages"
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
            holiday partner
          </>
        }
        intro="Explore curated holiday packages and experiences with our trusted partners. Pick one to continue your booking."
      />
      <div className="book-page">
        {(to || date) && (
          <div className="book-search-summary">
            {to && (
              <div className="book-search-tag">
                <i className="fa-solid fa-umbrella-beach"></i> Destination: <span>{to}</span>
              </div>
            )}
            {date && (
              <div className="book-search-tag">
                <i className="fa-solid fa-calendar"></i> Date: <span>{date}</span>
              </div>
            )}
          </div>
        )}
        <PartnerCards
          partners={partners.map(({ getUrl, ...p }) => ({ ...p, href: getUrl({ to, date }), cta: "Explore with" }))}
        />
        <ZanzibarEscapes text="Curated Zanzibar holiday packages — from solo getaways to royal villas for groups." />
      </div>
    </>
  );
}
