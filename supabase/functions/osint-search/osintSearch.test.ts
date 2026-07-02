import { describe, expect, it } from "vitest";
import { buildOsintProfile, buildSearchQuery, parseDuckDuckGoHtml } from "./osintSearch";

// Fixture recortada de una página real de resultados de
// https://html.duckduckgo.com/html/?q=... (sin JavaScript, HTML estable
// desde hace años). Se usa en tests para no depender de la red en CI.
const DDG_FIXTURE_HTML = `
<div class="results">
  <div class="result results_links results_links_deep web-result">
    <div class="links_main links_deep result__body">
      <h2 class="result__title">
        <a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.linkedin.com%2Fin%2Fdiegosilva&amp;rut=abc">
          Diego Silva - MegaCorp | LinkedIn
        </a>
      </h2>
      <a class="result__snippet" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.linkedin.com%2Fin%2Fdiegosilva&amp;rut=abc">
        View Diego Silva's profile on LinkedIn, the world's largest professional community.
      </a>
    </div>
  </div>
  <div class="result results_links results_links_deep web-result">
    <div class="links_main links_deep result__body">
      <h2 class="result__title">
        <a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.megacorp.pe%2F&amp;rut=def">
          MegaCorp Per&uacute; - Sitio oficial
        </a>
      </h2>
      <a class="result__snippet" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.megacorp.pe%2F&amp;rut=def">
        Bienvenido al sitio oficial de MegaCorp Per&uacute;.
      </a>
    </div>
  </div>
  <div class="result results_links results_links_deep web-result">
    <div class="links_main links_deep result__body">
      <h2 class="result__title">
        <a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.gestion.pe%2Fnoticia%2Fmegacorp&amp;rut=ghi">
          MegaCorp anuncia expansi&oacute;n regional - Gesti&oacute;n
        </a>
      </h2>
      <a class="result__snippet" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.gestion.pe%2Fnoticia%2Fmegacorp&amp;rut=ghi">
        La empresa MegaCorp anunci&oacute; ayer su plan de expansi&oacute;n regional.
      </a>
    </div>
  </div>
</div>
`;

describe("buildSearchQuery", () => {
  it("combina nombre y empresa", () => {
    expect(buildSearchQuery("Diego Silva", "MegaCorp")).toBe("Diego Silva MegaCorp");
  });

  it("omite la empresa cuando viene vacía", () => {
    expect(buildSearchQuery("Diego Silva", "  ")).toBe("Diego Silva");
  });

  it("recorta espacios en ambos campos", () => {
    expect(buildSearchQuery("  Diego Silva  ", "  MegaCorp  ")).toBe("Diego Silva MegaCorp");
  });
});

describe("parseDuckDuckGoHtml", () => {
  it("extrae título, URL real y snippet de cada resultado", () => {
    const results = parseDuckDuckGoHtml(DDG_FIXTURE_HTML);

    expect(results).toHaveLength(3);
    expect(results[0]).toEqual({
      title: "Diego Silva - MegaCorp | LinkedIn",
      url: "https://www.linkedin.com/in/diegosilva",
      snippet: "View Diego Silva's profile on LinkedIn, the world's largest professional community.",
    });
    expect(results[1].url).toBe("https://www.megacorp.pe/");
    expect(results[2].url).toBe("https://www.gestion.pe/noticia/megacorp");
  });

  it("decodifica entidades HTML en el título y el snippet", () => {
    const results = parseDuckDuckGoHtml(DDG_FIXTURE_HTML);
    expect(results[1].title).toContain("Perú");
    expect(results[2].title).toContain("expansión");
  });

  it("devuelve un arreglo vacío si no hay resultados en el HTML", () => {
    expect(parseDuckDuckGoHtml("<html><body>Sin resultados</body></html>")).toEqual([]);
  });

  it("no revienta con HTML vacío o malformado", () => {
    expect(parseDuckDuckGoHtml("")).toEqual([]);
    expect(parseDuckDuckGoHtml("<div class=\"result__a\"")).toEqual([]);
  });
});

describe("buildOsintProfile", () => {
  it("detecta LinkedIn con confianza alta cuando aparece en los resultados", () => {
    const results = parseDuckDuckGoHtml(DDG_FIXTURE_HTML);
    const profile = buildOsintProfile("Diego Silva", "MegaCorp", results);

    const linkedin = profile.digitalFootprint.find((s) => s.label === "LinkedIn");
    expect(linkedin?.confidence).toBe("Alta");
    expect(linkedin?.value).toBe("https://www.linkedin.com/in/diegosilva");
  });

  it("detecta el sitio corporativo por coincidencia de dominio con el nombre de la empresa", () => {
    const results = parseDuckDuckGoHtml(DDG_FIXTURE_HTML);
    const profile = buildOsintProfile("Diego Silva", "MegaCorp", results);

    const site = profile.digitalFootprint.find((s) => s.label === "Sitio corporativo");
    expect(site?.value).toBe("https://www.megacorp.pe/");
    expect(site?.confidence).toBe("Media");
  });

  it("estima el patrón de correo a partir del dominio corporativo detectado", () => {
    const results = parseDuckDuckGoHtml(DDG_FIXTURE_HTML);
    const profile = buildOsintProfile("Diego Silva", "MegaCorp", results);

    const emailSignal = profile.contact.find((s) => s.label === "Patrón de correo estimado");
    expect(emailSignal?.value).toBe("diego@megacorp.pe");
  });

  it("incluye como mención el resultado que no es LinkedIn ni el sitio corporativo", () => {
    const results = parseDuckDuckGoHtml(DDG_FIXTURE_HTML);
    const profile = buildOsintProfile("Diego Silva", "MegaCorp", results);

    expect(profile.mentions).toHaveLength(1);
    expect(profile.mentions[0].url).toBe("https://www.gestion.pe/noticia/megacorp");
    expect(profile.mentions[0].source).toBe("gestion.pe");
  });

  it("marca todo como no encontrado / confianza baja cuando no hay resultados", () => {
    const profile = buildOsintProfile("Nadie Conocido", "EmpresaInexistente", []);

    expect(profile.resultCount).toBe(0);
    expect(profile.mentions).toHaveLength(0);
    profile.digitalFootprint.forEach((signal) => {
      expect(signal.confidence).toBe("Baja");
      expect(signal.value).toBe("No encontrado en la búsqueda");
    });
    expect(profile.contact[0].confidence).toBe("Baja");
  });
});
