import { describe, expect, it } from "vitest";
import type { MatchDetails } from "@/lib/supabase/database.types";
import { isFull, resolveActionState, spotsLeft } from "./match";

function match(overrides: Partial<MatchDetails> = {}): MatchDetails {
  return {
    id: "m1",
    complex_id: "c1",
    court_id: "ct1",
    starts_at: new Date(Date.now() + 3600_000).toISOString(),
    duration_minutes: 90,
    max_players: 4,
    category: null,
    comments: null,
    status: "open",
    created_by: null,
    created_at: "",
    updated_at: "",
    complex_name: "Club Norte",
    complex_address: "Calle 1",
    complex_city: "BA",
    complex_province: "BA",
    court_name: "Cancha 3",
    court_surface_type: "outdoor",
    confirmed_count: 2,
    waitlist_count: 0,
    spots_left: 2,
    ...overrides,
  };
}

describe("match domain", () => {
  it("computes spots left and fullness", () => {
    expect(spotsLeft(match({ confirmed_count: 3 }))).toBe(1);
    expect(isFull(match({ confirmed_count: 4 }))).toBe(true);
    expect(spotsLeft(match({ confirmed_count: 6 }))).toBe(0);
  });

  it("offers join when there is room", () => {
    const s = resolveActionState(match({ confirmed_count: 2 }), "none", true);
    expect(s.canJoin).toBe(true);
    expect(s.label).toBe("Quiero jugar");
  });

  it("offers waitlist when full and enabled", () => {
    const s = resolveActionState(match({ confirmed_count: 4, status: "full" }), "none", true);
    expect(s.canJoin).toBe(false);
    expect(s.canJoinWaitlist).toBe(true);
  });

  it("blocks waitlist when disabled", () => {
    const s = resolveActionState(match({ confirmed_count: 4, status: "full" }), "none", false);
    expect(s.canJoinWaitlist).toBe(false);
    expect(s.label).toBe("Partido completo");
  });

  it("lets a confirmed player leave", () => {
    const s = resolveActionState(match(), "confirmed", true);
    expect(s.canLeave).toBe(true);
    expect(s.canJoin).toBe(false);
  });

  it("blocks joining a past match", () => {
    const s = resolveActionState(
      match({ starts_at: new Date(Date.now() - 3600_000).toISOString() }),
      "none",
      true,
    );
    expect(s.canJoin).toBe(false);
  });
});
