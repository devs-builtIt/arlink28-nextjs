import "../../styles/destination-pages.css";

/** The index while it loads: the hero, then two quiet rows of placeholder tiles. */
export default function Loading() {
  return (
    <>
      <section className="dst-hero">
        <div className="dst-hero-inner">
          <h1>Destinations</h1>
          <p>Where ARLink28 can take you across Africa. Choose a country, or go straight to a place.</p>
        </div>
      </section>
      <div className="dst-page" role="status" aria-label="Loading destinations">
        <div className="dst-tiles dst-tiles-lead" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div className="dst-tile" key={i}>
              <span className="dst-tile-media dst-sk" />
              <span className="dst-sk" style={{ height: 16, width: "55%", marginTop: 12 }} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
