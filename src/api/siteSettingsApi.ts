import type { SaveSiteSettingsRequest, SiteSettings } from "../models/siteSettings";
import { apiGet, apiPut } from "./httpClient";

const settingsPath = (siteCode: string) => `/api/admin/sites/${encodeURIComponent(siteCode)}/site-settings`;

export function getSettings(siteCode: string) {
  return apiGet<SiteSettings>(settingsPath(siteCode));
}

export function saveSettings(siteCode: string, input: SaveSiteSettingsRequest) {
  return apiPut<SiteSettings>(settingsPath(siteCode), input);
}
