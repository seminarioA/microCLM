import { describe, expect, it } from "vitest";
import { escapeHtml } from "./EmailComposeModal";

describe("escapeHtml", () => {
  it("escapa &, < y > para evitar inyección de HTML en el cuerpo del correo", () => {
    expect(escapeHtml("<script>alert(1)</script>")).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("escapa & antes que las otras entidades, sin doble-escapar", () => {
    expect(escapeHtml("Tom & Jerry <3")).toBe("Tom &amp; Jerry &lt;3");
  });

  it("no altera texto plano sin caracteres especiales", () => {
    expect(escapeHtml("Hola, ¿cómo estás?")).toBe("Hola, ¿cómo estás?");
  });
});
