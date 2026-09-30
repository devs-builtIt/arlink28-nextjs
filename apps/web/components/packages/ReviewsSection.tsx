import { REVIEWS, SAMPLE, SUMMARY } from "@/content/sample-reviews";

function Stars({ score }: { score: number }) {
  return (
    <span className="pkgs-stars" role="img" aria-label={`${score} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <i
          key={i}
          className={`fa-solid fa-star${i < Math.round(score) ? "" : " pkgs-star-off"}`}
          aria-hidden="true"
        ></i>
      ))}
    </span>
  );
}

/** Guest reviews. Sample content for now, and labelled as such (see content/sample-reviews.ts). */
export default function ReviewsSection() {
  return (
    <section className="pkgs-section" id="reviews" aria-labelledby="reviews-title">
      <div className="pkgs-section-head">
        <h2 id="reviews-title">Guest reviews</h2>
        {SAMPLE && (
          <span className="pkgs-sample" title="Real guest reviews will replace these">
            Sample reviews
          </span>
        )}
      </div>

      <div className="pkgs-review-summary">
        <div className="pkgs-review-score">
          <strong>{SUMMARY.score.toFixed(1)}</strong>
          <div>
            <Stars score={SUMMARY.score} />
            <span>{SUMMARY.count} reviews</span>
          </div>
        </div>
        <dl className="pkgs-review-bars">
          {SUMMARY.breakdown.map((b) => (
            <div key={b.label}>
              <dt>{b.label}</dt>
              <dd>
                <span className="pkgs-bar" aria-hidden="true">
                  <span style={{ width: `${(b.score / 5) * 100}%` }} />
                </span>
                {b.score.toFixed(1)}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <ul className="pkgs-reviews">
        {REVIEWS.map((r) => (
          <li key={r.title}>
            <div className="pkgs-review-top">
              <Stars score={r.score} />
              <span>
                {r.name}, {r.when}
              </span>
            </div>
            <h3>{r.title}</h3>
            <p>{r.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
