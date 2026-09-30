import Link from "next/link";
import "../../styles/packages.css";

export default function PackageNotFound() {
  return (
    <>
      <div className="pkgs-topband" />
      <div className="pkgs-detail">
        <div className="pkgs-empty">
          <h1>This package isn&apos;t available</h1>
          <p>It may have been taken off the site, or the address may be wrong. You can browse all current packages.</p>
          <Link className="pkgs-button" href="/packages">
            See all packages
          </Link>
        </div>
      </div>
    </>
  );
}
