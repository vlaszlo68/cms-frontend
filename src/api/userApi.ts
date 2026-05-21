import { apiDelete, apiGet, apiPost, apiPut } from "./httpClient";
import type { CreateUserRequest, UpdateUserRequest, User } from "../models/user";

const USERS_PATH = "/api/users";

export function getUsers() {
  return apiGet<User[]>(USERS_PATH);
}

export function getUser(id: number) {
  return apiGet<User>(`${USERS_PATH}/${id}`);
}

export function createUser(input: CreateUserRequest) {
  return apiPost<User>(USERS_PATH, input);
}

export function updateUser(id: number, input: UpdateUserRequest) {
  return apiPut<User>(`${USERS_PATH}/${id}`, input);
}

export function deleteUser(id: number) {
  return apiDelete<User>(`${USERS_PATH}/${id}`);
}
