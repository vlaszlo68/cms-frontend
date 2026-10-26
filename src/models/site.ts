export type Site = {
  id: number;
  code: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SaveSiteRequest = {
  code: string;
  name: string;
  active?: boolean;
};
