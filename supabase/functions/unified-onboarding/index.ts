import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UnifiedOnboardingRequest {
    email: string;
    name: string;
    role: string;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { email, name, role } = await req.json() as UnifiedOnboardingRequest;

        if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error("Missing configuration");
        }

        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 1. Gérer la création du lien (Magic Link) via l'Admin API
        // On utilise 'signup' si l'utilisateur n'existe pas encore, ou 'login' s'il existe.
        // On peut simplement utiliser 'signup' car il gère aussi le login si l'email existe.
        const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'signup',
            email,
            options: {
                data: { name, role },
                redirectTo: "https://moro-your-financial-hub-1.vercel.app/dashboard",
            }
        });

        if (linkError) throw linkError;

        const magicLink = data.properties.action_link;

        // 2. Construire l'Email Premium
        const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #0066cc; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Bienvenue sur MORO</h1>
        </div>
        
        <div style="padding: 40px 30px; color: #1e293b; line-height: 1.6;">
          <h2 style="color: #0f172a; margin-top: 0;">Bonjour ${name},</h2>
          <p style="font-size: 16px;">Votre compte <strong>${role === 'cooperative' ? 'Coopérative' : role}</strong> a été créé. Cliquez sur le bouton ci-dessous pour accéder directement à votre espace sécurisé.</p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${magicLink}" style="background-color: #0066cc; color: #ffffff; padding: 18px 36px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              Activer mon Compte & Se Connecter
            </a>
          </div>

          ${role === 'cooperative' ? `
          <div style="background-color: #f8fafc; border-left: 4px solid #0066cc; padding: 20px; margin: 25px 0;">
            <p style="margin: 0; font-weight: 600; color: #0066cc;">Action : Identification obligatoire</p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #64748b;">
              Une fois connecté, vous devrez compléter votre identification en 2 étapes rapides (Demandeur & Coopérative).
            </p>
          </div>
          ` : ''}

          <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
            Ce lien est sécurisé et à usage unique. Il expirera dans 24 heures.
          </p>
          
          <p style="margin-top: 30px;">À très bientôt,<br><strong>L'équipe MORO Support</strong></p>
        </div>
        
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
          <p>&copy; 2023 MORO Financial Hub. Tous droits réservés.</p>
        </div>
      </div>
    `;

        const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL") || "onboarding@updates.moro.com";

        // 3. Envoyer via Resend
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

        const resData = await res.json();
        return new Response(JSON.stringify(resData), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
