import { apiDelete, apiGet, apiPost, apiPut } from "./httpClient";
import type { CreatePageRequest, Page, PageListItem, UpdatePageRequest } from "../models/page";

const PAGES_PATH = "/api/pages";

export function getPages() {
  return apiGet<PageListItem[]>(PAGES_PATH);
}

export function getPage(id: number) {
  return apiGet<Page>(`${PAGES_PATH}/${id}`);
}

export function createPage(input: CreatePageRequest) {
  return apiPost<Page>(PAGES_PATH, input);
}

export function updatePage(id: number, input: UpdatePageRequest) {
  return apiPut<Page>(`${PAGES_PATH}/${id}`, input);
}

export function deletePage(id: number) {
  return apiDelete<void>(`${PAGES_PATH}/${id}`);
}

export function getPageBySlug(slug: string) {
  return apiGet<Page>(`${PAGES_PATH}/slug/${encodeURIComponent(slug)}`);
}
