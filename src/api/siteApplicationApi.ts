import { apiGet, apiPost, apiPut } from "./httpClient";
import type {
  CreateSiteApplicationRequest,
  SiteApplication,
  UpdateSiteApplicationRequest,
} from "../models/siteApplication";

const siteApplicationsPath = (siteCode: string) =>
  `/api/admin/sites/${encodeURIComponent(siteCode)}/applications`;

export function getSiteApplications(siteCode: string) {
  return apiGet<SiteApplication[]>(siteApplicationsPath(siteCode));
}

export function getSiteApplication(siteCode: string, id: number) {
  return apiGet<SiteApplication>(`${siteApplicationsPath(siteCode)}/${id}`);
}

export function createSiteApplication(siteCode: string, input: CreateSiteApplicationRequest) {
  return apiPost<SiteApplication>(siteApplicationsPath(siteCode), input);
}

export function updateSiteApplication(siteCode: string, id: number, input: UpdateSiteApplicationRequest) {
  return apiPut<SiteApplication>(`${siteApplicationsPath(siteCode)}/${id}`, input);
}
