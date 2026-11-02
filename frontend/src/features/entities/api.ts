import type { Entity, EntityFilters, EntityInput } from "./types";

const baseURL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");
const apiURL = `${baseURL}/api/v1`;

type Envelope<T> = { data: T };
type ErrorEnvelope = { error?: { code?: string; message?: string; fields?: Record<string, string> } };

export class ApiError extends Error {
  code: string;
  fields: Record<string, string>;

  constructor(message: string, code = "REQUEST_FAILED", fields: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.fields = fields;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiURL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError("Could not reach GeoTrack API. Check that the backend is running.", "NETWORK_ERROR");
  }

  if (response.status === 204) return undefined as T;
  const body = (await response.json().catch(() => null)) as Envelope<T> | ErrorEnvelope | null;
  if (!response.ok) {
    const error = (body as ErrorEnvelope | null)?.error;
    throw new ApiError(error?.message || `Request failed (${response.status})`, error?.code, error?.fields);
  }
  return (body as Envelope<T>).data;
}

export function listEntities(filters: EntityFilters): Promise<Entity[]> {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.category) params.set("category", filters.category);
  if (filters.status) params.set("status", filters.status);
  const query = params.toString();
  return request(`/entities${query ? `?${query}` : ""}`);
}

export function createEntity(input: EntityInput): Promise<Entity> {
  return request("/entities", { method: "POST", body: JSON.stringify(input) });
}

export function updateEntity(id: string, input: EntityInput): Promise<Entity> {
  return request(`/entities/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(input) });
}

export function deleteEntity(id: string): Promise<void> {
  return request(`/entities/${encodeURIComponent(id)}`, { method: "DELETE" });
}
