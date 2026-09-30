import "../../styles/packages.css";

/** The package page's shape while it loads: title, photos, and the two columns. */
export default function Loading() {
  return (
    <>
      <div className="pkgs-topband" />
      <div className="pkgs-detail" role="status" aria-label="Loading package">
        <div className="pkgs-detail-head">
          <div className="pkgs-sk-stack" style={{ gap: 14 }}>
            <span className="pkgs-sk" style={{ height: 34, width: "min(520px, 70%)" }} />
            <span className="pkgs-sk" style={{ height: 16, width: 300 }} />
          </div>
        </div>
        <div className="pkgs-gallery" data-count="5" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="pkgs-gallery-tile pkgs-sk" />
          ))}
        </div>
        <div className="pkgs-cols" aria-hidden="true">
          <div className="pkgs-main">
            <div className="pkgs-sk-stack" style={{ gap: 12 }}>
              <span className="pkgs-sk" style={{ height: 26, width: 160 }} />
              {[100, 96, 92, 98, 60].map((w, i) => (
                <span key={i} className="pkgs-sk" style={{ height: 14, width: `${w}%` }} />
              ))}
            </div>
          </div>
          <div className="pkgs-book">
            <div className="pkgs-sk-stack" style={{ gap: 14 }}>
              <span className="pkgs-sk" style={{ height: 34, width: 140 }} />
              <span className="pkgs-sk" style={{ height: 44, width: "100%" }} />
              <span className="pkgs-sk" style={{ height: 44, width: "100%" }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
