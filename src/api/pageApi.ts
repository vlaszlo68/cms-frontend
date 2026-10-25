import { apiDelete, apiGet, apiPost, apiPut } from "./httpClient";
import type { CreatePageRequest, Page, PageListItem, UpdatePageRequest } from "../models/page";

const pagesPath = (siteCode: string) => `/api/admin/sites/${encodeURIComponent(siteCode)}/pages`;

export function getPages(siteCode: string) {
  return apiGet<PageListItem[]>(pagesPath(siteCode));
}

export function getPage(siteCode: string, id: number) {
  return apiGet<Page>(`${pagesPath(siteCode)}/${id}`);
}

export function createPage(siteCode: string, input: CreatePageRequest) {
  return apiPost<Page>(pagesPath(siteCode), input);
}

export function updatePage(siteCode: string, id: number, input: UpdatePageRequest) {
  return apiPut<Page>(`${pagesPath(siteCode)}/${id}`, input);
}

export function deletePage(siteCode: string, id: number) {
  return apiDelete<void>(`${pagesPath(siteCode)}/${id}`);
}

export function getPageBySlug(siteCode: string, slug: string) {
  return apiGet<Page>(`${pagesPath(siteCode)}/slug/${encodeURIComponent(slug)}`);
}
