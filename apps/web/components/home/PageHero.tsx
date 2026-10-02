type Props = {
  id: string;
  title: string;
  text: string;
  image: string;
  position?: string;
};

/** A short full-width photo hero for inner pages. It runs behind the header and takes the page's one h1. */
export default function PageHero({ id, title, text, image, position = "50% 55%" }: Props) {
  return (
    <section className="hm-phero" aria-labelledby={id}>
      <img src={image} alt="" width={1920} height={1080} fetchPriority="high" style={{ objectPosition: position }} />
      <div className="hm-wrap hm-phero-in">
        <h1 id={id}>{title}</h1>
        <p>{text}</p>
      </div>
    </section>
  );
}
