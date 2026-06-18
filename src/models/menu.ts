export interface Menu {
  id: number;
  name: string;
  code: string;
  active: boolean;
}

export type MenuItemTargetType =
  | "PAGE"
  | "URL";

export interface MenuItem {
  id: number;
  menuId: number;
  parentId?: number;
  pageId?: number;
  targetType: MenuItemTargetType;
  targetUrl?: string;
  title: string;
  sortOrder: number;
  visible: boolean;
}

export type CreateMenuRequest = Omit<Menu, "id">;

export type UpdateMenuRequest = CreateMenuRequest;

export type CreateMenuItemRequest = {
  menuId: number;
  parentId: number | null;
  pageId: number | null;
  targetType: MenuItemTargetType;
  targetUrl: string | null;
  title: string;
  sortOrder: number;
  visible: boolean;
};

export type UpdateMenuItemRequest = CreateMenuItemRequest;
