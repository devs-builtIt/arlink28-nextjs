"use client";

import { useState, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

/** A password field with an eye button that shows or hides what has been typed. */
export default function PasswordInput({ className = "input", ...rest }: Props) {
  const [shown, setShown] = useState(false);

  return (
    <div className="pw">
      <input {...rest} className={className} type={shown ? "text" : "password"} />
      <button
        type="button"
        className="pw-toggle"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "Hide password" : "Show password"}
        aria-pressed={shown}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          {shown && <path d="M4 4l16 16" />}
        </svg>
      </button>
    </div>
  );
}
