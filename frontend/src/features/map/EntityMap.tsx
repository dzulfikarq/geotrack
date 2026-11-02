import { useEffect, useMemo } from "react";
import { divIcon, type LatLngExpression } from "leaflet";
import { Building2, Cpu, LocateFixed, Maximize2, Minus, Plus, Truck, type LucideIcon } from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import type { Category, Entity } from "../entities/types";

type Props = {
  entities: Entity[];
  selected: Entity | null;
  pickerActive: boolean;
  onSelect: (entity: Entity) => void;
  onPick: (latitude: number, longitude: number) => void;
  onCancelPick: () => void;
};

const indonesiaCenter: LatLngExpression = [-2.5, 118];

export default function EntityMap({ entities, selected, pickerActive, onSelect, onPick, onCancelPick }: Props) {
  return (
    <div className={`map-wrap ${pickerActive ? "is-picking" : ""}`} aria-label="Entity map">
      <MapContainer center={indonesiaCenter} zoom={5} scrollWheelZoom zoomControl={false} className="map-canvas">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors (ODbL) · Tiles by <a href="https://www.openstreetmap.fr/">OSM France</a>'
          url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
          updateWhenIdle
          keepBuffer={2}
        />
        <MapResizeObserver />
        <FitEntities entities={entities} />
        <FocusEntity entity={selected} />
        <MapClickHandler active={pickerActive} onPick={onPick} />
        {entities.map((entity) => (
          <EntityMarker key={entity.id} entity={entity} selected={selected?.id === entity.id} onSelect={onSelect} />
        ))}
        <MapControls entities={entities} selected={selected} />
      </MapContainer>

      {pickerActive && (
        <div className="map-pick-hint" role="status">
          <span className="pick-pulse" aria-hidden="true" />
          <span>Click the map to choose coordinates</span>
          <button type="button" onClick={onCancelPick}>Cancel</button>
        </div>
      )}

      <div className="map-legend" aria-label="Map marker categories">
        <span className="legend-heading">ENTITY TYPES</span>
        <span><i className="legend-dot vehicle-dot" />Vehicle</span>
        <span><i className="legend-dot device-dot" />IoT device</span>
        <span><i className="legend-dot facility-dot" />Facility</span>
      </div>
      {entities.length === 0 && !pickerActive && (
        <div className="map-empty-note"><span>Map is ready</span><small>Add or filter entities to see saved locations.</small></div>
      )}
    </div>
  );
}

function EntityMarker({ entity, selected, onSelect }: { entity: Entity; selected: boolean; onSelect: Props["onSelect"] }) {
  const icon = useMemo(() => createMarkerIcon(entity.category, entity.status, selected), [entity.category, entity.status, selected]);
  return (
    <Marker
      position={[entity.latitude, entity.longitude]}
      icon={icon}
      riseOnHover
      eventHandlers={{ click: () => onSelect(entity) }}
    >
      <Tooltip direction="top" offset={[0, -19]}>{entity.code} · {entity.name}</Tooltip>
      <Popup>
        <div className="map-popup">
          <span className={`popup-category-icon ${entity.category}`}><CategoryGlyph category={entity.category} size={16} /></span>
          <div className="popup-copy">
            <strong>{entity.name}</strong>
            <span>{entity.code}</span>
          </div>
          <span className={`status-pill ${entity.status}`}><i />{capitalize(entity.status)}</span>
          <span className="popup-coordinates">{entity.latitude.toFixed(5)}, {entity.longitude.toFixed(5)}</span>
          <button type="button" onClick={() => onSelect(entity)}>View entity details</button>
        </div>
      </Popup>
    </Marker>
  );
}

function MapResizeObserver() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(container);
    map.invalidateSize({ pan: false });
    return () => observer.disconnect();
  }, [map]);
  return null;
}

