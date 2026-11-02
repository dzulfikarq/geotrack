import { createElement, type CSSProperties } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Bike,
  Briefcase,
  Box,
  Building2,
  BusFront,
  CarFront,
  Cpu,
  Database,
  Factory,
  Hospital,
  Landmark,
  MapPin,
  MapPinned,
  Package,
  Radio,
  Router,
  SatelliteDish,
  School,
  Ship,
  Thermometer,
  TrainFront,
  Truck,
  Warehouse,
  Wifi,
  type LucideIcon,
} from "lucide-react";

export const ICON_CATALOG = [
  { key: "truck", label: "Truck", group: "Vehicle", Icon: Truck },
  { key: "car-front", label: "Car", group: "Vehicle", Icon: CarFront },
  { key: "bus-front", label: "Bus", group: "Vehicle", Icon: BusFront },
  { key: "bike", label: "Bike", group: "Vehicle", Icon: Bike },
  { key: "ship", label: "Ship", group: "Vehicle", Icon: Ship },
  { key: "train-front", label: "Train", group: "Vehicle", Icon: TrainFront },
  { key: "cpu", label: "CPU", group: "IoT", Icon: Cpu },
  { key: "radio", label: "Radio", group: "IoT", Icon: Radio },
  { key: "router", label: "Router", group: "IoT", Icon: Router },
  { key: "wifi", label: "Wi-Fi", group: "IoT", Icon: Wifi },
  { key: "satellite-dish", label: "Satellite", group: "IoT", Icon: SatelliteDish },
  { key: "thermometer", label: "Thermometer", group: "IoT", Icon: Thermometer },
  { key: "building-2", label: "Building", group: "Facility", Icon: Building2 },
  { key: "warehouse", label: "Warehouse", group: "Facility", Icon: Warehouse },
  { key: "factory", label: "Factory", group: "Facility", Icon: Factory },
  { key: "hospital", label: "Hospital", group: "Facility", Icon: Hospital },
  { key: "school", label: "School", group: "Facility", Icon: School },
  { key: "landmark", label: "Landmark", group: "Facility", Icon: Landmark },
  { key: "map-pin", label: "Map pin", group: "General", Icon: MapPin },
  { key: "map-pinned", label: "Pinned map", group: "General", Icon: MapPinned },
  { key: "package", label: "Package", group: "General", Icon: Package },
  { key: "box", label: "Box", group: "General", Icon: Box },
  { key: "briefcase", label: "Briefcase", group: "General", Icon: Briefcase },
  { key: "database", label: "Database", group: "General", Icon: Database },
] as const;

export type IconKey = (typeof ICON_CATALOG)[number]["key"];
export type IconGroup = (typeof ICON_CATALOG)[number]["group"];
export const ICON_GROUPS: readonly IconGroup[] = ["Vehicle", "IoT", "Facility", "General"];

export const COLOR_PALETTE = [
  { key: "orange", label: "Orange", hex: "#ED7B3B", soft: "#FFF2E9" },
  { key: "teal", label: "Teal", hex: "#14858A", soft: "#E8F5F3" },
  { key: "violet", label: "Violet", hex: "#7562B7", soft: "#F0EDFA" },
  { key: "blue", label: "Blue", hex: "#3978B7", soft: "#EDF3FB" },
  { key: "green", label: "Green", hex: "#18815C", soft: "#E6F4EC" },
  { key: "rose", label: "Rose", hex: "#C54B68", soft: "#FBECEF" },
  { key: "slate", label: "Slate", hex: "#526056", soft: "#EDF0ED" },
  { key: "amber", label: "Amber", hex: "#9A6C1D", soft: "#FFF4DF" },
] as const;

export type ColorKey = (typeof COLOR_PALETTE)[number]["key"];
export const MARKER_STYLES = ["pin", "circle", "rounded-square"] as const;
export type MarkerStyle = (typeof MARKER_STYLES)[number];

const iconByKey = new Map<string, LucideIcon>(ICON_CATALOG.map(({ key, Icon }) => [key, Icon]));

export function getIcon(key: string): LucideIcon {
  return iconByKey.get(key) ?? MapPin;
}

export function getColor(key: string) {
  return COLOR_PALETTE.find((color) => color.key === key) ?? COLOR_PALETTE[0];
}

export function getMarkerStyle(style: string): MarkerStyle {
  return MARKER_STYLES.includes(style as MarkerStyle) ? (style as MarkerStyle) : "pin";
}

export function CategoryGlyph({ iconKey, size = 18 }: { iconKey: string; size?: number }) {
  return createElement(getIcon(iconKey), { size, strokeWidth: 1.9, "aria-hidden": true });
}

export function CategoryMarker({
  iconKey,
  color,
  markerStyle,
  selected = false,
  status = "active",
  size = 20,
}: {
  iconKey: string;
  color: string;
  markerStyle: string;
  selected?: boolean;
  status?: "active" | "inactive" | "maintenance";
  size?: number;
}) {
  const colorOption = getColor(color);
  const style: CSSProperties & { "--marker-color": string } = { "--marker-color": colorOption.hex };
  return (
    <span className={`category-marker marker-${getMarkerStyle(markerStyle)}${selected ? " is-selected" : ""}${status === "inactive" ? " is-inactive" : ""}${status === "maintenance" ? " is-maintenance" : ""}`} style={style} aria-hidden="true">
      {createElement(getIcon(iconKey), { size, strokeWidth: 1.9 })}
    </span>
  );
}

export function renderCategoryMarkerMarkup(iconKey: string, color: string, markerStyle: string, selected = false, status: "active" | "inactive" | "maintenance" = "active"): string {
  const safeStyle = getMarkerStyle(markerStyle);
  return renderToStaticMarkup(createElement(CategoryMarker, { iconKey, color, markerStyle: safeStyle, selected, status, size: 19 }));
}

export function markerAnchor(style: string): { icon: [number, number]; iconAnchor: [number, number]; popupAnchor: [number, number] } {
  const pin = getMarkerStyle(style) === "pin";
  return { icon: [56, 56], iconAnchor: [28, pin ? 52 : 28], popupAnchor: [0, pin ? -48 : -28] };
}
