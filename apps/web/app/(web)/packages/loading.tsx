import "../styles/packages.css";

/** The list's shape while it loads: the hero and search bar, then a grid of quiet placeholder cards. */
export default function Loading() {
  return (
    <>
      <section className="pkgs-hero">
        <div className="pkgs-hero-inner">
          <h1>Find your next safari</h1>
          <p>Safari and lodge packages across Africa, with the price up front.</p>
        </div>
      </section>
      <div className="pkgs-searchwrap" aria-hidden="true">
        <div className="pkgs-search pkgs-search-skeleton"></div>
      </div>
      <div className="pkgs-page" role="status" aria-label="Loading packages">
        <div className="pkgs-grid" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <article className="pkgs-card" key={i}>
              <span className="pkgs-card-media pkgs-sk" />
              <div className="pkgs-card-body">
                <div className="pkgs-sk-stack">
                  <span className="pkgs-sk" style={{ height: 18, width: "80%" }} />
                  <span className="pkgs-sk" style={{ height: 13, width: "55%" }} />
                  <span className="pkgs-sk" style={{ height: 12, width: "70%" }} />
                </div>
              </div>
              <div className="pkgs-card-price">
                <span className="pkgs-sk" style={{ height: 22, width: 110 }} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
