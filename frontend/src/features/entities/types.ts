export const statuses = ["active", "inactive", "maintenance"] as const;

export type EntityStatus = (typeof statuses)[number];

export type Entity = {
  id: string;
  code: string;
  name: string;
  category: string;
  category_id: string;
  category_name: string;
  category_icon_key: string;
  category_color: string;
  category_marker_style: string;
  status: EntityStatus;
  latitude: number;
  longitude: number;
  description: string;
  created_at: string;
  updated_at: string;
};

export type EntityInput = Pick<Entity, "code" | "name" | "status" | "latitude" | "longitude" | "description"> & {
  category_id: string;
};

export type EntityFilters = {
  q: string;
  categoryId: string;
  status: EntityStatus | "";
};
