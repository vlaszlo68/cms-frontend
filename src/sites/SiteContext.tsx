import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../api/httpClient";
import { getSites } from "../api/siteApi";
import type { Site } from "../models/site";

const storageKey = "cms.selectedSiteCode";
type SiteContextValue = {
  sites: Site[]; selectedSite: Site | null; isLoading: boolean; error: string;
  selectSite: (code: string) => void; reloadSites: () => Promise<Site[]>;
};
const SiteContext = createContext<SiteContextValue | undefined>(undefined);

export function SiteProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const selectSite = useCallback((code: string) => { setSelectedCode(code); window.localStorage.setItem(storageKey, code); }, []);
  const reloadSites = useCallback(async () => {
    if (user?.role !== "ADMIN") { setSites([]); setSelectedCode(null); return []; }
    setIsLoading(true); setError("");
    try {
      const loaded = await getSites();
      setSites(loaded);
      setSelectedCode((current) => {
        const preferred = current ?? window.localStorage.getItem(storageKey);
        const valid = loaded.find((site) => site.code === preferred) ?? loaded.find((site) => site.active) ?? loaded[0] ?? null;
        if (valid) window.localStorage.setItem(storageKey, valid.code); else window.localStorage.removeItem(storageKey);
        return valid?.code ?? null;
      });
      return loaded;
    } catch (caught) { setSites([]); setSelectedCode(null); setError(caught instanceof ApiError ? caught.message : "Sites could not be loaded."); return []; }
    finally { setIsLoading(false); }
  }, [user?.role]);
  useEffect(() => { if (!authLoading) void reloadSites(); }, [authLoading, reloadSites]);
  const selectedSite = sites.find((site) => site.code === selectedCode) ?? null;
  const value = useMemo(() => ({ sites, selectedSite, isLoading, error, selectSite, reloadSites }), [sites, selectedSite, isLoading, error, selectSite, reloadSites]);
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}
export function useSiteContext() { const context = useContext(SiteContext); if (!context) throw new Error("useSiteContext must be used within SiteProvider."); return context; }
