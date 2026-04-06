import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const INVITE_EXPIRY_DAYS = 7;

const generateToken = () => randomBytes(24).toString("hex");

const getBaseUrl = () => {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
};

export const POST = async (request: NextRequest) => {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Ikke autentisert" },
        { status: 401 },
      );
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Kun administratorer kan sende invitasjoner" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const email = (body.email ?? "").trim().toLowerCase();
    const role = body.role === "admin" ? "admin" : "member";
    const title = (body.title ?? "").trim() || null;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Ugyldig e-postadresse" },
        { status: 400 },
      );
    }

    const admin = createSupabaseAdminClient();

    const { data: existing } = await admin
      .from("invites")
      .select("id")
      .eq("email", email)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "En aktiv invitasjon finnes allerede for denne e-posten" },
        { status: 409 },
      );
    }

    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

    const { data: invite, error: insertError } = await admin
      .from("invites")
      .insert({
        email,
        role,
        title,
        created_by: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select("id, email, role, title, expires_at")
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 },
      );
    }

    const inviteUrl = `${getBaseUrl()}/auth/invite/${token}`;

    // eslint-disable-next-line no-console
    console.log(`[invite] ${email} → ${inviteUrl} (expires ${expiresAt.toISOString()})`);

    return NextResponse.json({ invite, inviteUrl }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Intern feil" },
      { status: 500 },
    );
  }
};
