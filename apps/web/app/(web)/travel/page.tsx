import type { Metadata } from "next";
import "../../styles/home.css";
import PageBanner from "@/components/PageBanner";
import ClosingCta from "@/components/home/ClosingCta";
import FaqSection from "@/components/home/FaqSection";
import { SERVICE_FAQS } from "@/content/service-faqs";
import PartnerDirectory from "@/components/home/PartnerDirectory";
import Reveal from "@/components/home/Reveal";
import { TRAVEL_PARTNERS } from "@/content/travel-partners";

export const metadata: Metadata = {
  title: "Travel | ARLink28",
  description:
    "Flight options, travel partners, visa services and curated experiences across Africa and the world, with ARLink28.",
};

export default function TravelPage() {
  return (
    <div className="hm">
      <Reveal />
      <PageBanner
        label="Travel"
        title={
          <>
            Discover your
            <br />
            next journey.
          </>
        }
        intro="The travel partners we work with for flights, visas and experiences, and where to book with each."
      />

      <section className="hm-sec hm-sec-white" id="travel-partners" data-tone="light" aria-label="Travel partners">
        <div className="hm-wrap">
          <PartnerDirectory partners={TRAVEL_PARTNERS} />
        </div>
      </section>

      <FaqSection items={SERVICE_FAQS.travel} />
      <ClosingCta bleed />
    </div>
  );
}
