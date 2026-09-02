"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveCourt } from "@/features/admin/actions";
import type { FormResult } from "@/features/admin/types";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import type { Court } from "@/lib/supabase/database.types";

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear cancha"}
    </Button>
  );
}

export function CourtForm({
  court,
  complexes,
  defaultComplexId,
}: {
  court?: Court;
  complexes: { id: string; name: string }[];
  defaultComplexId?: string;
}) {
  const bound = saveCourt.bind(null, court?.id ?? null);
  const [state, action] = useActionState<FormResult, FormData>(bound, {});
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-4">
      <Field label="Complejo" error={fe.complex_id}>
        <Select name="complex_id" defaultValue={court?.complex_id ?? defaultComplexId ?? ""} required>
          <option value="" disabled>
            Elegi un complejo
          </option>
          {complexes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Nombre" error={fe.name}>
        <Input name="name" defaultValue={court?.name} placeholder="Cancha 1" required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo" error={fe.surface_type}>
          <Select name="surface_type" defaultValue={court?.surface_type ?? "indoor"}>
            <option value="indoor">Indoor</option>
            <option value="outdoor">Outdoor</option>
          </Select>
        </Field>
        <Field label="Estado" error={fe.status}>
          <Select name="status" defaultValue={court?.status ?? "active"}>
            <option value="active">Activa</option>
            <option value="inactive">Inactiva</option>
          </Select>
        </Field>
      </div>
      <Field label="Observaciones" error={fe.notes}>
        <Textarea name="notes" defaultValue={court?.notes ?? ""} />
      </Field>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton isEdit={Boolean(court)} />
    </form>
  );
}
