import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, MapPin } from "lucide-react";
import { ApiError } from "./api";
import { entitySchema } from "./schema";
import { categories, statuses, type EntityInput } from "./types";

export type PickedLocation = { latitude: number; longitude: number; sequence: number };

type Props = {
  initial: EntityInput | null;
  pending: boolean;
  pickerActive: boolean;
  pickedLocation: PickedLocation | null;
  onPickerActiveChange: (active: boolean) => void;
  onSave: (input: EntityInput) => Promise<void>;
  onCancel: () => void;
};

const defaultValues: EntityInput = {
  code: "",
  name: "",
  category: "vehicle",
  status: "active",
  latitude: -7.9666,
  longitude: 112.6326,
  description: "",
};

export default function EntityForm({
  initial,
  pending,
  pickerActive,
  pickedLocation,
  onPickerActiveChange,
  onSave,
  onCancel,
}: Props) {
  const {
    register,
    handleSubmit,
    clearErrors,
    setError,
    setValue,
    formState: { errors },
  } = useForm<EntityInput>({ resolver: zodResolver(entitySchema), defaultValues: initial ?? defaultValues });

  useEffect(() => {
    if (!pickedLocation) return;
    setValue("latitude", pickedLocation.latitude, { shouldDirty: true, shouldValidate: true });
    setValue("longitude", pickedLocation.longitude, { shouldDirty: true, shouldValidate: true });
  }, [pickedLocation, setValue]);

  const submit = handleSubmit(async (input) => {
    try {
      await onSave(input);
    } catch (error) {
      if (error instanceof ApiError) {
        Object.entries(error.fields).forEach(([field, message]) => {
          setError(field as keyof EntityInput, { type: "server", message });
        });
        setError("root.server", { type: "server", message: error.message });
      } else {
        setError("root.server", { type: "server", message: "Could not save entity. Check the details and try again." });
      }
    }
  });

  const fieldError = (field: keyof EntityInput) => {
    const message = errors[field]?.message;
    return typeof message === "string" ? message : undefined;
  };

  return (
    <form className="entity-form" onSubmit={submit} onChange={() => clearErrors("root.server")} noValidate>
      <fieldset className="form-fields" disabled={pending}>
        <div className="form-grid">
          <label className="form-field">
            <span>Entity code <b>*</b></span>
            <input {...register("code")} placeholder="VEH-001" autoFocus aria-invalid={!!errors.code} aria-describedby={errors.code ? "code-help code-error" : "code-help"} />
            <small className="form-help" id="code-help">3–32 letters, numbers, or hyphens. Must be unique.</small>
            {fieldError("code") && <small className="field-error" id="code-error" role="alert">{fieldError("code")}</small>}
          </label>
          <label className="form-field">
            <span>Name <b>*</b></span>
            <input {...register("name")} placeholder="North depot vehicle" aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-help name-error" : "name-help"} />
            <small className="form-help" id="name-help">Use a recognizable name, up to 100 characters.</small>
            {fieldError("name") && <small className="field-error" id="name-error" role="alert">{fieldError("name")}</small>}
          </label>
          <label className="form-field">
            <span>Category <b>*</b></span>
            <select {...register("category")} aria-invalid={!!errors.category} aria-describedby={errors.category ? "category-error" : undefined}>
              {categories.map((category) => <option key={category} value={category}>{categoryLabel(category)}</option>)}
            </select>
            {fieldError("category") && <small className="field-error" id="category-error" role="alert">{fieldError("category")}</small>}
          </label>
          <label className="form-field">
            <span>Status <b>*</b></span>
            <select {...register("status")} aria-invalid={!!errors.status} aria-describedby={errors.status ? "status-error" : undefined}>
              {statuses.map((status) => <option key={status} value={status}>{capitalize(status)}</option>)}
            </select>
            {fieldError("status") && <small className="field-error" id="status-error" role="alert">{fieldError("status")}</small>}
          </label>
        </div>

        <section className="form-location" aria-labelledby="location-heading">
          <div className="form-section-heading">
            <div><h3 id="location-heading">Location</h3><p>Enter coordinates or choose a point on the map.</p></div>
            <button
              className={`pick-location-button ${pickerActive ? "is-active" : ""}`}
              type="button"
              aria-pressed={pickerActive}
              onClick={() => onPickerActiveChange(!pickerActive)}
            >
              <MapPin size={16} />{pickerActive ? "Stop picking" : "Choose on map"}
            </button>
          </div>
          <div className="coordinate-fields">
            <label className="form-field">
              <span>Latitude <b>*</b></span>
              <input {...register("latitude", { valueAsNumber: true })} type="number" step="any" min="-90" max="90" inputMode="decimal" aria-invalid={!!errors.latitude} aria-describedby={errors.latitude ? "latitude-help latitude-error" : "latitude-help"} />
              <small className="form-help" id="latitude-help">Decimal degrees, −90 to 90.</small>
              {fieldError("latitude") && <small className="field-error" id="latitude-error" role="alert">{fieldError("latitude")}</small>}
            </label>
            <label className="form-field">
              <span>Longitude <b>*</b></span>
              <input {...register("longitude", { valueAsNumber: true })} type="number" step="any" min="-180" max="180" inputMode="decimal" aria-invalid={!!errors.longitude} aria-describedby={errors.longitude ? "longitude-help longitude-error" : "longitude-help"} />
              <small className="form-help" id="longitude-help">Decimal degrees, −180 to 180.</small>
              {fieldError("longitude") && <small className="field-error" id="longitude-error" role="alert">{fieldError("longitude")}</small>}
            </label>
          </div>
        </section>

        <label className="form-field description-field">
          <span>Description <em>Optional</em></span>
          <textarea {...register("description")} rows={3} maxLength={500} placeholder="Add useful details about this location" aria-invalid={!!errors.description} aria-describedby={errors.description ? "description-help description-error" : "description-help"} />
          <small className="form-help" id="description-help">Up to 500 characters.</small>
          {fieldError("description") && <small className="field-error" id="description-error" role="alert">{fieldError("description")}</small>}
        </label>
      </fieldset>

      {errors.root?.server?.message && <p className="form-error" role="alert">{errors.root.server.message}</p>}
      <div className="modal-actions">
        <button className="button button-secondary" type="button" onClick={onCancel} disabled={pending}>Cancel</button>
        <button className="button button-primary" type="submit" disabled={pending}>
          {pending && <LoaderCircle size={16} className="spin" />}
          {pending ? "Saving…" : initial ? "Save changes" : "Create entity"}
        </button>
      </div>
    </form>
  );
}

function categoryLabel(category: string) {
  return category === "iot_device" ? "IoT device" : capitalize(category);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
