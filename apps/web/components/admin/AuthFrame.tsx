import type { ReactNode } from "react";
import Sign from "./Sign";
import Brand from "./Brand";

type Props = {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
};

/**
 * Signed-out pages (sign in, password reset, accepting an invite): the navy
 * "Staff only" gantry sign beside a single light form.
 */
export default function AuthFrame({ title, intro, children }: Props) {
  return (
    <div className="auth">
      <div className="auth-gantry">
        {/* A full page load back to the public site, so its styles load cleanly. */}
        <a className="auth-logo" href="/" aria-label="ARLink28 home">
          <Brand size="l" />
        </a>
        <div className="gantry-band">
          <Sign icon="fa-id-badge" size="hero" as="p">
            Staff only
          </Sign>
        </div>
      </div>

      <main className="auth-panel">
        <div className="auth-body">
          <h1 className="auth-title">{title}</h1>
          {intro && <p className="auth-intro">{intro}</p>}
          {children}
        </div>
      </main>
    </div>
  );
}
