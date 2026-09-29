import type { ReactNode } from "react";

type Props = {
  title: string;
  intro?: ReactNode;
  actions?: ReactNode;
};

/** Page title, a line on what the page is for, and the page's actions. */
export default function PageHead({ title, intro, actions }: Props) {
  return (
    // A div, not <header>: the public site styles bare `header` elements.
    <div className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {intro && <p className="page-intro">{intro}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}
