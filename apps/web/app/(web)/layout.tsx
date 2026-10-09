import "./globals.css";
import "../styles/tokens.css";
import "../styles/chrome.css";
import "../styles/page-banner.css";
import "../styles/inner-light.css";
import { siteMetadata } from "../site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ClientEffects from "@/components/ClientEffects";
import BackToTop from "@/components/BackToTop";

export const metadata = siteMetadata;

// The header and footer follow the page: light on every inner page (see styles/inner-light.css).
export default function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main" style={{ flex: 1 }}>
        {children}
      </main>
      <Footer />
      <ClientEffects />
      <BackToTop />
    </>
  );
}
