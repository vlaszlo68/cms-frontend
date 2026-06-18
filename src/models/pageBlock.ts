export interface PageBlock {
  id: number;
  pageId: number;
  blockType: string;
  title?: string;
  sortOrder: number;
  visible: boolean;
  configJson?: string;
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
