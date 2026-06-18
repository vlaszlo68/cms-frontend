export interface Template {
  id: number;
  code: string;
  name: string;
  description?: string;
  previewImageMediaId?: number;
  active: boolean;
}

export type CreateTemplateRequest = {
  code: string;
  name: string;
  description: string | null;
  previewImageMediaId: number | null;
  active: boolean;
};

export type UpdateTemplateRequest = CreateTemplateRequest;