function FitEntities({ entities }: { entities: Entity[] }) {
  const map = useMap();
  useEffect(() => {
    if (!entities.length) return;
    if (entities.length === 1) {
      map.setView([entities[0].latitude, entities[0].longitude], Math.max(map.getZoom(), 8));
      return;
    }
    map.fitBounds(entities.map((entity) => [entity.latitude, entity.longitude]), { padding: [72, 72], maxZoom: 12 });
  }, [entities, map]);
  return null;
}

function FocusEntity({ entity }: { entity: Entity | null }) {
  const map = useMap();
  useEffect(() => {
    if (entity) map.flyTo([entity.latitude, entity.longitude], Math.max(map.getZoom(), 11), { duration: 0.45 });
  }, [entity, map]);
  return null;
}

function MapControls({ entities, selected }: { entities: Entity[]; selected: Entity | null }) {
  const map = useMap();
  return (
    <div className="map-controls" aria-label="Map controls" onClick={(event) => event.stopPropagation()}>
      <button type="button" aria-label="Zoom in" title="Zoom in" onClick={() => map.zoomIn()}><Plus size={18} /></button>
      <button type="button" aria-label="Zoom out" title="Zoom out" onClick={() => map.zoomOut()}><Minus size={18} /></button>
      <span className="map-control-divider" />
      <button type="button" aria-label={selected ? "Center selected entity" : "Fit all entities"} title={selected ? "Center selected entity" : "Fit all entities"} onClick={() => focusMap(map, entities, selected)}>
        {selected ? <LocateFixed size={17} /> : <Maximize2 size={17} />}
      </button>
    </div>
  );
}

function MapClickHandler({ active, onPick }: { active: boolean; onPick: Props["onPick"] }) {
  useMapEvents({
    click(event) {
      if (active) onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function focusMap(map: ReturnType<typeof useMap>, entities: Entity[], selected: Entity | null) {
  if (selected) {
    map.flyTo([selected.latitude, selected.longitude], Math.max(map.getZoom(), 11), { duration: 0.45 });
  } else if (entities.length === 1) {
    map.flyTo([entities[0].latitude, entities[0].longitude], Math.max(map.getZoom(), 8), { duration: 0.45 });
  } else if (entities.length > 1) {
    map.fitBounds(entities.map((entity) => [entity.latitude, entity.longitude]), { padding: [72, 72], maxZoom: 12, animate: true });
  } else {
    map.flyTo(indonesiaCenter, 5, { duration: 0.45 });
  }
}

function createMarkerIcon(category: Category, status: Entity["status"], selected: boolean) {
  const size = selected ? 48 : 42;
  const iconClass = ["entity-marker", category, status === "inactive" ? "is-inactive" : "", status === "maintenance" ? "is-maintenance" : "", selected ? "is-selected" : ""]
    .filter(Boolean)
    .join(" ");
  const html = `<span class="${iconClass}" aria-hidden="true">${categorySvg(category)}</span>`;
  return divIcon({
    className: "entity-marker-wrap",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function categorySvg(category: Category) {
  const paths = {
    vehicle: '<path d="M10 17h4V5H2v12h3"/><path d="M14 9h4l4 4v4h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/>',
    iot_device: '<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 9h6v6H9z"/><path d="M9 1v4m6-4v4m-6 14v4m6-4v4M1 9h4m-4 6h4m14-6h4m-4 6h4"/>',
    facility: '<path d="M6 22V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v19"/><path d="M6 12H4a2 2 0 0 0-2 2v8h20v-8a2 2 0 0 0-2-2h-2"/><path d="M10 6h4m-4 4h4m-4 4h4m-4 4h4"/>',
  }[category];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

function CategoryGlyph({ category, size }: { category: Category; size: number }) {
  const Icon: LucideIcon = category === "vehicle" ? Truck : category === "iot_device" ? Cpu : Building2;
  return <Icon size={size} strokeWidth={1.9} aria-hidden="true" />;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
