import type {
  CreatePageBlockRequest,
  PageBlock,
  UpdatePageBlockRequest,
} from "../models/pageBlock";
import { apiDelete, apiGet, apiPost, apiPut } from "./httpClient";

const PAGES_PATH = "/api/pages";
const PAGE_BLOCKS_PATH = "/api/page-blocks";

export function getBlocks(pageId: number) {
  return apiGet<PageBlock[]>(`${PAGES_PATH}/${pageId}/blocks`);
}

export function getBlock(id: number) {
  return apiGet<PageBlock>(`${PAGE_BLOCKS_PATH}/${id}`);
}

export function createBlock(input: CreatePageBlockRequest) {
  return apiPost<PageBlock>(PAGE_BLOCKS_PATH, input);
}

export function updateBlock(id: number, input: UpdatePageBlockRequest) {
  return apiPut<PageBlock>(`${PAGE_BLOCKS_PATH}/${id}`, input);
}

export function deleteBlock(id: number) {
  return apiDelete<PageBlock>(`${PAGE_BLOCKS_PATH}/${id}`);
}
