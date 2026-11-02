import { useEffect, useMemo, type CSSProperties } from "react";
import { type LatLngExpression } from "leaflet";
import { LocateFixed, Maximize2, Minus, Plus } from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import type { Entity } from "../entities/types";
import type { Category } from "../categories/types";
import { CategoryGlyph, CategoryMarker, getColor } from "../categories/icons";
import { createLeafletCategoryIcon } from "./marker";

type Props = {
  entities: Entity[];
  categories: Category[];
  selected: Entity | null;
  pickerActive: boolean;
  onSelect: (entity: Entity) => void;
  onPick: (latitude: number, longitude: number) => void;
  onCancelPick: () => void;
};

const indonesiaCenter: LatLngExpression = [-2.5, 118];

export default function EntityMap({ entities, categories, selected, pickerActive, onSelect, onPick, onCancelPick }: Props) {
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
        <span className="legend-heading">CATEGORIES</span>
        {categories.map((category) => (
          <span key={category.id} className="map-legend-category">
            <CategoryMarker iconKey={category.icon_key} color={category.color} markerStyle={category.marker_style} size={12} />
            {category.name}
          </span>
        ))}
      </div>
      {entities.length === 0 && !pickerActive && (
        <div className="map-empty-note"><span>Map is ready</span><small>Add or filter entities to see saved locations.</small></div>
      )}
    </div>
  );
}

function EntityMarker({ entity, selected, onSelect }: { entity: Entity; selected: boolean; onSelect: Props["onSelect"] }) {
  const icon = useMemo(() => createLeafletCategoryIcon(entity.category_icon_key, entity.category_color, entity.category_marker_style, selected, entity.status), [entity.category_icon_key, entity.category_color, entity.category_marker_style, entity.status, selected]);
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
          <span className="popup-category-icon" style={{ "--category-color": getColor(entity.category_color).hex, "--category-soft": getColor(entity.category_color).soft } as CSSProperties}><CategoryGlyph iconKey={entity.category_icon_key} size={16} /></span>
          <div className="popup-copy">
            <strong>{entity.name}</strong>
            <span>{entity.category_name} · {entity.code}</span>
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

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
