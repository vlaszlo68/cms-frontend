import { apiDelete, apiGet, apiPostForm } from "./httpClient";
import type { Media } from "../models/media";

const mediaPath = (siteCode: string) => `/api/admin/sites/${encodeURIComponent(siteCode)}/media`;

export function getMediaList(siteCode: string) {
  return apiGet<Media[]>(`${mediaPath(siteCode)}?activeOnly=false`);
}

export function getMedia(siteCode: string, id: number) {
  return apiGet<Media>(`${mediaPath(siteCode)}/${id}`);
}

export function uploadMedia(siteCode: string, file: File, description?: string) {
  const formData = new FormData();
  formData.append("file", file);

  if (description) {
    formData.append("description", description);
  }

  return apiPostForm<Media>(mediaPath(siteCode), formData);
}

export function deleteMedia(siteCode: string, id: number) {
  return apiDelete<boolean>(`${mediaPath(siteCode)}/${id}`);
}

export function getMediaContentUrl(siteCode: string, id: number) { return `${mediaPath(siteCode)}/${id}/content`; }
