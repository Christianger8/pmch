"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveComplex } from "@/features/admin/actions";
import type { FormResult } from "@/features/admin/types";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import type { Complex } from "@/lib/supabase/database.types";

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear complejo"}
    </Button>
  );
}

export function ComplexForm({ complex }: { complex?: Complex }) {
  const bound = saveComplex.bind(null, complex?.id ?? null);
  const [state, action] = useActionState<FormResult, FormData>(bound, {});
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-4">
      <Field label="Nombre" error={fe.name}>
        <Input name="name" defaultValue={complex?.name} required autoFocus />
      </Field>
      <Field label="Direccion" error={fe.address}>
        <Input name="address" defaultValue={complex?.address ?? ""} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ciudad" error={fe.city}>
          <Input name="city" defaultValue={complex?.city ?? ""} />
        </Field>
        <Field label="Provincia" error={fe.province}>
          <Input name="province" defaultValue={complex?.province ?? ""} />
        </Field>
      </div>
      <Field label="Estado" error={fe.status}>
        <Select name="status" defaultValue={complex?.status ?? "active"}>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </Select>
      </Field>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton isEdit={Boolean(complex)} />
    </form>
  );
}
