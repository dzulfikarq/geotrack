import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, ArrowLeft, ChevronRight, CirclePlus, Database, MapPinned, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import Modal from "./components/Modal";
import EntityForm, { type PickedLocation } from "./features/entities/EntityForm";
import { createEntity, deleteEntity, listEntities, updateEntity } from "./features/entities/api";
import type { Entity, EntityFilters, EntityInput } from "./features/entities/types";
import EntityMap from "./features/map/EntityMap";

const emptyFilters: EntityFilters = { q: "", category: "", status: "" };

export default function App() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<EntityFilters>(emptyFilters);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formSession, setFormSession] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pickerActive, setPickerActive] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<PickedLocation | null>(null);
  const [pickSequence, setPickSequence] = useState(0);
  const [toast, setToast] = useState("");

  const entitiesQuery = useQuery({
    queryKey: ["entities", filters],
    queryFn: () => listEntities(filters),
  });
  const entities = entitiesQuery.data ?? [];
  const selected = entities.find((entity) => entity.id === selectedId) ?? null;
  const editing = entities.find((entity) => entity.id === editId) ?? null;

  const saveMutation = useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: EntityInput }) =>
      id ? updateEntity(id, input) : createEntity(input),
    onSuccess: async (entity) => {
      await queryClient.invalidateQueries({ queryKey: ["entities"] });
      setSelectedId(entity.id);
      setFilters(emptyFilters);
      closeForm();
      setToast(editId ? "Entity changes saved." : "Entity created.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEntity,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["entities"] });
      setSelectedId(null);
      setDeleteOpen(false);
      setToast("Entity deleted.");
    },
  });

  function openCreate() {
    setFormSession((value) => value + 1);
    setEditId(null);
    setPickedLocation(null);
    setPickerActive(false);
    setFormOpen(true);
  }

  function openEdit() {
    if (!selected) return;
    setFormSession((value) => value + 1);
    setEditId(selected.id);
    setPickedLocation(null);
    setPickerActive(false);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setPickerActive(false);
  }

  function handleMapPick(latitude: number, longitude: number) {
    const sequence = pickSequence + 1;
    setPickSequence(sequence);
    setPickedLocation({ latitude, longitude, sequence });
    setPickerActive(false);
    setFormOpen(true);
  }

  function save(input: EntityInput) {
    return saveMutation.mutateAsync({ id: editId, input }).then(() => undefined);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand" aria-label="GeoTrack">
          <span className="brand-mark"><MapPinned size={21} /></span>
          <span>Geo<span>Track</span></span>
        </div>
        <div className="sidebar-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          <a className="nav-item active" href="#map-explorer" aria-current="page">
            <MapPinned size={17} /> <span>Map explorer</span>
          </a>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-status">
            <span className={`status-indicator ${entitiesQuery.isLoading ? "checking" : entitiesQuery.isError ? "offline" : ""}`} />
            {entitiesQuery.isLoading ? "Connecting to API" : entitiesQuery.isError ? "API unavailable" : "API connected"}
          </div>
          <div className="sidebar-version">GEOTRACK · LOCAL</div>
        </div>
      </aside>

      <main className="main-shell" id="map-explorer">
        <header className="topbar flex items-center justify-between">
          <div>
            <div className="eyebrow">WORKSPACE <ChevronRight size={13} /> MAP EXPLORER</div>
            <h1>Map explorer</h1>
          </div>
          <div className="topbar-actions">
            <div className="entity-total"><Database size={16} /><span>{entitiesQuery.isLoading ? "…" : entities.length} shown</span></div>
            <button className="button button-primary add-button" type="button" onClick={openCreate}>
              <Plus size={17} /> Add entity
            </button>
          </div>
        </header>

        {toast && (
          <div className="toast" role="status">
            <span className="toast-check">✓</span>{toast}
            <button className="icon-button" type="button" aria-label="Dismiss message" onClick={() => setToast("")}><X size={16} /></button>
          </div>
        )}

        <section className="workspace" aria-label="Entity workspace">
          <aside className="entity-panel" aria-label="Entities">
            {selected ? (
              <EntityDetail
                entity={selected}
                onBack={() => setSelectedId(null)}
                onEdit={openEdit}
                onDelete={() => { deleteMutation.reset(); setDeleteOpen(true); }}
              />
            ) : (
              <>
                <div className="panel-heading flex items-center justify-between">
                  <div>
                    <h2>Entities</h2>
                    <p>{entities.length} {entities.length === 1 ? "location" : "locations"} shown</p>
                  </div>
                  <button className="icon-button quick-add" type="button" onClick={openCreate} aria-label="Add entity"><CirclePlus size={19} /></button>
                </div>
                <div className="filter-controls">
                  <label className="search-field">
                    <Search size={16} aria-hidden="true" />
                    <input value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} placeholder="Search entities…" aria-label="Search by code or name" />
                    {filters.q && <button type="button" className="search-clear" onClick={() => setFilters({ ...filters, q: "" })} aria-label="Clear search"><X size={14} /></button>}
                  </label>
                  <div className="filter-selects">
                    <label className="sr-only" htmlFor="category-filter">Filter by category</label>
                    <select id="category-filter" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value as EntityFilters["category"] })}>
                      <option value="">All categories</option>
                      <option value="vehicle">Vehicle</option>
                      <option value="iot_device">IoT device</option>
                      <option value="facility">Facility</option>
                    </select>
                    <label className="sr-only" htmlFor="status-filter">Filter by status</label>
                    <select id="status-filter" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as EntityFilters["status"] })}>
                      <option value="">All statuses</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                  {(filters.q || filters.category || filters.status) && (
                    <button className="clear-filters" type="button" onClick={() => setFilters(emptyFilters)}>Clear filters</button>
                  )}
                </div>

                <div className="entity-list" aria-live="polite">
                  {entitiesQuery.isLoading ? (
                    <div className="state-message"><Activity className="spin" size={20} /><span>Loading entities…</span></div>
                  ) : entitiesQuery.isError ? (
                    <div className="state-message state-error">
                      <span>Couldn’t load entities.</span>
                      <button className="text-button" type="button" onClick={() => entitiesQuery.refetch()}>Retry</button>
                    </div>
                  ) : entities.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-icon"><MapPinned size={23} /></span>
                      <strong>{filters.q || filters.category || filters.status ? "No matches found" : "No entities yet"}</strong>
                      <p>{filters.q || filters.category || filters.status ? "Try another search or clear filters." : "Add your first location to see it on the map."}</p>
                      {!filters.q && !filters.category && !filters.status && <button className="text-button" type="button" onClick={openCreate}>Add an entity <ChevronRight size={14} /></button>}
                    </div>
                  ) : (
                    entities.map((entity) => <EntityRow key={entity.id} entity={entity} selected={selectedId === entity.id} onClick={() => setSelectedId(entity.id)} />)
                  )}
                </div>
                <div className="panel-footer"><span className="status-indicator" /> Showing stored locations</div>
              </>
            )}
          </aside>

          <section className="map-panel" aria-label="Interactive entity map">
            <EntityMap
              entities={entities}
              selected={selected}
              pickerActive={pickerActive}
              onSelect={(entity) => setSelectedId(entity.id)}
              onPick={handleMapPick}
              onCancelPick={() => { setPickerActive(false); setFormOpen(true); }}
            />
            <div className="map-caption"><MapPinned size={15} /> Stored entity locations <span>·</span> OpenStreetMap</div>
          </section>
        </section>
      </main>

      <Modal open={formOpen} title={editId ? "Edit entity" : "Add entity"} onClose={closeForm} wide>
        <EntityForm
          key={formSession}
          initial={editing ? toInput(editing) : null}
          pending={saveMutation.isPending}
          pickerActive={pickerActive}
          pickedLocation={pickedLocation}
          onPickerActiveChange={(active) => {
            setPickerActive(active);
            setFormOpen(!active);
          }}
          onSave={save}
          onCancel={closeForm}
        />
      </Modal>

      <Modal open={deleteOpen} title="Delete entity?" onClose={() => setDeleteOpen(false)}>
        <div className="delete-content">
          <p>This will permanently remove <strong>{selected?.name ?? "this entity"}</strong> from the map and database.</p>
          {deleteMutation.isError && <p className="form-error" role="alert">{deleteMutation.error.message || "Delete failed. Try again."}</p>}
          <div className="modal-actions">
            <button className="button button-secondary" type="button" onClick={() => setDeleteOpen(false)} disabled={deleteMutation.isPending}>Cancel</button>
            <button className="button button-danger" type="button" onClick={() => selected && deleteMutation.mutate(selected.id)} disabled={!selected || deleteMutation.isPending}>
              <Trash2 size={16} /> {deleteMutation.isPending ? "Deleting…" : "Delete entity"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function EntityRow({ entity, selected, onClick }: { entity: Entity; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`entity-row ${selected ? "selected" : ""}`} onClick={onClick}>
      <span className={`category-mark ${entity.category}`} aria-hidden="true" />
      <span className="entity-row-copy">
        <span className="entity-row-top"><strong>{entity.name}</strong><span className={`status-pill ${entity.status}`}>{entity.status}</span></span>
        <span className="entity-row-bottom"><span>{entity.code}</span><span className="row-separator">·</span><span>{categoryText(entity.category)}</span></span>
      </span>
      <ChevronRight className="row-chevron" size={16} />
    </button>
  );
}

