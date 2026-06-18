import type {
  CreateTemplateRequest,
  Template,
  UpdateTemplateRequest,
} from "../models/template";
import { apiDelete, apiGet, apiPost, apiPut } from "./httpClient";

const TEMPLATES_PATH = "/api/templates";

export function getTemplates() {
  return apiGet<Template[]>(TEMPLATES_PATH);
}

export function getTemplate(id: number) {
  return apiGet<Template>(`${TEMPLATES_PATH}/${id}`);
}

export function createTemplate(input: CreateTemplateRequest) {
  return apiPost<Template>(TEMPLATES_PATH, input);
}

export function updateTemplate(id: number, input: UpdateTemplateRequest) {
  return apiPut<Template>(`${TEMPLATES_PATH}/${id}`, input);
}

export function deleteTemplate(id: number) {
  return apiDelete<Template>(`${TEMPLATES_PATH}/${id}`);
}
