import { describe, expect, it } from "vitest";
import { instrumentHtml, validateEmailInput } from "./sendEmail";

describe("validateEmailInput", () => {
  it("exige to, subject y bodyHtml", () => {
    expect(validateEmailInput({ to: "", subject: "Hola", bodyHtml: "<p>hi</p>" })).toMatch(/obligatorios/);
    expect(validateEmailInput({ to: "a@b.com", subject: "", bodyHtml: "<p>hi</p>" })).toMatch(/obligatorios/);
    expect(validateEmailInput({ to: "a@b.com", subject: "Hola", bodyHtml: "" })).toMatch(/obligatorios/);
  });

  it("rechaza un `to` que no sea string", () => {
    expect(validateEmailInput({ to: 123, subject: "Hola", bodyHtml: "<p>hi</p>" })).toMatch(/obligatorios/);
  });

  it("pasa cuando los tres campos vienen completos", () => {
    expect(validateEmailInput({ to: "a@b.com", subject: "Hola", bodyHtml: "<p>hi</p>" })).toBeNull();
  });
});

describe("instrumentHtml", () => {
  const BASE_URL = "https://project.supabase.co/functions/v1";
  const EMAIL_ID = "email-123";

  it("agrega el pixel de apertura al final del HTML", () => {
    const result = instrumentHtml("<p>Hola</p>", EMAIL_ID, BASE_URL);
    expect(result).toContain(
      `<img src="${BASE_URL}/track-email-open?id=${EMAIL_ID}" width="1" height="1" alt="" style="display:none" />`,
    );
    expect(result.endsWith("/>")).toBe(true);
  });

  it("reescribe un link para pasar por el tracker de clics", () => {
    const result = instrumentHtml('<a href="https://example.com">Visítanos</a>', EMAIL_ID, BASE_URL);
    expect(result).toContain(
      `href="${BASE_URL}/track-email-click?id=${EMAIL_ID}&url=${encodeURIComponent("https://example.com")}"`,
    );
  });

  it("conserva atributos antes y después del href", () => {
    const result = instrumentHtml('<a class="btn" href="https://example.com" target="_blank">Ir</a>', EMAIL_ID, BASE_URL);
    expect(result).toContain('class="btn"');
    expect(result).toContain('target="_blank"');
  });

  it("reescribe múltiples links de forma independiente", () => {
    const html = '<a href="https://a.com">A</a> y <a href="https://b.com">B</a>';
    const result = instrumentHtml(html, EMAIL_ID, BASE_URL);
    expect(result).toContain(encodeURIComponent("https://a.com"));
    expect(result).toContain(encodeURIComponent("https://b.com"));
  });

  it("no falla con HTML sin links", () => {
    const result = instrumentHtml("<p>Sin links aquí</p>", EMAIL_ID, BASE_URL);
    expect(result).toContain("Sin links aquí");
    expect(result).toContain("track-email-open");
  });
});
