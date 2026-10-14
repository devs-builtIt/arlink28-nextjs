import "../(web)/globals.css";
import "../styles/tokens.css";
import "../styles/chrome.css";
import "../styles/page-banner.css";
import "../styles/inner-light.css";
import "../styles/home-base.css";
import { siteMetadata } from "../site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";

export const metadata = siteMetadata;

// The redesigned pages: light only for now. Pass `themable` to Header to bring the theme toggle back.
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="home-root">
      <Header />
      <main id="main" style={{ flex: 1 }}>
        {children}
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
