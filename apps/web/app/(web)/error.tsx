"use client";

import "../styles/home.css";
import ErrorPanel from "@/components/home/ErrorPanel";

// A page in this part of the site failed. The header and footer stay; this fills the page.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorPanel kind="error" reset={reset} digest={error.digest} />;
}
