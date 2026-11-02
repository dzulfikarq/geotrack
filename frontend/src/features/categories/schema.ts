import { z } from "zod";
import { COLOR_PALETTE, ICON_CATALOG, MARKER_STYLES, type ColorKey, type IconKey } from "./icons";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(60, "Use 60 characters or fewer"),
  description: z.string().trim().max(500, "Use 500 characters or fewer"),
	icon_key: z.enum(ICON_CATALOG.map((icon) => icon.key) as [IconKey, ...IconKey[]]),
	color: z.enum(COLOR_PALETTE.map((color) => color.key) as [ColorKey, ...ColorKey[]]),
  marker_style: z.enum(MARKER_STYLES),
});
