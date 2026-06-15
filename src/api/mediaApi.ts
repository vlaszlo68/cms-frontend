import { apiDelete, apiGet, apiPostForm } from "./httpClient";
import type { Media } from "../models/media";

const MEDIA_PATH = "/api/media";

export function getMediaList() {
  return apiGet<Media[]>(MEDIA_PATH);
}

export function getMedia(id: number) {
  return apiGet<Media>(`${MEDIA_PATH}/${id}`);
}

export function uploadMedia(file: File, description?: string) {
  const formData = new FormData();
  formData.append("file", file);

  if (description) {
    formData.append("description", description);
  }

  return apiPostForm<Media>(`${MEDIA_PATH}/upload`, formData);
}

export function deleteMedia(id: number) {
  return apiDelete<Media>(`${MEDIA_PATH}/${id}`);
}
