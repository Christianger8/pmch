"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveMatch, type FormResult } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { utcISOToLocalArg } from "@/lib/time";
import type { Match } from "@/lib/supabase/database.types";

interface CourtOption {
  id: string;
  name: string;
  complex_id: string;
  status: "active" | "inactive";
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear partido"}
    </Button>
  );
}

export function MatchForm({
  match,
  complexes,
  courts,
}: {
  match?: Match;
  complexes: { id: string; name: string }[];
  courts: CourtOption[];
}) {
  const bound = saveMatch.bind(null, match?.id ?? null);
  const [state, action] = useActionState<FormResult, FormData>(bound, {});
  const fe = state.fieldErrors ?? {};

  const [complexId, setComplexId] = useState(match?.complex_id ?? complexes[0]?.id ?? "");
  const courtsForComplex = useMemo(
    () => courts.filter((c) => c.complex_id === complexId && (c.status === "active" || c.id === match?.court_id)),
    [courts, complexId, match?.court_id],
  );

  return (
    <form action={action} className="space-y-4">
      <Field label="Complejo" error={fe.complex_id}>
        <Select
          name="complex_id"
          value={complexId}
          onChange={(e) => setComplexId(e.target.value)}
          required
        >
          {complexes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Cancha" error={fe.court_id}>
        <Select name="court_id" defaultValue={match?.court_id ?? ""} required key={complexId}>
          <option value="" disabled>
            {courtsForComplex.length ? "Elegi una cancha" : "Este complejo no tiene canchas activas"}
          </option>
          {courtsForComplex.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Fecha y hora" error={fe.starts_at_local} hint="Hora de Argentina">
        <Input
          name="starts_at_local"
          type="datetime-local"
          defaultValue={match ? utcISOToLocalArg(match.starts_at) : ""}
          required
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Duracion (min)" error={fe.duration_minutes}>
          <Input
            name="duration_minutes"
            type="number"
            min={30}
            max={300}
            step={15}
            defaultValue={match?.duration_minutes ?? 90}
          />
        </Field>
        <Field label="Jugadores" error={fe.max_players}>
          <Input
            name="max_players"
            type="number"
            min={2}
            max={8}
            defaultValue={match?.max_players ?? 4}
          />
        </Field>
      </div>

      <Field label="Categoria (opcional)" error={fe.category}>
        <Input name="category" defaultValue={match?.category ?? ""} placeholder="4ta, 6ta…" />
      </Field>

      <Field label="Comentarios" error={fe.comments}>
        <Textarea name="comments" defaultValue={match?.comments ?? ""} />
      </Field>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton isEdit={Boolean(match)} />
    </form>
  );
}
