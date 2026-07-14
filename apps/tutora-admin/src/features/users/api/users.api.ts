/**
 * Users API (issue #62). One HTTP layer via the shared Axios client; every
 * response is validated at the boundary with Zod before it reaches the UI.
 */
import { apiClient, paginatedSchema, type Paginated } from '@shared/lib';

import { ADMIN_USERS_ENDPOINT } from '../constants';
import {
  adminUserSchema,
  type AdminUser,
  type CreateUserBody,
  type ListUsersParams,
  type UpdateUserBody,
} from '../types';

const usersPageSchema = paginatedSchema(adminUserSchema);

/** List users (paginated, filterable by role, free-text query, and lifecycle). */
export async function listUsers(params: ListUsersParams): Promise<Paginated<AdminUser>> {
  const { data } = await apiClient.get<unknown>(ADMIN_USERS_ENDPOINT, {
    params: {
      page: params.page,
      limit: params.limit,
      role: params.role,
      q: params.q || undefined,
      // Omit when false so the URL stays clean and matches the API default.
      includeDeleted: params.includeDeleted ? true : undefined,
    },
  });
  return usersPageSchema.parse(data);
}

export async function getUser(id: string): Promise<AdminUser> {
  const { data } = await apiClient.get<unknown>(`${ADMIN_USERS_ENDPOINT}/${id}`);
  return adminUserSchema.parse(data);
}

export async function updateUser(id: string, body: UpdateUserBody): Promise<AdminUser> {
  const { data } = await apiClient.patch<unknown>(`${ADMIN_USERS_ENDPOINT}/${id}`, body);
  return adminUserSchema.parse(data);
}

export async function createUser(body: CreateUserBody): Promise<AdminUser> {
  const { data } = await apiClient.post<unknown>(ADMIN_USERS_ENDPOINT, body);
  return adminUserSchema.parse(data);
}

/** Soft-delete (suspend) a user account. Returns 204 with no body. */
export async function suspendUser(id: string): Promise<void> {
  await apiClient.delete(`${ADMIN_USERS_ENDPOINT}/${id}`);
}

export async function restoreUser(id: string): Promise<AdminUser> {
  const { data } = await apiClient.patch<unknown>(`${ADMIN_USERS_ENDPOINT}/${id}/restore`);
  return adminUserSchema.parse(data);
}
