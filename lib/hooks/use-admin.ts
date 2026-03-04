"use client";

import { useState, useEffect } from "react";

const ADMIN_KEY = "isJzOwner";

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(localStorage.getItem(ADMIN_KEY) === "true");

    const handleStorage = (e: StorageEvent) => {
      if (e.key === ADMIN_KEY) {
        setIsAdmin(e.newValue === "true");
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return isAdmin;
}
