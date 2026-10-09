import "./globals.css";
import "../styles/tokens.css";
import "../styles/chrome.css";
import "../styles/page-banner.css";
import { siteMetadata } from "../site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ClientEffects from "@/components/ClientEffects";
import BackToTop from "@/components/BackToTop";

export const metadata = siteMetadata;

// The pages in this group are still dark-only, so their header and footer stay dark whatever the visitor's
// theme is. display: contents keeps the wrapper out of the layout.
export default function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div data-theme="dark" style={{ display: "contents" }}>
        <Header />
      </div>
      <main id="main" style={{ flex: 1 }}>
        {children}
      </main>
      <div data-theme="dark" style={{ display: "contents" }}>
        <Footer />
      </div>
      <ClientEffects />
      <BackToTop />
    </>
  );
}
