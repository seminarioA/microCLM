import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { FROM_EMAIL, instrumentHtml, validateEmailInput } from "./sendEmail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_URL = "https://api.resend.com/emails";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const functionsBaseUrl = `${supabaseUrl}/functions/v1`;

  try {
    const { leadId, contactId, to, subject, bodyHtml, createdBy } = await req.json();

    const validationError = validateEmailInput({ to, subject, bodyHtml });
    if (validationError) {
      return json({ error: validationError }, 400);
    }

    const { data: emailRow, error: insertError } = await supabase
      .from("emails")
      .insert({
        lead_id: leadId ?? null,
        contact_id: contactId ?? null,
        to_email: to,
        from_email: FROM_EMAIL,
        subject,
        body_html: bodyHtml,
        status: "queued",
        created_by: createdBy ?? null,
      })
      .select("id")
      .single();

    if (insertError || !emailRow) {
      return json({ error: insertError?.message ?? "No se pudo registrar el correo" }, 500);
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      await supabase.from("emails").update({ status: "failed", error: "Falta RESEND_API_KEY" }).eq("id", emailRow.id);
      return json({ error: "Falta configurar RESEND_API_KEY en los secrets del proyecto" }, 500);
    }

    const instrumentedHtml = instrumentHtml(bodyHtml, emailRow.id, functionsBaseUrl);

    const resendResponse = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html: instrumentedHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      await supabase
        .from("emails")
        .update({ status: "failed", error: resendData?.message ?? "Error de Resend" })
        .eq("id", emailRow.id);
      return json({ error: resendData?.message ?? "No se pudo enviar el correo" }, 502);
    }

    await supabase
      .from("emails")
      .update({ status: "sent", provider_message_id: resendData?.id ?? null })
      .eq("id", emailRow.id);

    return json({ success: true, emailId: emailRow.id });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Error desconocido" }, 500);
  }
});
