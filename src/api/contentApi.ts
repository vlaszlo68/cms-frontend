import { apiDelete, apiGet, apiPost, apiPut } from "./httpClient";
import type { ContentCollection, ContentCollectionRequest, ContentFilters, ContentItem, ContentItemRequest, Tag, TagRequest } from "../models/content";
const base = (site: string) => `/api/admin/sites/${encodeURIComponent(site)}`;
const path = (site: string, resource: string) => `${base(site)}/${resource}`;
export function getContentItems(site: string, filters: ContentFilters = {}) { const q = new URLSearchParams(); if (filters.type) q.set("type", filters.type); if (filters.status) q.set("status", filters.status); if (filters.groupCode?.trim()) q.set("groupCode", filters.groupCode.trim()); const suffix=q.toString(); return apiGet<ContentItem[]>(`${path(site,"content-items")}${suffix ? `?${suffix}` : ""}`); }
export const getContentItem=(s:string,id:number)=>apiGet<ContentItem>(`${path(s,"content-items")}/${id}`);
export const createContentItem=(s:string,v:ContentItemRequest)=>apiPost<ContentItem>(path(s,"content-items"),v);
export const updateContentItem=(s:string,id:number,v:ContentItemRequest)=>apiPut<ContentItem>(`${path(s,"content-items")}/${id}`,v);
export const deleteContentItem=(s:string,id:number)=>apiDelete<boolean>(`${path(s,"content-items")}/${id}`);
export const getTags=(s:string)=>apiGet<Tag[]>(path(s,"tags"));
export const createTag=(s:string,v:TagRequest)=>apiPost<Tag>(path(s,"tags"),v);
export const updateTag=(s:string,id:number,v:TagRequest)=>apiPut<Tag>(`${path(s,"tags")}/${id}`,v);
export const deleteTag=(s:string,id:number)=>apiDelete<boolean>(`${path(s,"tags")}/${id}`);
export const getCollections=(s:string)=>apiGet<ContentCollection[]>(path(s,"content-collections"));
export const getCollection=(s:string,id:number)=>apiGet<ContentCollection>(`${path(s,"content-collections")}/${id}`);
export const createCollection=(s:string,v:ContentCollectionRequest)=>apiPost<ContentCollection>(path(s,"content-collections"),v);
export const updateCollection=(s:string,id:number,v:ContentCollectionRequest)=>apiPut<ContentCollection>(`${path(s,"content-collections")}/${id}`,v);
export const deleteCollection=(s:string,id:number)=>apiDelete<boolean>(`${path(s,"content-collections")}/${id}`);
