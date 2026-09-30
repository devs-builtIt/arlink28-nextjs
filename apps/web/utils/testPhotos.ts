// TEST PHOTOS, for while packages have no real photography.
//
// Packages that have no uploaded photo (and the seeded ones whose "photo" is a poster) show stock
// photos from Unsplash instead, so the pages can be judged with real imagery. Nothing is written to
// the database by this file.
//
// The API can also store test photos for real: `dotnet run -- seed-photos` in arlink28-api downloads
// the same photos into media storage and adds four per package. Once a package has those (or any
// upload), this fallback steps aside for it.
//
// On in development. Anywhere else it needs TEST_PHOTOS=true, so stock photos can't reach the live
// site by accident. To retire it: delete this file and its two call sites (PackageCard, the package
// page); uploaded photos then show on their own.

export const testPhotosEnabled = () => process.env.TEST_PHOTOS === "true" || process.env.NODE_ENV === "development";

/** Uploaded through the admin, as opposed to a poster that shipped with the site. */
export const isUploaded = (path: string | null | undefined) => !!path?.startsWith("/media/");

type Photo = { id: string; alt: string };

// Unsplash photo ids (free to use). Each was checked to load and to show what the alt text says.
const P = {
  giraffe: { id: "1554490828-442467b562dd", alt: "A giraffe on the open plains" },
  giraffeHerd: { id: "1632518876532-8a2a3c735705", alt: "Giraffes crossing dry grassland" },
  giraffePool: { id: "1515914560649-8fe5d631aa62", alt: "A guest watching a giraffe from a lodge pool" },
  lion: { id: "1754424612239-677364e244d6", alt: "A lion in tall grass" },
  elephants: { id: "1592670130129-4388cdb9d76e", alt: "Elephants crossing a dirt road" },
  savanna: { id: "1547471080-7cc2caa01a7e", alt: "An acacia tree at sunset on the savanna" },
  lodge: { id: "1779216175784-a67b6da108bb", alt: "The open-air lounge of a thatched lodge" },
  lodgePool: { id: "1781039869379-5561fe260d26", alt: "A safari lodge and its pool at dusk" },
  lodgeDining: { id: "1722645390607-9f69ce4cfadf", alt: "A lodge dining room with a timber ceiling" },
  beach: { id: "1607444807093-eefb769187da", alt: "A beach and turquoise water from above" },
  palms: { id: "1665449417444-fe7fec4b7425", alt: "Palm trees on a beach" },
} satisfies Record<string, Photo>;

const SETS: Record<string, Photo[]> = {
  nairobi: [P.giraffe, P.giraffeHerd, P.giraffePool, P.lodgeDining, P.lodge, P.savanna],
  "masai-mara": [P.lion, P.savanna, P.lodge, P.giraffeHerd, P.lodgePool, P.elephants],
  samburu: [P.elephants, P.savanna, P.lion, P.lodgePool, P.lodge, P.giraffe],
  zanzibar: [P.beach, P.palms, P.lodgePool, P.lodge, P.lodgeDining, P.savanna],
};
const FALLBACK: Photo[] = [P.savanna, P.giraffeHerd, P.lodge, P.lion, P.lodgePool, P.elephants];

const hash = (text: string) => [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/**
 * Stock photos for a package: its destination's set, started at a different photo for each package
 * so a list of them doesn't repeat one picture. The first is the lead photo.
 */
export function testPhotosFor(
  packageSlug: string,
  destinationSlug: string,
  { count = 6, width = 1200 }: { count?: number; width?: number } = {},
): { src: string; alt: string }[] {
  const set = SETS[destinationSlug] ?? FALLBACK;
  const start = hash(packageSlug) % set.length;
  return Array.from({ length: Math.min(count, set.length) }, (_, i) => {
    const photo = set[(start + i) % set.length];
    return {
      src: `https://images.unsplash.com/photo-${photo.id}?auto=format&fit=crop&w=${width}&q=75`,
      alt: photo.alt,
    };
  });
}
