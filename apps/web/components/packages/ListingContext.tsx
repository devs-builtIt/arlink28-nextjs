"use client";

import { createContext, useContext, useEffect, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

export type ListingParams = {
  destination: string;
  category: string;
  partner: string;
  adults: string;
  sort: string;
  q: string;
};

type Listing = {
  /** What the controls show. It changes the moment a choice is made; the results catch up. */
  params: ListingParams;
  /** Loads new results in place: the old ones stay, dimmed, until the new ones arrive. */
  go: (patch: Partial<ListingParams>) => void;
  pending: boolean;
};

const Context = createContext<Listing | null>(null);

export function useListing(): Listing {
  const value = useContext(Context);
  if (!value) throw new Error("useListing must be used inside <ListingProvider>.");
  return value;
}

/** Shares the list's filters between the search bar in the hero and the bar above the results. */
export function ListingProvider({ params: served, children }: { params: ListingParams; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [params, setParams] = useState(served);
  const servedKey = JSON.stringify(served);
  useEffect(() => setParams(served), [servedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  function go(patch: Partial<ListingParams>) {
    const next: ListingParams = { ...params, ...patch };
    setParams(next);
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) if (value) query.set(key, value);
    const qs = query.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}#results` : `${pathname}#results`, { scroll: false }));
  }

  return <Context.Provider value={{ params, go, pending }}>{children}</Context.Provider>;
}
