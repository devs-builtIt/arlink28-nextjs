import type { Metadata } from "next";
import "../../styles/home.css";
import PageBanner from "@/components/PageBanner";
import ClosingCta from "@/components/home/ClosingCta";
import FaqSection from "@/components/home/FaqSection";
import Reveal from "@/components/home/Reveal";
import { SERVICE_FAQS } from "@/content/service-faqs";
import TeamGrid from "@/components/home/TeamGrid";
import { TEAM } from "@/content/team";

export const metadata: Metadata = {
  title: "Team | ARLink28",
  description:
    "The advisory chairman and the coordinators behind ARLink28, across aviation, finance, technology, partnerships, people and customer experience.",
};

export default function TeamPage() {
  return (
    <div className="hm">
      <Reveal />
      <PageBanner
        photo="namibia"
        label="Our team"
        title={
          <>
            The people
            <br />
            behind ARLink28.
          </>
        }
        intro="Our advisory chairman and ten coordinators, from aviation and finance to technology, partnerships and customer experience."
      />
      <TeamGrid people={TEAM} />
      <FaqSection items={SERVICE_FAQS.team} />
      <ClosingCta bleed />
    </div>
  );
}
