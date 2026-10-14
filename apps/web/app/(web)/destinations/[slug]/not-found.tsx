import Link from "next/link";
import "../../styles/packages.css";
import "../../styles/destination-pages.css";

export default function DestinationNotFound() {
  return (
    <>
      <div className="pkgs-topband" />
      <div className="dst-page">
        <div className="dst-empty">
          <h1>This destination isn&apos;t available</h1>
          <p>It may not be published yet, or the address may be wrong. You can browse every destination we cover.</p>
          <Link className="dst-button" href="/destinations">
            See all destinations
          </Link>
        </div>
      </div>
    </>
  );
}
