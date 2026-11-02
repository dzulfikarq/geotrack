import { request } from "../entities/api";
import type { Category, CategoryInput } from "./types";

export function listCategories(): Promise<Category[]> {
  return request("/categories");
}

export function createCategory(input: CategoryInput): Promise<Category> {
  return request("/categories", { method: "POST", body: JSON.stringify(input) });
}

export function updateCategory(id: string, input: CategoryInput): Promise<Category> {
  return request(`/categories/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(input) });
}

export function deleteCategory(id: string): Promise<void> {
  return request(`/categories/${encodeURIComponent(id)}`, { method: "DELETE" });
}
