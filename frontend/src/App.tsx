import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  ClipboardCopy,
  Cpu,
  Database,
  List,
  LoaderCircle,
  Map,
  MapPin,
  MapPinned,
  Pencil,
  Plus,
  Search,
  Trash2,
  Truck,
  X,
  type LucideIcon,
} from "lucide-react";
import Modal from "./components/Modal";
import EntityForm, { type PickedLocation } from "./features/entities/EntityForm";
import { createEntity, deleteEntity, listEntities, updateEntity } from "./features/entities/api";
import type { Category, Entity, EntityFilters, EntityInput, EntityStatus } from "./features/entities/types";
import EntityMap from "./features/map/EntityMap";

const emptyFilters: EntityFilters = { q: "", category: "", status: "" };
type ToastMessage = { kind: "success" | "error"; message: string };

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
  const [mobileView, setMobileView] = useState<"list" | "map">("map");
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const entitiesQuery = useQuery({ queryKey: ["entities", filters], queryFn: () => listEntities(filters) });
  const entities = entitiesQuery.data ?? [];
  const selected = entities.find((entity) => entity.id === selectedId) ?? null;
  const editing = entities.find((entity) => entity.id === editId) ?? null;

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const saveMutation = useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: EntityInput }) =>
      id ? updateEntity(id, input) : createEntity(input),
    onSuccess: async (entity) => {
      await queryClient.invalidateQueries({ queryKey: ["entities"] });
      setSelectedId(entity.id);
      setFilters(emptyFilters);
      setMobileView("map");
      closeForm();
      setToast({ kind: "success", message: editId ? "Entity changes saved." : "Entity created." });
    },
    onError: (error) => setToast({ kind: "error", message: error.message || "Could not save entity." }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEntity,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["entities"] });
      setSelectedId(null);
      setDeleteOpen(false);
      setToast({ kind: "success", message: "Entity deleted." });
    },
    onError: (error) => setToast({ kind: "error", message: error.message || "Could not delete entity." }),
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

  function selectEntity(entity: Entity) {
    setSelectedId(entity.id);
    setMobileView("map");
  }

  async function copyCoordinates(entity: Entity) {
    try {
      await navigator.clipboard.writeText(`${entity.latitude}, ${entity.longitude}`);
      setToast({ kind: "success", message: "Coordinates copied to clipboard." });
    } catch {
      setToast({ kind: "error", message: "Clipboard is unavailable in this browser." });
    }
  }

  function save(input: EntityInput) {
    return saveMutation.mutateAsync({ id: editId, input }).then(() => undefined);
  }

  const apiState = entitiesQuery.isLoading ? "checking" : entitiesQuery.isError ? "offline" : "online";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#map-explorer" aria-label="GeoTrack home">
          <span className="brand-mark"><MapPinned size={21} strokeWidth={2.2} /></span>
          <span className="brand-name">Geo<span>Track</span></span>
        </a>
        <div className="sidebar-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          <a className="nav-item active" href="#map-explorer" aria-current="page" title="Map explorer">
            <MapPinned size={18} /><span>Map explorer</span>
          </a>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-status">
            <span className={`status-indicator ${apiState}`} />
            <span>{apiState === "checking" ? "Connecting to API" : apiState === "offline" ? "API unavailable" : "API connected"}</span>
          </div>
          <span className="sidebar-version">GEOTRACK · LOCAL WORKSPACE</span>
        </div>
      </aside>

      <main className="main-shell" id="map-explorer">
        <header className="topbar">
          <div className="page-heading">
            <div className="eyebrow"><span>WORKSPACE</span><ChevronRight size={13} /><span>MAP EXPLORER</span></div>
            <h1>Geographic workspace</h1>
            <p>Manage your fixed locations and keep every entity in view.</p>
          </div>
          <div className="topbar-actions">
            <div className="entity-total" aria-live="polite">
              <span className="entity-total-icon"><Database size={16} /></span>
              <span><strong>{entitiesQuery.isLoading ? "—" : entities.length}</strong><small>entities in view</small></span>
            </div>
            <button className="button button-primary add-button" type="button" onClick={openCreate} aria-label="Add entity">
              <Plus size={17} /><span>Add entity</span>
            </button>
          </div>
        </header>

        <div className="mobile-view-toggle" role="group" aria-label="Workspace view">
          <button type="button" aria-pressed={mobileView === "list"} className={mobileView === "list" ? "active" : ""} onClick={() => setMobileView("list")}>
            <List size={16} /> Entities
          </button>
          <button type="button" aria-pressed={mobileView === "map"} className={mobileView === "map" ? "active" : ""} onClick={() => setMobileView("map")}>
            <Map size={16} /> Map
          </button>
        </div>

        <section className={`workspace workspace-mobile-${mobileView}`} aria-label="Entity workspace">
          <aside className="entity-panel" aria-label="Entity list">
            <div className="panel-heading">
              <div>
                <div className="panel-title-row"><h2>Entities</h2><span className="result-count">{entitiesQuery.isLoading ? "—" : entities.length}</span></div>
                <p>Locations stored in your workspace</p>
              </div>
              <button className="icon-button quick-add" type="button" onClick={openCreate} aria-label="Add entity"><Plus size={19} /></button>
            </div>

            <div className="filter-controls">
              <label className="search-field">
                <Search size={17} aria-hidden="true" />
                <input value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} placeholder="Search name or identifier" aria-label="Search by code or name" />
                {filters.q && <button type="button" className="search-clear" onClick={() => setFilters({ ...filters, q: "" })} aria-label="Clear search"><X size={15} /></button>}
              </label>
              <div className="filter-selects">
                <label className="select-wrap">
                  <span className="sr-only">Filter by category</span>
                  <select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value as EntityFilters["category"] })}>
                    <option value="">All categories</option>
                    <option value="vehicle">Vehicle</option>
                    <option value="iot_device">IoT device</option>
                    <option value="facility">Facility</option>
                  </select>
                </label>
                <label className="select-wrap">
                  <span className="sr-only">Filter by status</span>
                  <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as EntityFilters["status"] })}>
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </label>
              </div>
              {(filters.q || filters.category || filters.status) && (
                <button className="clear-filters" type="button" onClick={() => setFilters(emptyFilters)}>Clear all filters</button>
              )}
            </div>

            <div className="entity-list" aria-live="polite" aria-busy={entitiesQuery.isLoading}>
              {entitiesQuery.isLoading ? (
                <div className="entity-skeletons" aria-label="Loading entities">
                  {Array.from({ length: 5 }, (_, index) => <div className="entity-skeleton" key={index}><span /><div><i /><i /></div></div>)}
                </div>
              ) : entitiesQuery.isError ? (
                <div className="state-message state-error" role="alert">
                  <CircleAlert size={22} />
                  <strong>Couldn’t load entities</strong>
                  <p>Check your API connection and try again.</p>
                  <button className="button button-secondary" type="button" onClick={() => entitiesQuery.refetch()}><Activity size={15} /> Retry request</button>
                </div>
              ) : entities.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon"><MapPinned size={23} /></span>
                  <strong>{filters.q || filters.category || filters.status ? "No matching entities" : "Your map is ready"}</strong>
                  <p>{filters.q || filters.category || filters.status ? "Try another search or clear filters to see more locations." : "Add your first entity and its saved location will appear here."}</p>
                  {!filters.q && !filters.category && !filters.status && <button className="button button-primary" type="button" onClick={openCreate}><Plus size={16} /> Add an entity</button>}
                  {(filters.q || filters.category || filters.status) && <button className="text-button" type="button" onClick={() => setFilters(emptyFilters)}>Clear filters</button>}
                </div>
              ) : (
                entities.map((entity) => <EntityRow key={entity.id} entity={entity} selected={selectedId === entity.id} onClick={() => selectEntity(entity)} />)
              )}
            </div>
            <div className="panel-footer"><span className="status-indicator online" /> Showing saved locations <span className="footer-dot">·</span> Not live tracking</div>
          </aside>

          <section className="map-panel" aria-label="Interactive entity map">
            <EntityMap
              entities={entities}
              selected={selected}
              pickerActive={pickerActive}
              onSelect={selectEntity}
              onPick={handleMapPick}
              onCancelPick={() => { setPickerActive(false); setFormOpen(true); }}
            />
            <div className="map-caption"><MapPin size={15} /><span>Saved entity locations</span><span className="caption-divider" />OpenStreetMap</div>
            {selected && !pickerActive && (
              <EntityDetailDrawer
                entity={selected}
                onClose={() => setSelectedId(null)}
                onEdit={openEdit}
                onDelete={() => { deleteMutation.reset(); setDeleteOpen(true); }}
                onCopyCoordinates={() => copyCoordinates(selected)}
              />
            )}
          </section>
        </section>
      </main>

      {toast && (
        <div className={`toast toast-${toast.kind}`} role={toast.kind === "error" ? "alert" : "status"}>
          <span className="toast-icon">{toast.kind === "success" ? <Check size={16} /> : <CircleAlert size={16} />}</span>
          <span>{toast.message}</span>
          <button className="icon-button" type="button" aria-label="Dismiss notification" onClick={() => setToast(null)}><X size={16} /></button>
        </div>
      )}

      <Modal open={formOpen} title={editId ? "Edit entity" : "Add entity"} onClose={closeForm} wide>
        <EntityForm
          key={formSession}
          initial={editing ? toInput(editing) : null}
          pending={saveMutation.isPending}
          pickerActive={pickerActive}
          pickedLocation={pickedLocation}
          onPickerActiveChange={(active) => { setPickerActive(active); setFormOpen(!active); }}
          onSave={save}
          onCancel={closeForm}
        />
      </Modal>

      <Modal open={deleteOpen} title="Delete this entity?" onClose={() => setDeleteOpen(false)}>
        <div className="delete-content">
          <span className="delete-warning-icon"><Trash2 size={20} /></span>
          <p>This permanently removes <strong>{selected?.name ?? "this entity"}</strong> from the workspace and map.</p>
          <p className="delete-helper">This action cannot be undone.</p>
          <div className="modal-actions">
            <button className="button button-secondary" type="button" onClick={() => setDeleteOpen(false)} disabled={deleteMutation.isPending}>Cancel</button>
            <button className="button button-danger" type="button" onClick={() => selected && deleteMutation.mutate(selected.id)} disabled={!selected || deleteMutation.isPending}>
              {deleteMutation.isPending ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={16} />}
              {deleteMutation.isPending ? "Deleting…" : "Delete entity"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function EntityRow({ entity, selected, onClick }: { entity: Entity; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`entity-row ${selected ? "selected" : ""}`} onClick={onClick} aria-pressed={selected}>
      <span className={`category-icon ${entity.category}`} aria-hidden="true"><CategoryIcon category={entity.category} size={18} /></span>
      <span className="entity-row-copy">
        <span className="entity-row-top"><strong>{entity.name}</strong><StatusBadge status={entity.status} /></span>
        <span className="entity-row-code">{entity.code}</span>
        <span className="entity-row-location"><MapPin size={13} />{entity.latitude.toFixed(4)}, {entity.longitude.toFixed(4)}</span>
      </span>
      <ChevronRight className="row-chevron" size={17} aria-hidden="true" />
    </button>
  );
}

