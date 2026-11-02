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
        setError("root.server", { type: "server", message: "Could not save entity. Try again." });
      }
    }
  });

  const fieldError = (field: keyof EntityInput) => errors[field]?.message;

  return (
    <form className="entity-form" onSubmit={submit} onChange={() => clearErrors("root.server")} noValidate>
      <div className="form-grid">
        <label className="form-field">
          <span>Entity code <b>*</b></span>
          <input {...register("code")} placeholder="VEH-001" autoFocus aria-invalid={!!errors.code} />
          {fieldError("code") && <small className="field-error">{fieldError("code")}</small>}
        </label>
        <label className="form-field">
          <span>Name <b>*</b></span>
          <input {...register("name")} placeholder="North depot vehicle" aria-invalid={!!errors.name} />
          {fieldError("name") && <small className="field-error">{fieldError("name")}</small>}
        </label>
        <label className="form-field">
          <span>Category <b>*</b></span>
          <select {...register("category")} aria-invalid={!!errors.category}>
            {categories.map((category) => <option key={category} value={category}>{categoryLabel(category)}</option>)}
          </select>
          {fieldError("category") && <small className="field-error">{fieldError("category")}</small>}
        </label>
        <label className="form-field">
          <span>Status <b>*</b></span>
          <select {...register("status")} aria-invalid={!!errors.status}>
            {statuses.map((status) => <option key={status} value={status}>{capitalize(status)}</option>)}
          </select>
          {fieldError("status") && <small className="field-error">{fieldError("status")}</small>}
        </label>
        <label className="form-field">
          <span>Latitude <b>*</b></span>
          <input {...register("latitude", { valueAsNumber: true })} type="number" step="any" min="-90" max="90" aria-invalid={!!errors.latitude} />
          {fieldError("latitude") && <small className="field-error">{fieldError("latitude")}</small>}
        </label>
        <label className="form-field">
          <span>Longitude <b>*</b></span>
          <input {...register("longitude", { valueAsNumber: true })} type="number" step="any" min="-180" max="180" aria-invalid={!!errors.longitude} />
          {fieldError("longitude") && <small className="field-error">{fieldError("longitude")}</small>}
        </label>
      </div>
      <button
        className={`pick-location-button ${pickerActive ? "is-active" : ""}`}
        type="button"
        aria-pressed={pickerActive}
        onClick={() => onPickerActiveChange(!pickerActive)}
      >
        <MapPin size={16} />
        {pickerActive ? "Click map to set location · Stop picking" : "Pick coordinates from map"}
      </button>
      <label className="form-field description-field">
        <span>Description <em>Optional</em></span>
        <textarea {...register("description")} rows={3} maxLength={500} placeholder="Add useful location details" aria-invalid={!!errors.description} />
        {fieldError("description") && <small className="field-error">{fieldError("description")}</small>}
      </label>
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