function EntityDetail({ entity, onBack, onEdit, onDelete }: { entity: Entity; onBack: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="detail-panel">
      <button className="back-button" type="button" onClick={onBack}><ArrowLeft size={16} /> All entities</button>
      <div className="detail-identity">
        <span className={`detail-mark ${entity.category}`}><MapPinned size={21} /></span>
        <div><span className="detail-code">{entity.code}</span><h2>{entity.name}</h2></div>
      </div>
      <div className="detail-badges"><span className={`status-pill ${entity.status}`}>{entity.status}</span><span className="category-pill">{categoryText(entity.category)}</span></div>
      <div className="detail-actions">
        <button className="button button-secondary" type="button" onClick={onEdit}><Pencil size={15} /> Edit</button>
        <button className="button button-delete-outline" type="button" onClick={onDelete}><Trash2 size={15} /> Delete</button>
      </div>
      <div className="detail-divider" />
      <h3 className="detail-section-title">Entity details</h3>
      <dl className="detail-list">
        <DetailItem label="Latitude" value={entity.latitude.toFixed(6)} />
        <DetailItem label="Longitude" value={entity.longitude.toFixed(6)} />
        <DetailItem label="Description" value={entity.description || "No description"} />
        <DetailItem label="Created" value={formatDate(entity.created_at)} />
        <DetailItem label="Last updated" value={formatDate(entity.updated_at)} />
      </dl>
      <div className="detail-map-note"><MapPinned size={15} /> Marker selected on map</div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return <div className="detail-item"><dt>{label}</dt><dd>{value}</dd></div>;
}

function toInput(entity: Entity): EntityInput {
  return {
    code: entity.code,
    name: entity.name,
    category: entity.category,
    status: entity.status,
    latitude: entity.latitude,
    longitude: entity.longitude,
    description: entity.description,
  };
}

function categoryText(category: string) {
  return category === "iot_device" ? "IoT device" : category.charAt(0).toUpperCase() + category.slice(1);
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleString();
}
