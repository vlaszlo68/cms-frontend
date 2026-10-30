import { apiDelete, apiGet, apiPost, apiPut } from "./httpClient";
import type { SaveSiteRequest, Site, SiteUsage, ThemeDefinition } from "../models/site";

const SITES_PATH = "/api/admin/sites";
const sitePath = (code: string) => `${SITES_PATH}/${encodeURIComponent(code)}`;

export const getSites = () => apiGet<Site[]>(SITES_PATH);
export const getSite = (code: string) => apiGet<Site>(sitePath(code));
export const createSite = (input: SaveSiteRequest) => apiPost<Site>(SITES_PATH, input);
export const updateSite = (code: string, input: SaveSiteRequest) => apiPut<Site>(sitePath(code), input);
export const getThemeDefinitions = () => apiGet<ThemeDefinition[]>("/api/admin/theme-definitions");
export const getSiteUsage = (code: string) => apiGet<SiteUsage>(`${sitePath(code)}/usage`);
export const deleteSite = (code: string) => apiDelete<{ message: string }>(sitePath(code));
