import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/database.types";

config({ path: ".env.local" });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) throw new Error("Set Supabase environment variables before seeding.");

const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const users = [
  { email: "admin@tatua.demo", password: "TatuaDemo123!", full_name: "Tatua Administrator", role: "admin" as const },
  { email: "citizen@tatua.demo", password: "TatuaDemo123!", full_name: "Demo Citizen", role: "citizen" as const },
];
const demoImage = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

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
  const daysAgo = (days: number) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - days);
    return date.toISOString();
  };
  const samples: Database["public"]["Tables"]["requests"]["Insert"][] = [
    { citizen_id: demoCitizen, category: "streetlight", location: "Ngong Road near Adams Arcade", description: "The streetlight has been out for several nights, making the crossing unsafe.", status: "pending", image_path: "demo-citizen/streetlight.png", created_at: daysAgo(2), updated_at: daysAgo(2) },
    { citizen_id: demoCitizen, category: "garbage", location: "Kileleshwa community centre", description: "Garbage collection has been missed twice this week and bins are overflowing.", status: "in_progress", image_path: null, created_at: daysAgo(4), updated_at: daysAgo(1) },
    { citizen_id: demoCitizen, category: "water", location: "Lavington Crescent", description: "A leaking water pipe is pooling across the pedestrian path.", status: "resolved", image_path: "demo-citizen/water.png", created_at: daysAgo(6), updated_at: daysAgo(3) },
    { citizen_id: demoCitizen, category: "roads", location: "Kilimani Ring Road", description: "A deep pothole has formed beside the school entrance and needs urgent repair.", status: "pending", image_path: null, created_at: daysAgo(8), updated_at: daysAgo(8) },
    { citizen_id: demoCitizen, category: "sewage", location: "South B estate lane 4", description: "A blocked drain is causing wastewater to collect along the footpath.", status: "resolved", image_path: "demo-citizen/sewage.png", created_at: daysAgo(11), updated_at: daysAgo(7) },
    { citizen_id: demoCitizen, category: "other", location: "Westlands market entrance", description: "The public notice board is damaged and important community notices cannot be displayed.", status: "in_progress", image_path: null, created_at: daysAgo(13), updated_at: daysAgo(5) },
  ];
  for (const sample of samples) {
    const { data: existing, error: lookupError } = await supabase
      .from("requests")
      .select("id")
      .eq("citizen_id", demoCitizen)
      .eq("description", sample.description)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (sample.image_path) {
      const { error: imageError } = await supabase.storage
        .from("request-images")
        .upload(sample.image_path, demoImage, { contentType: "image/png", upsert: true });
      if (imageError) throw imageError;
    }
    const values = sample;
    const result = existing
      ? await supabase.from("requests").update(values).eq("id", existing.id)
      : await supabase.from("requests").insert(values);
    if (result.error) throw result.error;
  }
  console.log("Tatua demo users and sample requests are ready.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
