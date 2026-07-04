import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { resolveRedirectTarget } from "./trackEmailClick.ts";

Deno.serve(async (req: Request) => {
  const params = new URL(req.url).searchParams;
  const id = params.get("id");
  const target = params.get("url");

  if (id) {
    try {
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: existing } = await supabase.from("emails").select("clicked_at").eq("id", id).maybeSingle();
      if (existing && !existing.clicked_at) {
        await supabase.from("emails").update({ clicked_at: new Date().toISOString() }).eq("id", id);
      }
    } catch {
      // El redirect debe ocurrir igual, aunque falle el registro del clic.
    }
  }

  return Response.redirect(resolveRedirectTarget(target), 302);
});
