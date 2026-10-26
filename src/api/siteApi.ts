import { apiGet, apiPost, apiPut } from "./httpClient";
import type { SaveSiteRequest, Site } from "../models/site";

const SITES_PATH = "/api/admin/sites";
const sitePath = (code: string) => `${SITES_PATH}/${encodeURIComponent(code)}`;

export const getSites = () => apiGet<Site[]>(SITES_PATH);
export const getSite = (code: string) => apiGet<Site>(sitePath(code));
export const createSite = (input: SaveSiteRequest) => apiPost<Site>(SITES_PATH, input);
export const updateSite = (code: string, input: SaveSiteRequest) => apiPut<Site>(sitePath(code), input);
