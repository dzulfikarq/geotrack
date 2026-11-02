import type { ColorKey, IconKey, MarkerStyle } from "./icons";

export type Category = {
	id: string;
	name: string;
	description: string;
	icon_key: IconKey;
	color: ColorKey;
	marker_style: MarkerStyle;
	entity_count: number;
	is_builtin: boolean;
	created_at: string;
	updated_at: string;
};

export type CategoryInput = Pick<Category, "name" | "description" | "icon_key" | "color" | "marker_style">;
