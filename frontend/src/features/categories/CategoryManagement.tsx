import { useMemo, useState, type CSSProperties } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertCircle, ChevronLeft, ChevronRight, LoaderCircle, MapPin, Plus, Search, Trash2, X } from "lucide-react";
import Modal from "../../components/Modal";
import { ApiError } from "../entities/api";
import { createCategory, deleteCategory, listCategories, updateCategory } from "./api";
import { categorySchema } from "./schema";
import type { Category, CategoryInput } from "./types";
import { filterCategories, paginateCategories, type CategorySource } from "./list";
import type { ColorKey, MarkerStyle } from "./icons";
import {
  CategoryGlyph,
  CategoryMarker,
  COLOR_PALETTE,
  ICON_CATALOG,
  ICON_GROUPS,
  MARKER_STYLES,
  getColor,
} from "./icons";

const blankCategory: CategoryInput = { name: "", description: "", icon_key: "map-pin", color: "orange", marker_style: "pin" };

export default function CategoryManagement({ onCategoryDeleted, onViewOnMap }: {
  onCategoryDeleted: (id: string) => void;
  onViewOnMap: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const [search, setSearch] = useState("");
  const [source, setSource] = useState<CategorySource>("all");
  const [markerStyle, setMarkerStyle] = useState<MarkerStyle | "">("");
  const [color, setColor] = useState<ColorKey | "">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [notice, setNotice] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const items = query.data ?? [];
  const filtered = useMemo(() => filterCategories(items, {
    search,
    source,
    markerStyle,
    color,
  }), [items, search, source, markerStyle, color]);
  const pagination = paginateCategories(filtered, page, pageSize);
  const hasFilters = !!search || source !== "all" || !!markerStyle || !!color;

  function clearFilters() {
    setSearch("");
    setSource("all");
    setMarkerStyle("");
    setColor("");
    setPage(1);
  }

  const saveMutation = useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: CategoryInput }) =>
      id ? updateCategory(id, input) : createCategory(input),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
        queryClient.invalidateQueries({ queryKey: ["entities"] }),
      ]);
      setFormOpen(false);
      setEditing(null);
      setPage(1);
      setNotice(variables.id ? "Category changes saved." : "Category created.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: async (_, id) => {
      onCategoryDeleted(id);
      setPage(1);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
        queryClient.invalidateQueries({ queryKey: ["entities"] }),
      ]);
      setDeleting(null);
      setDeleteError("");
      setNotice("Category deleted.");
    },
    onError: (error) => setDeleteError(error.message || "Could not delete category."),
  });

  function openCreate() {
    saveMutation.reset();
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(item: Category) {
    saveMutation.reset();
    setEditing(item);
    setFormOpen(true);
  }

  const subtitle = `${items.length} ${items.length === 1 ? "category" : "categories"} · Manage entity labels and map markers`;
  return (
    <>
      <header className="topbar category-topbar">
        <div className="page-heading">
          <div className="eyebrow"><span>WORKSPACE</span><span aria-hidden="true">›</span><span>CATEGORIES</span></div>
          <h1>Category management</h1>
          <p>{query.isLoading ? "Loading categories…" : subtitle}</p>
        </div>
        <button className="button button-primary" type="button" onClick={openCreate} disabled={query.isLoading || query.isError}>
          <Plus size={17} /> Add category
        </button>
      </header>

      {notice && <div className="category-notice" role="status">{notice}<button type="button" aria-label="Dismiss notification" onClick={() => setNotice("")}><X size={15} /></button></div>}

      <section className="category-page" aria-label="Categories">
        <div className="category-toolbar">
          <label className="search-field">
            <Search size={17} aria-hidden="true" />
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search categories" aria-label="Search categories" />
            {search && <button type="button" className="search-clear" onClick={() => { setSearch(""); setPage(1); }} aria-label="Clear search"><X size={15} /></button>}
          </label>
          <div className="category-filters">
            <label className="select-wrap">
              <span className="sr-only">Filter by category type</span>
              <select value={source} onChange={(event) => { setSource(event.target.value as CategorySource); setPage(1); }}>
                <option value="all">All types</option><option value="built-in">Built-in</option><option value="custom">Custom</option>
              </select>
            </label>
            <label className="select-wrap">
              <span className="sr-only">Filter by marker shape</span>
              <select value={markerStyle} onChange={(event) => { setMarkerStyle(event.target.value as MarkerStyle | ""); setPage(1); }}>
                <option value="">All marker shapes</option>{MARKER_STYLES.map((style) => <option key={style} value={style}>{formatMarkerStyle(style)}</option>)}
              </select>
            </label>
            <label className="select-wrap">
              <span className="sr-only">Filter by color</span>
              <select value={color} onChange={(event) => { setColor(event.target.value as ColorKey | ""); setPage(1); }}>
                <option value="">All colors</option>{COLOR_PALETTE.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
              </select>
            </label>
          </div>
          {hasFilters && <button className="clear-filters" type="button" onClick={clearFilters}>Clear filters</button>}
          <span className="category-count">{filtered.length} of {items.length}</span>
        </div>

        {query.isLoading ? (
          <div className="category-table-loading" aria-label="Loading categories" aria-busy="true">
            {Array.from({ length: 3 }, (_, index) => <div className="category-skeleton" key={index}><i /><span /><span /></div>)}
          </div>
        ) : query.isError ? (
          <div className="category-state category-state-error" role="alert">
            <AlertCircle size={24} /><strong>Couldn’t load categories</strong><p>{query.error.message}</p>
            <button className="button button-secondary" type="button" onClick={() => query.refetch()}>Retry request</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="category-state">
            <span className="category-empty-icon"><Search size={22} /></span>
            <strong>{items.length ? "No matching categories" : "No categories yet"}</strong>
            <p>{items.length ? "Try another search or clear filters." : "Create a category to use it on entities and map markers."}</p>
            {items.length > 0 && hasFilters && <button className="button button-secondary" type="button" onClick={clearFilters}>Clear filters</button>}
            {!items.length && <button className="button button-primary" type="button" onClick={openCreate}><Plus size={16} /> Add category</button>}
          </div>
        ) : (
          <>
            <div className="category-table-scroll">
              <table className="category-table">
                <caption className="sr-only">Category list</caption>
                <thead><tr><th scope="col">Category</th><th scope="col">Entities</th><th scope="col">Marker</th><th scope="col">Type</th><th scope="col">Actions</th></tr></thead>
                <tbody>
                  {pagination.items.map((item) => <CategoryRow key={item.id} item={item} onEdit={() => openEdit(item)} onDelete={() => { setDeleteError(""); setDeleting(item); }} onViewOnMap={() => onViewOnMap(item.id)} />)}
                </tbody>
              </table>
            </div>
            <footer className="category-pagination">
              <span>Showing {pagination.firstItem}–{pagination.lastItem} of {filtered.length}</span>
              <div className="category-pagination-controls">
                <label className="category-page-size">Rows per page
                  <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} aria-label="Rows per page">
                    <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
                  </select>
                </label>
                <button className="icon-button category-page-button" type="button" aria-label="Previous page" onClick={() => setPage(pagination.currentPage - 1)} disabled={pagination.currentPage === 1}><ChevronLeft size={18} /></button>
                <span>Page {pagination.currentPage} of {pagination.pageCount}</span>
                <button className="icon-button category-page-button" type="button" aria-label="Next page" onClick={() => setPage(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.pageCount}><ChevronRight size={18} /></button>
              </div>
            </footer>
          </>
        )}
      </section>

      <Modal open={formOpen} title={editing ? "Edit category" : "Create category"} onClose={() => setFormOpen(false)} wide>
        <CategoryForm
          key={editing?.id ?? "new"}
          initial={editing ? toInput(editing) : blankCategory}
          pending={saveMutation.isPending}
          onCancel={() => setFormOpen(false)}
          onSave={(input) => saveMutation.mutateAsync({ id: editing?.id ?? null, input })}
        />
      </Modal>

      <Modal open={!!deleting} title="Delete category?" onClose={() => !deleteMutation.isPending && setDeleting(null)}>
        <div className="delete-content">
          <span className="delete-warning-icon"><Trash2 size={20} /></span>
          <p>Delete <strong>{deleting?.name}</strong>?</p>
          {deleting?.entity_count ? <p className="delete-helper">Category has {deleting.entity_count} assigned {deleting.entity_count === 1 ? "entity" : "entities"}. Reassign them before deleting.</p> : <p className="delete-helper">This action cannot be undone.</p>}
          {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
          <div className="modal-actions">
            <button className="button button-secondary" type="button" onClick={() => setDeleting(null)} disabled={deleteMutation.isPending}>Cancel</button>
            <button className="button button-danger" type="button" onClick={() => deleting && deleteMutation.mutate(deleting.id)} disabled={!deleting || !!deleting.entity_count || deleting.is_builtin || deleteMutation.isPending}>
              {deleteMutation.isPending ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={16} />}
              {deleteMutation.isPending ? "Deleting…" : "Delete category"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function CategoryRow({ item, onEdit, onDelete, onViewOnMap }: { item: Category; onEdit: () => void; onDelete: () => void; onViewOnMap: () => void }) {
  const color = getColor(item.color);
  return (
    <tr>
      <td><div className="category-table-name">
        <span className="category-row-icon" style={{ "--category-color": color.hex, "--category-soft": color.soft } as CSSProperties}><CategoryGlyph iconKey={item.icon_key} size={20} /></span>
        <span><strong>{item.name}</strong><small>{item.description || "No description"}</small></span>
      </div></td>
      <td>{item.entity_count}</td>
      <td><span className="category-marker-sample"><CategoryMarker iconKey={item.icon_key} color={item.color} markerStyle={item.marker_style} size={14} />{formatMarkerStyle(item.marker_style)}</span></td>
      <td><span className={`category-type-badge${item.is_builtin ? " is-built-in" : ""}`}>{item.is_builtin ? "Built-in" : "Custom"}</span></td>
      <td><div className="category-actions">
        <button className="category-map-link" type="button" onClick={onViewOnMap}><MapPin size={15} />View on map</button>
        <button className="category-action-button" type="button" onClick={onEdit}>Edit</button>
        <button className="icon-button category-delete" type="button" onClick={onDelete} aria-label={`Delete ${item.name}`} title={item.is_builtin ? "Built-in categories are kept" : item.entity_count ? "Category is in use" : "Delete category"} disabled={item.is_builtin || item.entity_count > 0}><Trash2 size={16} /></button>
      </div></td>
    </tr>
  );
}

function CategoryForm({ initial, pending, onSave, onCancel }: {
  initial: CategoryInput;
  pending: boolean;
  onSave: (input: CategoryInput) => Promise<unknown>;
  onCancel: () => void;
}) {
  const { register, handleSubmit, watch, setError, setValue, clearErrors, formState: { errors } } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: initial,
  });
  const input = watch();
  const [serverError, setServerError] = useState("");

  const submit = handleSubmit(async (value) => {
    setServerError("");
    try {
      await onSave(value);
    } catch (error) {
      if (error instanceof ApiError) {
        Object.entries(error.fields).forEach(([field, message]) => setError(field as keyof CategoryInput, { type: "server", message }));
        setServerError(error.message);
      } else setServerError("Could not save category. Try again.");
    }
  });
  const fieldError = (field: keyof CategoryInput) => typeof errors[field]?.message === "string" ? errors[field]?.message : undefined;

  return (
    <form className="category-form" onSubmit={submit} onChange={() => { clearErrors(); setServerError(""); }} noValidate>
      <fieldset disabled={pending} className="category-form-fields">
        <label className="form-field">
          <span>Category name <b>*</b></span>
          <input {...register("name")} autoFocus maxLength={60} placeholder="e.g. Cold storage" aria-invalid={!!errors.name} />
          {fieldError("name") && <small className="field-error" role="alert">{fieldError("name")}</small>}
        </label>
        <label className="form-field category-description-input">
          <span>Description <em>Optional</em></span>
          <textarea {...register("description")} rows={2} maxLength={500} placeholder="What belongs in this category?" aria-invalid={!!errors.description} />
          {fieldError("description") && <small className="field-error" role="alert">{fieldError("description")}</small>}
        </label>

        <fieldset className="category-choice-fieldset">
          <legend>Icon <b>*</b></legend>
          <div className="icon-catalog">
            {ICON_GROUPS.map((group) => (
              <section key={group} className="icon-group" aria-label={`${group} icons`}>
                <h3>{group}</h3>
                <div className="icon-grid">
                  {ICON_CATALOG.filter((entry) => entry.group === group).map(({ key, label, Icon }) => (
                    <button className={`icon-choice ${input.icon_key === key ? "selected" : ""}`} type="button" key={key} aria-pressed={input.icon_key === key} aria-label={label} title={label} onClick={() => setValue("icon_key", key, { shouldDirty: true, shouldValidate: true })}>
                      <Icon size={19} strokeWidth={1.8} /><span>{label}</span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <input type="hidden" {...register("icon_key")} />
          {fieldError("icon_key") && <small className="field-error" role="alert">{fieldError("icon_key")}</small>}
        </fieldset>

        <div className="category-form-split">
          <fieldset className="category-choice-fieldset">
            <legend>Marker color <b>*</b></legend>
            <div className="color-grid">
              {COLOR_PALETTE.map((color) => (
                <button type="button" key={color.key} className={`color-choice ${input.color === color.key ? "selected" : ""}`} aria-pressed={input.color === color.key} onClick={() => setValue("color", color.key, { shouldDirty: true, shouldValidate: true })}>
                  <i style={{ background: color.hex }} />{color.label}
                </button>
              ))}
            </div>
            <input type="hidden" {...register("color")} />
          </fieldset>
          <fieldset className="category-choice-fieldset">
            <legend>Marker shape <b>*</b></legend>
            <div className="marker-style-grid">
              {MARKER_STYLES.map((style) => (
                <button type="button" key={style} className={`marker-style-choice ${input.marker_style === style ? "selected" : ""}`} aria-pressed={input.marker_style === style} onClick={() => setValue("marker_style", style, { shouldDirty: true, shouldValidate: true })}>
                  <CategoryMarker iconKey={input.icon_key} color={input.color} markerStyle={style} size={16} />{formatMarkerStyle(style)}
                </button>
              ))}
            </div>
            <input type="hidden" {...register("marker_style")} />
          </fieldset>
        </div>
        <div className="marker-preview" aria-label="Live marker preview">
          <CategoryMarker iconKey={input.icon_key} color={input.color} markerStyle={input.marker_style} size={20} />
          <span>Map marker preview</span>
        </div>
      </fieldset>
      {serverError && <p className="form-error" role="alert">{serverError}</p>}
      <div className="modal-actions">
        <button className="button button-secondary" type="button" onClick={onCancel} disabled={pending}>Cancel</button>
        <button className="button button-primary" type="submit" disabled={pending}>
          {pending && <LoaderCircle className="spin" size={16} />}{pending ? "Saving…" : initial.name ? "Save changes" : "Create category"}
        </button>
      </div>
    </form>
  );
}

function toInput(category: Category): CategoryInput {
  return { name: category.name, description: category.description, icon_key: category.icon_key, color: category.color, marker_style: category.marker_style };
}

function formatMarkerStyle(style: string) {
  return style === "rounded-square" ? "Rounded square" : style.charAt(0).toUpperCase() + style.slice(1);
}
