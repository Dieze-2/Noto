import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRODUCT_TO_PLAN: Record<string, string> = {
  prod_U6yqqbURHzg97L: "classic",
  prod_U6z7kGgni4DyDT: "pro",
  prod_U6z7wSSDyqdiL6: "club",
};

function unsubscribedResponse() {
  return new Response(JSON.stringify({ subscribed: false }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return unsubscribedResponse();
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token || token === supabaseAnonKey) {
      return unsubscribedResponse();
    }

    // Validate JWT safely (handles expired/anon tokens without crashing)
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });

    let claimsData: any;
    try {
      const result = await authClient.auth.getClaims(token);
      if (result.error || !result.data?.claims?.sub) {
        return unsubscribedResponse();
      }
      claimsData = result.data;
    } catch (_) {
      return unsubscribedResponse();
    }

    const userId = claimsData.claims.sub;
    let userEmail = typeof claimsData.claims.email === "string"
      ? claimsData.claims.email
      : null;

    // Fallback if email is not present in claims
    if (!userEmail) {
      const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { persistSession: false },
      });
      const { data: adminUserData, error: adminUserError } = await adminClient.auth.admin.getUserById(userId);
      if (adminUserError || !adminUserData?.user?.email) {
        return unsubscribedResponse();
      }
      userEmail = adminUserData.user.email;
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    if (customers.data.length === 0) {
      return unsubscribedResponse();
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
    });

    const sub = subscriptions.data.find((s) =>
      s.status === "active" || s.status === "trialing"
    );

    if (!sub) {
      return unsubscribedResponse();
    }

    const productId = sub.items.data[0].price.product as string;
    const plan = PRODUCT_TO_PLAN[productId] ?? null;

    let subscriptionEnd: string | null = null;
    try {
      if (sub.current_period_end) {
        subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
      }
    } catch (_) {
      // ignore date conversion errors
    }

    return new Response(
      JSON.stringify({
        subscribed: true,
        plan,
        product_id: productId,
        subscription_end: subscriptionEnd,
        quantity: sub.items.data[0]?.quantity ?? 1,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
