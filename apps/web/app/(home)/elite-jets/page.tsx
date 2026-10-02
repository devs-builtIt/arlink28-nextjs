import type { Metadata } from "next";
import Link from "next/link";
import "../../styles/home.css";
import { WHATSAPP_URL } from "@/content/home-proof";

export const metadata: Metadata = {
  title: "Elite Jets | ARLink28",
  description: "Private jet enquiries with ARLink28.",
  // A holding page until the service has its real content.
  robots: { index: false, follow: true },
};

export default function EliteJetsPage() {
  return (
    <div className="hm">
      <section className="hm-page hm-wrap">
        <h1>Elite Jets</h1>
        <p>Tell us where you want to fly, when, and with how many people, and the team will come back with options.</p>
        <div className="hm-actions">
          <Link className="hm-btn hm-btn-primary" href="/contact?type=Booking">
            Make an enquiry
          </Link>
          <a className="hm-btn hm-btn-quiet" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <i className="fa-brands fa-whatsapp" aria-hidden="true"></i>
            WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
