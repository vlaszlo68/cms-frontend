/** A safe, Site-owned application configuration exposed by the admin API. */
export type Application = {
  id: number;
  code: string;
  name: string;
  active: boolean;
};

export type CreateApplicationRequest = Omit<Application, "id">;

export type UpdateApplicationRequest = CreateApplicationRequest;
