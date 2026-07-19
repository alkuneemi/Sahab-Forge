import { useCallback, useEffect, useState } from "react";

const KEY = "sahab_connected";

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Mirrors `settings.odoo_connected` from the original workflow. Toggle it
 * from the System Control page; the dashboard switches between the hero
 * "get started" view and the live KPI/reports view accordingly.
 */
export function useConnectedFlag() {
  const [connected, setConnectedState] = useState<boolean>(read);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === KEY) setConnectedState(e.newValue === "1");
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setConnected = useCallback((value: boolean) => {
    try {
      localStorage.setItem(KEY, value ? "1" : "0");
    } catch {
      /* ignore */
    }
    setConnectedState(value);
  }, []);

  return { connected, setConnected };
}
