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
        const loginLink = "https://moro-your-financial-hub-1.vercel.app/login"; // Replace with real URL in production

        const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #0066cc;">Bienvenue sur MORO, ${name} !</h2>
        <p>Merci de vous être inscrit en tant que <strong>Coopérative</strong>.</p>
        <p>Pour activer pleinement votre compte et accéder à toutes nos fonctionnalités (gestion de membres, prêts, etc.), vous devez compléter votre formulaire d'identification.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${loginLink}" style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Compléter mon Identification
          </a>
        </div>
        <p>Ce formulaire se compose de 3 étapes simples :</p>
        <ol>
          <li>Informations Générales</li>
          <li>Informations sur les Adhérents</li>
          <li>Composition du Bureau / Management</li>
        </ol>
        <p>À bientôt,<br>L'équipe MORO</p>
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