function EntityDetailDrawer({ entity, onClose, onEdit, onDelete, onCopyCoordinates }: {
  entity: Entity;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopyCoordinates: () => void;
}) {
  return (
    <aside className="entity-detail-drawer" aria-label={`${entity.name} details`}>
      <div className="detail-heading">
        <div className="detail-heading-copy"><span className="detail-eyebrow">ENTITY DETAILS</span><h2>{entity.name}</h2></div>
        <button className="icon-button detail-close" type="button" onClick={onClose} aria-label="Close entity details"><X size={18} /></button>
      </div>
      <div className="detail-scroll">
        <div className="detail-badges">
          <span className={`category-tag ${entity.category}`}><CategoryIcon category={entity.category} size={14} />{categoryLabel(entity.category)}</span>
          <StatusBadge status={entity.status} />
        </div>

        <section className="detail-card detail-identifier">
          <span className="detail-label">Identifier</span>
          <strong>{entity.code}</strong>
          <span className="record-id">Record ID · {entity.id}</span>
        </section>

        <section className="detail-section">
          <h3><MapPin size={15} /> Coordinates</h3>
          <div className="coordinates-card">
            <div className="coordinate-value"><span>Latitude</span><strong>{entity.latitude.toFixed(6)}</strong></div>
            <div className="coordinate-value"><span>Longitude</span><strong>{entity.longitude.toFixed(6)}</strong></div>
            <button className="copy-coordinates" type="button" onClick={onCopyCoordinates}><ClipboardCopy size={15} />Copy coordinates</button>
          </div>
        </section>

        <section className="detail-section">
          <h3><Database size={15} /> Description</h3>
          <p className={`detail-description ${entity.description ? "" : "muted"}`}>{entity.description || "No description provided."}</p>
        </section>

        <section className="detail-section detail-timestamps">
          <h3><CalendarDays size={15} /> Record history</h3>
          <DetailDate label="Created" value={entity.created_at} />
          <DetailDate label="Last updated" value={entity.updated_at} />
        </section>
      </div>
      <div className="detail-actions">
        <button className="button button-secondary" type="button" onClick={onEdit}><Pencil size={16} />Edit entity</button>
        <button className="button button-delete-outline" type="button" onClick={onDelete}><Trash2 size={16} />Delete</button>
      </div>
    </aside>
  );
}

function DetailDate({ label, value }: { label: string; value: string }) {
  return <div className="detail-date"><span>{label}</span><strong>{formatDate(value)}</strong></div>;
}

function StatusBadge({ status }: { status: EntityStatus }) {
  return <span className={`status-pill ${status}`}><i />{capitalize(status)}</span>;
}

function CategoryIcon({ category, size = 18 }: { category: Category; size?: number }) {
  const Icon: LucideIcon = category === "vehicle" ? Truck : category === "iot_device" ? Cpu : Building2;
  return <Icon size={size} strokeWidth={1.9} aria-hidden="true" />;
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

function categoryLabel(category: Category) {
  return category === "iot_device" ? "IoT device" : capitalize(category);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}
