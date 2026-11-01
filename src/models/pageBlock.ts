export interface PageBlock {
  id: number;
  pageId: number;
  blockType: string;
  title?: string;
  sortOrder: number;
  visible: boolean;
  configJson?: string;
}

export type ContentCollectionBlockConfig = {
  collectionCode: string;
  displayMode: "CARDS" | "COMPACT_LIST";
  paginationEnabled: boolean;
};

export function parseContentCollectionBlockConfig(configJson?: string): ContentCollectionBlockConfig {
  try {
    const value = JSON.parse(configJson ?? "") as Partial<ContentCollectionBlockConfig>;
    return {
      collectionCode: typeof value.collectionCode === "string" ? value.collectionCode : "",
      displayMode: value.displayMode === "COMPACT_LIST" ? "COMPACT_LIST" : "CARDS",
      paginationEnabled: value.paginationEnabled !== false,
    };
  } catch {
    return { collectionCode: "", displayMode: "CARDS", paginationEnabled: true };
  }
}

export type CreatePageBlockRequest = {
  pageId: number;
  blockType: string;
  title: string | null;
  sortOrder: number;
  visible: boolean;
  configJson: string | null;
};

export type UpdatePageBlockRequest = CreatePageBlockRequest;
