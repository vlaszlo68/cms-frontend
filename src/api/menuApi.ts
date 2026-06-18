import type {
  CreateMenuItemRequest,
  CreateMenuRequest,
  Menu,
  MenuItem,
  UpdateMenuItemRequest,
  UpdateMenuRequest,
} from "../models/menu";
import { apiDelete, apiGet, apiPost, apiPut } from "./httpClient";

const MENUS_PATH = "/api/menus";
const MENU_ITEMS_PATH = "/api/menu-items";

export function getMenus() {
  return apiGet<Menu[]>(MENUS_PATH);
}

export function getMenu(id: number) {
  return apiGet<Menu>(`${MENUS_PATH}/${id}`);
}

export function createMenu(input: CreateMenuRequest) {
  return apiPost<Menu>(MENUS_PATH, input);
}

export function updateMenu(id: number, input: UpdateMenuRequest) {
  return apiPut<Menu>(`${MENUS_PATH}/${id}`, input);
}

export function deleteMenu(id: number) {
  return apiDelete<Menu>(`${MENUS_PATH}/${id}`);
}

export function getMenuItems(menuId: number) {
  return apiGet<MenuItem[]>(`${MENUS_PATH}/${menuId}/items`);
}

export function createMenuItem(input: CreateMenuItemRequest) {
  return apiPost<MenuItem>(MENU_ITEMS_PATH, input);
}

export function updateMenuItem(id: number, input: UpdateMenuItemRequest) {
  return apiPut<MenuItem>(`${MENU_ITEMS_PATH}/${id}`, input);
}

export function deleteMenuItem(id: number) {
  return apiDelete<MenuItem>(`${MENU_ITEMS_PATH}/${id}`);
}
