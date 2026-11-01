export type ContentType = "NEWS" | "BLOG" | "GALLERY";
export type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type ContentSort = "PUBLISHED_DESC";

export type Tag = { id: number; code: string; name: string; createdAt: string | null; updatedAt: string | null };
export type TagRequest = Pick<Tag, "code" | "name">;

export type ContentItem = {
  id: number; type: ContentType; title: string; slug: string; summary: string | null;
  content: string | null; groupCode: string | null; status: ContentStatus;
  featuredMediaId: number | null; publishedAt: string | null; tags: Tag[];
  createdAt: string | null; updatedAt: string | null;
};
export type ContentItemRequest = Omit<ContentItem, "id" | "tags" | "createdAt" | "updatedAt"> & { tagIds: number[] };
export type ContentFilters = { type?: ContentType; status?: ContentStatus; groupCode?: string };

export type ContentCollection = { id: number; code: string; name: string; contentType: ContentType; groupCode: string | null; sort: ContentSort; pageSize: number; active: boolean; createdAt: string | null; updatedAt: string | null };
export type ContentCollectionRequest = Omit<ContentCollection, "id" | "createdAt" | "updatedAt">;
