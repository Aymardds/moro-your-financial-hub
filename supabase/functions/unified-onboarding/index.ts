import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-auth",
};

interface UnifiedOnboardingRequest {
  email: string;
  name: string;
  role: string;
}

serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL") || "onboarding@updates.moro.com";

    // Validate Environment
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set in Supabase Secrets");
    if (!SUPABASE_URL) throw new Error("SUPABASE_URL is missing");
    if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");

    const body = await req.json().catch(() => null);
    if (!body) throw new Error("Invalid JSON body");

    const { email, name, role } = body as UnifiedOnboardingRequest;
    if (!email) throw new Error("Email is required");

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`[Onboarding] Processing: ${email} (${role})`);

    // 2. Check for existing user
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error("Auth Error (ListUsers):", listError);
      throw new Error(`Auth Admin Error: ${listError.message}`);
    }

    const existingUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    const linkType = existingUser ? 'magiclink' : 'signup';

    console.log(`[Onboarding] User exists: ${!!existingUser}. Link mode: ${linkType}`);

    // 3. Generate Link
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: linkType,
      email,
      options: {
        data: { name, role },
        redirectTo: "https://moro-your-financial-hub-1.vercel.app/dashboard",
      }
    });

    if (linkError) {
      console.error("Auth Error (GenerateLink):", linkError);
      throw new Error(`GenerateLink failed: ${linkError.message}`);
    }

    const magicLink = data.properties.action_link;
    console.log("[Onboarding] Link generated");

    // 4. Build HTML
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #0066cc; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Bienvenue sur MORO</h1>
        </div>
        <div style="padding: 40px 30px; color: #1e293b; line-height: 1.6;">
          <h2 style="color: #0f172a; margin-top: 0;">Bonjour ${name},</h2>
          <p style="font-size: 16px;">Votre compte <strong>${role === 'cooperative' ? 'Coopérative' : role}</strong> est prêt. Accédez à votre espace sécurisé en un clic :</p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${magicLink}" style="background-color: #0066cc; color: #ffffff; padding: 18px 36px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Activer mon Compte
            </a>
          </div>
          ${role === 'cooperative' ? `
          <div style="background-color: #f8fafc; border-left: 4px solid #0066cc; padding: 20px; margin: 25px 0;">
            <p style="margin: 0; font-weight: 600; color: #0066cc;">Action : Identification requise</p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #64748b;">
              Une fois connecté, complétez votre identification en 2 étapes rapides.
            </p>
          </div>
          ` : ''}
          <p style="font-size: 14px; color: #64748b; margin-top: 30px;">Ce lien est à usage unique et expire dans 24h.</p>
          <p>À très bientôt,<br><strong>L'équipe MORO Support</strong></p>
        </div>
      </div>
    `;

    // 5. Send Email
    console.log(`[Onboarding] Sending via Resend from ${SENDER_EMAIL}...`);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `MORO <${SENDER_EMAIL}>`,
        to: [email],
        subject: "Bienvenue sur MORO - Activez votre compte",
        html: html,
      }),
    });

    const resData = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("Resend API Error:", resData);
      throw new Error(`Resend Error: ${JSON.stringify(resData)}`);
    }

    console.log("[Onboarding] Success");

    return new Response(JSON.stringify({ success: true, resendId: resData.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[Onboarding] Fatal Error:", error.message);
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
