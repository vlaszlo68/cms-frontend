import type {
  CreatePageBlockRequest,
  PageBlock,
  UpdatePageBlockRequest,
} from "../models/pageBlock";
import { apiDelete, apiGet, apiPost, apiPut } from "./httpClient";

const pagePath = (siteCode: string, pageId: number) => `/api/admin/sites/${encodeURIComponent(siteCode)}/pages/${pageId}`;

export function getBlocks(siteCode: string, pageId: number) {
  return apiGet<PageBlock[]>(`${pagePath(siteCode, pageId)}/blocks`);
}

export function getBlock(siteCode: string, pageId: number, id: number) {
  return apiGet<PageBlock>(`${pagePath(siteCode, pageId)}/blocks/${id}`);
}

export function createBlock(siteCode: string, pageId: number, input: CreatePageBlockRequest) {
  return apiPost<PageBlock>(`${pagePath(siteCode, pageId)}/blocks`, input);
}

export function updateBlock(siteCode: string, pageId: number, id: number, input: UpdatePageBlockRequest) {
  return apiPut<PageBlock>(`${pagePath(siteCode, pageId)}/blocks/${id}`, input);
}

export function deleteBlock(siteCode: string, pageId: number, id: number) {
  return apiDelete<PageBlock>(`${pagePath(siteCode, pageId)}/blocks/${id}`);
}
