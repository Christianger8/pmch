import { z } from "zod";

const uuid = z.string().uuid();

export const phoneSchema = z
  .string()
  .trim()
  .min(6, "Ingresa un numero valido")
  .max(20);

export const otpSchema = z.string().trim().regex(/^\d{4,8}$/, "El codigo tiene entre 4 y 8 digitos");

/** Ingreso alternativo por email (solo administradores, sin proveedor de SMS/WhatsApp). */
export const emailSchema = z.string().trim().toLowerCase().email("Ingresa un email valido");

/** Canal por el que se envia el codigo de verificacion. */
export const otpChannelSchema = z.enum(["whatsapp", "sms"]);
export type OtpChannel = z.infer<typeof otpChannelSchema>;

export const onboardingSchema = z.object({
  full_name: z.string().trim().min(2, "Ingresa tu nombre").max(80),
});

export const complexSchema = z.object({
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  province: z.string().trim().max(80).optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).default("active"),
});
export type ComplexInput = z.infer<typeof complexSchema>;

export const courtSchema = z.object({
  complex_id: uuid,
  name: z.string().trim().min(1).max(80),
  surface_type: z.enum(["indoor", "outdoor"]).default("indoor"),
  status: z.enum(["active", "inactive"]).default("active"),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
});
export type CourtInput = z.infer<typeof courtSchema>;

export const matchSchema = z.object({
  complex_id: uuid,
  court_id: uuid,
  // datetime-local sin zona: se interpreta como hora de Argentina en el server action
  starts_at_local: z.string().min(10, "Elegi fecha y hora"),
  duration_minutes: z.coerce.number().int().min(30).max(300).default(90),
  max_players: z.coerce.number().int().min(2).max(8).default(4),
  category: z.string().trim().max(40).optional().or(z.literal("")),
  comments: z.string().trim().max(500).optional().or(z.literal("")),
});
export type MatchInput = z.infer<typeof matchSchema>;

export const matchIdSchema = z.object({ match_id: uuid });
export const removePlayerSchema = z.object({ match_id: uuid, user_id: uuid });
