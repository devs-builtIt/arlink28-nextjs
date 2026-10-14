import type { Metadata } from "next";
import "../../styles/home.css";
import PageBanner from "@/components/PageBanner";
import ClosingCta from "@/components/home/ClosingCta";
import ServicesTabs from "@/components/home/ServicesTabs";
import Reveal from "@/components/home/Reveal";
import { SERVICES } from "@/content/services";

export const metadata: Metadata = {
  title: "Services | ARLink28",
  description:
    "Flights, hotel reservations, visa support, holidays, private jet charter, group travel, airport transfers and travel insurance, arranged by one team across Africa and beyond.",
};

export default function ServicesPage() {
  return (
    <div className="hm">
      <Reveal />
      <PageBanner
        label="Services"
        title={
          <>
            One team for the
            <br />
            whole journey.
          </>
        }
        intro="Flights, hotels, visas, holidays, private jets, group travel, transfers and insurance, arranged by people you can speak to."
      />

      <section className="hm-sec hm-sec-white" data-tone="light" aria-label="Our services">
        <div className="hm-wrap">
          <ServicesTabs services={SERVICES} />
        </div>
      </section>

      <ClosingCta />
    </div>
  );
}
