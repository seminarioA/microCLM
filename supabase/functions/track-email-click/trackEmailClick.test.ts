import { describe, expect, it } from "vitest";
import { DEFAULT_FALLBACK, resolveRedirectTarget } from "./trackEmailClick";

describe("resolveRedirectTarget", () => {
  it("redirige al destino cuando es una URL http(s) válida", () => {
    expect(resolveRedirectTarget("https://example.com/promo")).toBe("https://example.com/promo");
    expect(resolveRedirectTarget("http://example.com")).toBe("http://example.com");
  });

  it("cae al fallback cuando no hay destino", () => {
    expect(resolveRedirectTarget(null)).toBe(DEFAULT_FALLBACK);
  });

  it("cae al fallback con un destino malformado", () => {
    expect(resolveRedirectTarget("no-es-una-url")).toBe(DEFAULT_FALLBACK);
  });

  it("cae al fallback con esquemas que no son http(s), como javascript:", () => {
    expect(resolveRedirectTarget("javascript:alert(1)")).toBe(DEFAULT_FALLBACK);
    expect(resolveRedirectTarget("data:text/html,hola")).toBe(DEFAULT_FALLBACK);
  });

  it("permite pasar un fallback custom", () => {
    expect(resolveRedirectTarget(null, "https://otro.com")).toBe("https://otro.com");
  });
});
