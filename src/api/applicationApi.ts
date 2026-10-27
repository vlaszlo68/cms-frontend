import { apiGet, apiPost, apiPut } from "./httpClient";
import type {
  Application,
  CreateApplicationRequest,
  UpdateApplicationRequest,
} from "../models/application";

const applicationsPath = (siteCode: string) =>
  `/api/admin/sites/${encodeURIComponent(siteCode)}/applications`;

export function getApplications(siteCode: string) {
  return apiGet<Application[]>(applicationsPath(siteCode));
}

export function getApplication(siteCode: string, id: number) {
  return apiGet<Application>(`${applicationsPath(siteCode)}/${id}`);
}

export function createApplication(siteCode: string, input: CreateApplicationRequest) {
  return apiPost<Application>(applicationsPath(siteCode), input);
}

export function updateApplication(siteCode: string, id: number, input: UpdateApplicationRequest) {
  return apiPut<Application>(`${applicationsPath(siteCode)}/${id}`, input);
}
