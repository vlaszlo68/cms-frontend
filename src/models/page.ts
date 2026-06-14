export type PageStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

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
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreatePageRequest = {
  title: string;
  slug: string;
  content: string;
  status: PageStatus;
  metaTitle: string;
  metaDescription: string;
  homepage: boolean;
  menuVisible: boolean;
};

export type UpdatePageRequest = CreatePageRequest;
