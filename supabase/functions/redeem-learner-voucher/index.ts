import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value.trim().toUpperCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return response({ error: "Method not allowed." }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return response({ error: "Account activation is not configured." }, 500);

  let payload: { loginId?: string; voucher?: string; password?: string };
  try {
    payload = await request.json();
  } catch {
    return response({ error: "Provide your Login ID, voucher and password." }, 400);
  }

  const loginId = String(payload.loginId || "").trim().toUpperCase();
  const voucher = String(payload.voucher || "").trim().toUpperCase();
  const password = String(payload.password || "");
  if (!/^NAL-[A-F0-9]{10}$/.test(loginId) || !/^NAL-[A-F0-9]{32}$/.test(voucher)) {
    return response({ error: "The Login ID or voucher format is invalid." }, 400);
  }
  if (password.length < 10) return response({ error: "Use a password with at least 10 characters." }, 400);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: voucherData, error: voucherError } = await admin.rpc("redeem_learner_voucher", {
    p_login_id: loginId,
    p_voucher_hash: await sha256(voucher),
  });
  if (voucherError || !voucherData?.id) {
    return response({ error: "The Login ID or voucher is invalid, expired, or already used." }, 400);
  }

  const email = loginId.toLowerCase() + "@learners.nileanalytics.invalid";
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: voucherData.full_name, login_id: loginId },
  });

  if (createError || !created.user) {
    await admin.rpc("release_learner_voucher", { p_voucher_id: voucherData.id });
    return response({ error: createError?.message || "The learner account could not be created." }, 400);
  }

  const { error: profileError } = await admin.from("profiles")
    .update({ full_name: voucherData.full_name, access_enabled: true })
    .eq("id", created.user.id);

  const { error: voucherUpdateError } = await admin.from("learner_vouchers")
    .update({ auth_user_id: created.user.id })
    .eq("id", voucherData.id);

  if (profileError || voucherUpdateError) {
    await admin.auth.admin.deleteUser(created.user.id);
    await admin.rpc("release_learner_voucher", { p_voucher_id: voucherData.id });
    return response({ error: "The account was not activated. Please try again or contact the administrator." }, 500);
  }

  return response({ success: true, loginId, message: "Your learner account is ready. Sign in with your Login ID and password." });
});
