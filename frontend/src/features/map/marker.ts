import { divIcon, type DivIcon } from "leaflet";
import { markerAnchor, renderCategoryMarkerMarkup } from "../categories/icons";

export function createLeafletCategoryIcon(iconKey: string, color: string, style: string, selected: boolean, status: "active" | "inactive" | "maintenance"): DivIcon {
  const anchor = markerAnchor(style);
  return divIcon({
    className: "category-marker-icon",
    html: `<span class="category-marker-host">${renderCategoryMarkerMarkup(iconKey, color, style, selected, status)}</span>`,
    iconSize: anchor.icon,
    iconAnchor: anchor.iconAnchor,
    popupAnchor: anchor.popupAnchor,
  });
}
