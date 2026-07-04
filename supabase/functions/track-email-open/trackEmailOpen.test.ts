import { describe, expect, it } from "vitest";
import { shouldMarkOpened } from "./trackEmailOpen";

describe("shouldMarkOpened", () => {
  it("marca abierto cuando el correo existe y no tenía opened_at", () => {
    expect(shouldMarkOpened({ opened_at: null })).toBe(true);
  });

  it("no vuelve a marcar si ya tenía opened_at (aperturas repetidas)", () => {
    expect(shouldMarkOpened({ opened_at: "2026-01-01T00:00:00.000Z" })).toBe(false);
  });

  it("no marca si el correo no existe", () => {
    expect(shouldMarkOpened(null)).toBe(false);
  });
});
