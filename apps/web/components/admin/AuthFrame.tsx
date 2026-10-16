import type { ReactNode } from "react";
import Brand from "./Brand";

type Props = {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
};

/**
 * Signed-out pages (sign in, password reset, accepting an invite): the homepage photograph on the left and the
 * form on the right (hidden on narrow screens).
 */
export default function AuthFrame({ title, intro, children }: Props) {
  return (
    <div className="auth">
      <main className="auth-main">
        {/* A full page load back to the public site, so its styles load cleanly. */}
        <a className="auth-logo" href="/" aria-label="ARLink28 home">
          <Brand size="l" />
        </a>
        <div className="auth-card">
          <h1 className="auth-title">{title}</h1>
          {intro && <p className="auth-intro">{intro}</p>}
          {children}
        </div>
        <p className="auth-back">
          <a href="/">Back to arlink28.com</a>
        </p>
      </main>
      {/* A photograph from the public homepage, so signing in feels like the same place, with a line about what staff do here. */}
      <aside className="auth-photo" aria-hidden="true">
        <img src="/images/home/slide-serengeti-1920.webp" alt="" width={1920} height={1280} />
        <p>Manage packages, enquiries and destinations in one place.</p>
      </aside>
    </div>
  );
}
