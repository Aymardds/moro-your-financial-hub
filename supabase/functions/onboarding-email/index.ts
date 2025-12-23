import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  user_id: string;
  email: string;
  name: string;
  role: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, role } = await req.json() as EmailRequest;

    if (role !== "cooperative") {
      return new Response(JSON.stringify({ message: "Only cooperatives receive this email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set");
      return new Response(JSON.stringify({ error: "Email configuration missing" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Email content
    const loginLink = "https://moro-your-financial-hub-1.vercel.app/login";

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #0066cc; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Bienvenue sur MORO</h1>
        </div>
        
        <div style="padding: 40px 30px; color: #1e293b; line-height: 1.6;">
          <h2 style="color: #0f172a; margin-top: 0;">Bonjour ${name},</h2>
          <p style="font-size: 16px;">Nous sommes ravis de vous compter parmi nous ! Votre compte <strong>Coopérative</strong> a été créé avec succès.</p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #0066cc; padding: 20px; margin: 25px 0;">
            <p style="margin: 0; font-weight: 600; color: #0066cc;">Action Requise : Identification de votre organisation</p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #64748b;">
              Pour respecter les normes réglementaires et activer votre accès aux services financiers, vous devez compléter votre formulaire d'identification numérique.
            </p>
          </div>

          <p style="font-size: 15px;">Le formulaire se compose de <strong>2 étapes simples</strong> :</p>
          
          <table style="width: 100%; margin-bottom: 25px;">
            <tr>
              <td style="padding: 10px 0;">
                <span style="background-color: #0066cc; color: white; width: 24px; height: 24px; display: inline-block; text-align: center; border-radius: 50%; margin-right: 10px; font-size: 14px; line-height: 24px;">1</span>
                <strong>Identification du demandeur</strong> (Votre identité et fonction)
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0;">
                <span style="background-color: #0066cc; color: white; width: 24px; height: 24px; display: inline-block; text-align: center; border-radius: 50%; margin-right: 10px; font-size: 14px; line-height: 24px;">2</span>
                <strong>Informations sur la coopérative</strong> (Détails officiels et activité)
              </td>
            </tr>
          </table>

          <div style="text-align: center; margin: 40px 0;">
            <a href="${loginLink}" style="background-color: #0066cc; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              Ouvrir le Formulaire d'Identification
            </a>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 15px;">(Vous devrez vous connecter pour accéder au formulaire sécurisé)</p>
          </div>

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 40px 0;">
          
          <p style="font-size: 14px; color: #64748b;">
            <strong>Pourquoi un lien ?</strong> Pour des raisons de sécurité et pour vous permettre de joindre des documents officiels, le formulaire doit être rempli sur notre plateforme sécurisée.
          </p>
          
          <p style="margin-top: 30px;">À très bientôt,<br><strong>L'équipe MORO Support</strong></p>
        </div>
        
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
          <p>&copy; 2023 MORO Financial Hub. Tous droits réservés.</p>
        </div>
      </div>
    `;

    const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL") || "onboarding@updates.moro.com";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `MORO <${SENDER_EMAIL}>`,
        to: [email],
        subject: "Action Requise : Complétez votre identification MORO",
        html: html,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
