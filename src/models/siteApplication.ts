/** A configured application owned by exactly one Site. */
export type SiteApplication = {
  id: number;
  code: string;
  name: string;
  active: boolean;
};

/** Wire payload for the backend SiteApplication create endpoint. */
export type CreateSiteApplicationRequest = Omit<SiteApplication, "id">;

/** Wire payload for the backend SiteApplication update endpoint. */
export type UpdateSiteApplicationRequest = CreateSiteApplicationRequest;
