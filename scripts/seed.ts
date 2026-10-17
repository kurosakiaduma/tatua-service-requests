import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) throw new Error("Set Supabase environment variables before seeding.");

const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const users = [
  { email: "admin@tatua.demo", password: "TatuaDemo123!", full_name: "Tatua Administrator", role: "admin" as const },
  { email: "citizen@tatua.demo", password: "TatuaDemo123!", full_name: "Demo Citizen", role: "citizen" as const },
];

async function main() {
  const ids: Record<string, string> = {};
  for (const user of users) {
    const existing = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const found = existing.data.users.find((candidate) => candidate.email === user.email);
    const created = found
      ? { data: { user: found }, error: null }
      : await supabase.auth.admin.createUser({ email: user.email, password: user.password, email_confirm: true, user_metadata: { full_name: user.full_name } });
    if (created.error || !created.data.user) throw created.error ?? new Error(`Could not create ${user.email}`);
    ids[user.email] = created.data.user.id;
    const { error } = await supabase.from("profiles").upsert({ id: created.data.user.id, full_name: user.full_name, role: user.role });
    if (error) throw error;
  }

  const demoCitizen = ids["citizen@tatua.demo"];
  const { count } = await supabase.from("requests").select("id", { count: "exact", head: true }).eq("citizen_id", demoCitizen);
  if (!count) {
    const { error } = await supabase.from("requests").insert([
      { citizen_id: demoCitizen, category: "streetlight", location: "Ngong Road near Adams Arcade", description: "The streetlight has been out for several nights, making the crossing unsafe.", status: "pending" },
      { citizen_id: demoCitizen, category: "garbage", location: "Kileleshwa community centre", description: "Garbage collection has been missed twice this week and bins are overflowing.", status: "in_progress" },
      { citizen_id: demoCitizen, category: "water", location: "Lavington Crescent", description: "A leaking water pipe is pooling across the pedestrian path.", status: "resolved" },
    ]);
    if (error) throw error;
  }
  console.log("Tatua demo users and sample requests are ready.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
