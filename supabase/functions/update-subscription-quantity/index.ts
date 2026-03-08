import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw userError;
    const user = userData.user;
    if (!user?.email) throw new Error("Not authenticated");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Get current athlete count from DB
    const { count, error: countError } = await supabaseClient
      .from("coach_athletes")
      .select("*", { count: "exact", head: true })
      .eq("coach_id", user.id)
      .in("status", ["accepted", "pending"]);

    if (countError) throw countError;
    const athleteCount = Math.max(count ?? 1, 1); // minimum 1

    // Find Stripe customer and active subscription
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      console.log("[UPDATE-QUANTITY] No Stripe customer found, skipping");
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "no_customer" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      console.log("[UPDATE-QUANTITY] No active subscription, skipping");
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "no_subscription" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const sub = subscriptions.data[0];
    const itemId = sub.items.data[0].id;

    // Update quantity to match athlete count
    await stripe.subscriptionItems.update(itemId, {
      quantity: athleteCount,
      proration_behavior: "create_prorations",
    });

    console.log(`[UPDATE-QUANTITY] Updated subscription ${sub.id} quantity to ${athleteCount}`);

    return new Response(
      JSON.stringify({ success: true, quantity: athleteCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[UPDATE-QUANTITY] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
