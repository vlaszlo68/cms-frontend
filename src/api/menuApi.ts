import type {
  CreateMenuItemRequest,
  CreateMenuRequest,
  Menu,
  MenuItem,
  UpdateMenuItemRequest,
  UpdateMenuRequest,
} from "../models/menu";
import { apiDelete, apiGet, apiPost, apiPut } from "./httpClient";

const menusPath = (siteCode: string) => `/api/admin/sites/${encodeURIComponent(siteCode)}/menus`;
const menuPath = (siteCode: string, id: number) => `${menusPath(siteCode)}/${id}`;

export function getMenus(siteCode: string) {
  return apiGet<Menu[]>(menusPath(siteCode));
}

export function getMenu(siteCode: string, id: number) {
  return apiGet<Menu>(menuPath(siteCode, id));
}

export function createMenu(siteCode: string, input: CreateMenuRequest) {
  return apiPost<Menu>(menusPath(siteCode), input);
}

export function updateMenu(siteCode: string, id: number, input: UpdateMenuRequest) {
  return apiPut<Menu>(menuPath(siteCode, id), input);
}

export function deleteMenu(siteCode: string, id: number) {
  return apiDelete<Menu>(menuPath(siteCode, id));
}

export function getMenuItems(siteCode: string, menuId: number) {
  return apiGet<MenuItem[]>(`${menuPath(siteCode, menuId)}/items`);
}

export function createMenuItem(siteCode: string, menuId: number, input: CreateMenuItemRequest) {
  return apiPost<MenuItem>(`${menuPath(siteCode, menuId)}/items`, input);
}

export function updateMenuItem(siteCode: string, menuId: number, id: number, input: UpdateMenuItemRequest) {
  return apiPut<MenuItem>(`${menuPath(siteCode, menuId)}/items/${id}`, input);
}

export function deleteMenuItem(siteCode: string, menuId: number, id: number) {
  return apiDelete<MenuItem>(`${menuPath(siteCode, menuId)}/items/${id}`);
}
