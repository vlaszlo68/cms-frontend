import type { SaveSiteSettingsRequest, SiteSettings } from "../models/siteSettings";
import { apiGet, apiPut } from "./httpClient";

const SITE_SETTINGS_PATH = "/api/site-settings";

export function getSettings() {
  return apiGet<SiteSettings>(SITE_SETTINGS_PATH);
}

export function saveSettings(input: SaveSiteSettingsRequest) {
  return apiPut<SiteSettings>(SITE_SETTINGS_PATH, input);
}
