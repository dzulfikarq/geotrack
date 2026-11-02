import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import type { Entity } from "../entities/types";

type Props = {
  entities: Entity[];
  selected: Entity | null;
  pickerActive: boolean;
  onSelect: (entity: Entity) => void;
  onPick: (latitude: number, longitude: number) => void;
  onCancelPick: () => void;
};

export default function EntityMap({ entities, selected, pickerActive, onSelect, onPick, onCancelPick }: Props) {
  const center: LatLngExpression = [-2.5, 118];
  return (
    <div className="map-wrap" aria-label="Entity map">
      <MapContainer center={center} zoom={5} scrollWheelZoom className="map-canvas">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitEntities entities={entities} />
        <FocusEntity entity={selected} />
        <MapClickHandler active={pickerActive} onPick={onPick} />
        {entities.map((entity) => {
          const color = markerColor(entity);
          return (
            <CircleMarker
              key={entity.id}
              center={[entity.latitude, entity.longitude]}
              radius={selected?.id === entity.id ? 11 : 8}
              pathOptions={{
                color: selected?.id === entity.id ? "#172a24" : color,
                weight: selected?.id === entity.id ? 3 : 2,
                fillColor: color,
                fillOpacity: entity.status === "inactive" ? 0.45 : 0.9,
                dashArray: entity.status === "maintenance" ? "3 4" : undefined,
              }}
              eventHandlers={{ click: () => onSelect(entity) }}
            >
              <Tooltip direction="top" offset={[0, -8]}>{entity.code} · {entity.name}</Tooltip>
              <Popup>
                <div className="map-popup">
                  <strong>{entity.name}</strong>
                  <span>{entity.code} · {entity.category.replace("_", " ")}</span>
                  <button type="button" onClick={() => onSelect(entity)}>View details</button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      {pickerActive && <div className="map-pick-hint"><MapPinIcon /> Click map to choose coordinates <button type="button" onClick={onCancelPick}>Cancel</button></div>}
      <div className="map-legend" aria-label="Map marker categories">
        <span><i className="legend-dot vehicle-dot" />Vehicle</span>
        <span><i className="legend-dot device-dot" />IoT device</span>
        <span><i className="legend-dot facility-dot" />Facility</span>
      </div>
    </div>
  );
}

function FitEntities({ entities }: { entities: Entity[] }) {
  const map = useMap();
  useEffect(() => {
    if (!entities.length) return;
    if (entities.length === 1) {
      map.setView([entities[0].latitude, entities[0].longitude], Math.max(map.getZoom(), 8));
      return;
    }
    map.fitBounds(entities.map((entity) => [entity.latitude, entity.longitude]), { padding: [48, 48], maxZoom: 12 });
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

function MapClickHandler({ active, onPick }: { active: boolean; onPick: Props["onPick"] }) {
  useMapEvents({
    click(event) {
      if (active) onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function markerColor(entity: Entity) {
  if (entity.category === "vehicle") return "#ef7b32";
  if (entity.category === "iot_device") return "#278c9b";
  return "#7461b6";
}

function MapPinIcon() {
  return <span className="pick-pulse" aria-hidden="true" />;
}
