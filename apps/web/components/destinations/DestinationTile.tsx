import Link from "next/link";
import type { DestinationResponse } from "@arlink28/api-client";

/** A place with a photo: the picture, then its name and a line about it. The whole tile is one link. */
export default function DestinationTile({
  place,
  priority = false,
}: {
  place: DestinationResponse;
  priority?: boolean;
}) {
  return (
    <article className="dst-tile">
      <Link className="dst-tile-link" href={`/destinations/${place.slug}`}>
        <span className="dst-tile-media">
          {place.heroPath && (
            <img
              src={place.heroPath}
              alt={place.heroAlt ?? ""}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              width={960}
              height={640}
            />
          )}
        </span>
        <span className="dst-tile-name">{place.name}</span>
        {(place.tagline ?? place.summary) && <span className="dst-tile-line">{place.tagline ?? place.summary}</span>}
      </Link>
    </article>
  );
}
