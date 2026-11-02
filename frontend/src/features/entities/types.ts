export const categories = ["vehicle", "iot_device", "facility"] as const;
export const statuses = ["active", "inactive", "maintenance"] as const;

export type Category = (typeof categories)[number];
export type EntityStatus = (typeof statuses)[number];

export type Entity = {
  id: string;
  code: string;
  name: string;
  category: Category;
  status: EntityStatus;
  latitude: number;
  longitude: number;
  description: string;
  created_at: string;
  updated_at: string;
};

export type EntityInput = Omit<Entity, "id" | "created_at" | "updated_at">;

export type EntityFilters = {
  q: string;
  category: Category | "";
  status: EntityStatus | "";
};
