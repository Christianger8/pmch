export interface MatchActionResult {
  ok: boolean;
  status?: "confirmed" | "waitlist";
  error?: string;
}
