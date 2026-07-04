import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { shouldMarkOpened } from "./trackEmailOpen.ts";

// GIF transparente de 1x1, la imagen más chica válida para un pixel de tracking.
const PIXEL_GIF = Uint8Array.from(
  atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7"),
  (c) => c.charCodeAt(0),
);

function pixelResponse(): Response {
  return new Response(PIXEL_GIF, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

Deno.serve(async (req: Request) => {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return pixelResponse();

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: existing } = await supabase.from("emails").select("opened_at").eq("id", id).maybeSingle();
    if (shouldMarkOpened(existing)) {
      await supabase.from("emails").update({ opened_at: new Date().toISOString() }).eq("id", id);
    }
  } catch {
    // El pixel siempre debe devolverse, incluso si el tracking falla.
  }

  return pixelResponse();
});
