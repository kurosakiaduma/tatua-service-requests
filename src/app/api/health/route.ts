import { connection, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  await connection();
  const { error } = await createAdminClient()
    .from("healthcheck")
    .select("id")
    .limit(1);

  if (error) {
    return NextResponse.json(
      { ok: false, error: "Database health check failed." },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
