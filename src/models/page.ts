export type PageStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type PageType =
  | "CONTENT"
  | "BLOCK";

export type Page = {
  id: number;
  title: string;
  slug: string;
  content: string;
  status: PageStatus;
  metaTitle: string;
  metaDescription: string;
  homepage: boolean;
  menuVisible: boolean;
  templateCode: string;
  pageType: PageType;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
};

export type PageListItem = Omit<Page, "content">;

export type CreatePageRequest = {
  title: string;
  slug: string;
  content: string;
  status: PageStatus;
  metaTitle: string;
  metaDescription: string;
  homepage: boolean;
  menuVisible: boolean;
  templateCode: string;
  pageType: PageType;
};

export type UpdatePageRequest = CreatePageRequest;
