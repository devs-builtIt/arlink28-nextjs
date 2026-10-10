import type { Metadata } from "next";
import "../../styles/home.css";
import PageBanner from "@/components/PageBanner";
import ClosingCta from "@/components/home/ClosingCta";
import LegalLayout from "@/components/home/LegalLayout";

export const metadata: Metadata = {
  title: "Cookie Policy | ARLink28",
  description: "How ARLink28 uses cookies and similar technologies on our website.",
};

export default function CookiePolicyPage() {
  return (
    <div className="hm">
      <PageBanner label="Legal" title={"Cookie Policy"} intro="Last updated: June 2026" />
      <LegalLayout
        current="cookie-policy"
        toc={[
          { id: "1-what-are-cookies", label: "1. What Are Cookies?" },
          { id: "2-why-arlink28-uses-cookies", label: "2. Why ARLink28 Uses Cookies" },
          { id: "3-types-of-cookies-we-use", label: "3. Types of Cookies We Use" },
          { id: "4-third-party-cookies", label: "4. Third-Party Cookies" },
          { id: "5-information-collected-through-cookies", label: "5. Information Collected Through Cookies" },
          { id: "6-managing-cookie-preferences", label: "6. Managing Cookie Preferences" },
          { id: "7-consequences-of-disabling-cookies", label: "7. Consequences of Disabling Cookies" },
          { id: "8-data-protection", label: "8. Data Protection" },
          { id: "9-updates-to-this-cookie-policy", label: "9. Updates to This Cookie Policy" },
          { id: "10-contact-information", label: "10. Contact Information" },
        ]}
      >
        <p>
          This Cookie Policy explains how ARLink28 ("ARLink28", "we", "our", or "us") uses cookies and similar
          technologies when you visit our website, use our services, or interact with our digital platforms.
        </p>
        <p>
          By continuing to use the ARLink28 website, you agree to the use of cookies in accordance with this Cookie
          Policy, unless you choose to disable them through your browser settings or cookie preferences.
        </p>
        <h2 id="1-what-are-cookies">1. What Are Cookies?</h2>
        <p>
          Cookies are small text files stored on your computer, smartphone, tablet, or other device when you visit a
          website.
        </p>
        <p>
          Cookies help websites remember information about your visit, improve functionality, personalise user
          experiences, and provide insights into website performance.
        </p>
        <p>Cookies do not generally give us direct access to your device or personal files.</p>
        <h2 id="2-why-arlink28-uses-cookies">2. Why ARLink28 Uses Cookies</h2>
        <p>ARLink28 uses cookies to:</p>
        <ul className="legal-list">
          <li>Improve website performance</li>
          <li>Enhance user experience</li>
          <li>Remember user preferences</li>
          <li>Support website security</li>
          <li>Analyse website traffic</li>
          <li>Measure marketing effectiveness</li>
          <li>Monitor website functionality</li>
          <li>Facilitate travel booking processes</li>
          <li>Support affiliate tracking systems</li>
        </ul>
        <p>Cookies help us deliver a smoother and more personalised experience to visitors.</p>
        <h2 id="3-types-of-cookies-we-use">3. Types of Cookies We Use</h2>
        <h3>Essential Cookies</h3>
        <p>Essential cookies are necessary for the operation of our website.</p>
        <p>These cookies enable core website functions such as:</p>
        <ul className="legal-list">
          <li>Page navigation</li>
          <li>Security features</li>
          <li>Form submissions</li>
          <li>Session management</li>
          <li>User authentication</li>
        </ul>
        <p>Without these cookies, certain website features may not function properly.</p>
        <h3>Performance and Analytics Cookies</h3>
        <p>These cookies help us understand how visitors interact with our website.</p>
        <p>They may collect information such as:</p>
        <ul className="legal-list">
          <li>Number of visitors</li>
          <li>Most visited pages</li>
          <li>Traffic sources</li>
          <li>Time spent on pages</li>
          <li>User interactions</li>
        </ul>
        <p>This information helps ARLink28 improve website performance and user experience.</p>
        <p>Examples may include analytics tools such as:</p>
        <ul className="legal-list">
          <li>Google Analytics</li>
          <li>Website performance monitoring tools</li>
          <li>User behaviour analysis platforms</li>
        </ul>
        <p>Information collected is generally aggregated and anonymised where possible.</p>
        <h3>Functional Cookies</h3>
        <p>Functional cookies allow the website to remember user preferences and settings.</p>
        <p>These cookies may remember:</p>
        <ul className="legal-list">
          <li>Language preferences</li>
          <li>Region selections</li>
          <li>User settings</li>
          <li>Saved preferences</li>
        </ul>
        <p>Functional cookies help provide a more personalised experience during future visits.</p>
        <h3>Marketing and Advertising Cookies</h3>
        <p>Marketing cookies may be used to:</p>
        <ul className="legal-list">
          <li>Deliver relevant advertising</li>
          <li>Measure campaign effectiveness</li>
          <li>Track user engagement</li>
          <li>Support remarketing activities</li>
        </ul>
        <p>These cookies may be placed by ARLink28 or approved third-party marketing providers.</p>
        <p>Marketing cookies help ensure that users receive more relevant content and promotional information.</p>
        <h3>Affiliate Tracking Cookies</h3>
        <p>As part of our travel ecosystem, ARLink28 works with affiliate partners and travel providers.</p>
        <p>Affiliate tracking cookies help identify when users:</p>
        <ul className="legal-list">
          <li>Click affiliate links</li>
          <li>Visit partner websites</li>
          <li>Complete bookings or purchases</li>
        </ul>
        <p>These cookies allow affiliate partners to recognise referrals originating from ARLink28.</p>
        <p>
          Affiliate tracking helps support the operation and development of our platform through commission-based
          partnerships.
        </p>
        <h2 id="4-third-party-cookies">4. Third-Party Cookies</h2>
        <p>
          Some cookies may be placed by third-party providers whose services are integrated into the ARLink28 website.
        </p>
        <p>These providers may include:</p>
        <ul className="legal-list">
          <li>Travel booking partners</li>
          <li>Affiliate networks</li>
          <li>Analytics providers</li>
          <li>Payment processors</li>
          <li>Marketing platforms</li>
          <li>Social media services</li>
        </ul>
        <p>Examples may include services associated with:</p>
        <ul className="legal-list">
          <li>Sherpa</li>
          <li>Viator</li>
          <li>Trip.com</li>
          <li>GetYourGuide</li>
          <li>iVisa</li>
          <li>Travelstart</li>
        </ul>
        <p>
          ARLink28 does not control the cookies placed directly by third-party websites after users leave our platform.
        </p>
        <p>Users are encouraged to review the cookie and privacy policies of those providers.</p>
        <h2 id="5-information-collected-through-cookies">5. Information Collected Through Cookies</h2>
        <p>Cookies may collect information such as:</p>
        <ul className="legal-list">
          <li>Device type</li>
          <li>Browser type</li>
          <li>IP address</li>
          <li>Operating system</li>
          <li>Pages visited</li>
          <li>Time spent on the website</li>
          <li>Referral source</li>
          <li>Click activity</li>
          <li>Website preferences</li>
        </ul>
        <p>Cookies generally do not collect sensitive personal information unless voluntarily provided by the user.</p>
        <h2 id="6-managing-cookie-preferences">6. Managing Cookie Preferences</h2>
        <p>Users have the ability to manage or disable cookies through browser settings.</p>
        <p>Most web browsers allow users to:</p>
        <ul className="legal-list">
          <li>View stored cookies</li>
          <li>Delete cookies</li>
          <li>Block cookies</li>
          <li>Restrict third-party cookies</li>
          <li>Set notifications before cookies are stored</li>
        </ul>
        <p>Instructions can typically be found within browser help settings.</p>
        <p>Please note that disabling cookies may affect website functionality and user experience.</p>
        <h2 id="7-consequences-of-disabling-cookies">7. Consequences of Disabling Cookies</h2>
        <p>If cookies are disabled, some features of the ARLink28 website may not function correctly.</p>
        <p>This may affect:</p>
        <ul className="legal-list">
          <li>Website performance</li>
          <li>Booking processes</li>
          <li>Form submissions</li>
          <li>User preferences</li>
          <li>Website personalisation</li>
          <li>Certain partner integrations</li>
        </ul>
        <p>Users may still access portions of the website, but functionality may be limited.</p>
        <h2 id="8-data-protection">8. Data Protection</h2>
        <p>Information collected through cookies is handled in accordance with the ARLink28 Privacy Policy.</p>
        <p>
          We take reasonable measures to protect information collected through our website and use cookies responsibly
          to support operational and customer service objectives.
        </p>
        <p>For more information regarding how we process personal information, please review our Privacy Policy.</p>
        <h2 id="9-updates-to-this-cookie-policy">9. Updates to This Cookie Policy</h2>
        <p>ARLink28 reserves the right to modify or update this Cookie Policy at any time to reflect:</p>
        <ul className="legal-list">
          <li>Changes in technology</li>
          <li>New services</li>
          <li>Legal requirements</li>
          <li>Regulatory updates</li>
          <li>Operational changes</li>
        </ul>
        <p>Updated versions will be published on the website and become effective upon publication.</p>
        <p>Users are encouraged to review this policy periodically.</p>
        <h2 id="10-contact-information">10. Contact Information</h2>
        <p>
          If you have questions regarding this Cookie Policy or the use of cookies on the ARLink28 website, please
          contact:
        </p>
        <p>ARLink28</p>
        <p>
          Email: <a href="mailto:info@arlink28.com">info@arlink28.com</a>
        </p>
        <p>
          Website: <a href="http://www.arlink28.com">www.arlink28.com</a>
        </p>
        <p>
          ARLink28 is committed to maintaining transparency regarding the technologies used on our website while
          providing a secure, efficient, and user-friendly travel experience for travellers across Africa and beyond.
        </p>
        <p>
          <strong>ARLink28</strong>
        </p>
        <p>
          <strong>Connecting Dreams. Connecting Africa.</strong>
        </p>
      </LegalLayout>
      <ClosingCta
        pill="Legal"
        heading={["Questions about", "this policy?"]}
        text="If anything here is unclear, send us a message and a person replies."
        cta="Contact us"
        href="/contact"
      />
    </div>
  );
}
