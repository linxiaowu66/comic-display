"use client";

import useSWR from "swr";

export function useAdmin() {
  const { data } = useSWR<{ isAdmin: boolean }>("/api/auth/me", (url: string) =>
    fetch(url).then((res) => res.json())
  );

  return !!data?.isAdmin;
}
