export type Site = {
  id: number;
  code: string;
  name: string;
  active: boolean;
  themeCode: string;
  createdAt: string;
  updatedAt: string;
};

export type SaveSiteRequest = {
  code: string;
  name: string;
  active?: boolean;
  themeCode?: string;
};

export type ThemeDefinition = {
  code: string;
  name: string;
};

/**
 * The backend may add blocking resource categories over time. Numeric fields
 * other than `deletable` are rendered by the Site deletion dialog.
 */
export type SiteUsage = {
  deletable: boolean;
  [key: string]: boolean | number;
};
