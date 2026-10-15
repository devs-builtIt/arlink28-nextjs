import "@/app/styles/home.css";

import ClosingCta from "@/components/home/ClosingCta";
import FaqSection from "@/components/home/FaqSection";
import Reveal from "@/components/home/Reveal";
import { SERVICE_FAQS } from "@/content/service-faqs";

/** The end of every service page: the FAQ for that service, then the full-width closing call to action. */
export default function ServiceFooter({ service }: { service: keyof typeof SERVICE_FAQS }) {
  return (
    <div className="hm">
      <Reveal />
      <FaqSection items={SERVICE_FAQS[service]} />
      <ClosingCta bleed />
    </div>
  );
}
