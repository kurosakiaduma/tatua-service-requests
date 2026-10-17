"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requestSchema, signUpSchema, statusUpdateSchema } from "@/lib/validations";
import { canTransition } from "@/lib/status-rules";

export async function signUp(formData: FormData) {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/register?error=Please%20check%20your%20details");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName } },
  });
  if (error) redirect(`/register?error=${encodeURIComponent(error.message)}`);
  redirect("/dashboard?welcome=1");
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  const { data } = await supabase.from("profiles").select("role").single();
  redirect(data?.role === "admin" ? "/admin" : "/dashboard");
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function createRequest(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = requestSchema.safeParse({
    category: formData.get("category"),
    location: formData.get("location"),
    description: formData.get("description"),
    latitude: formData.get("latitude") ? Number(formData.get("latitude")) : null,
    longitude: formData.get("longitude") ? Number(formData.get("longitude")) : null,
  });
  if (!parsed.success) redirect("/dashboard?error=Please%20check%20the%20request%20details");

  let imagePath: string | null = null;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    if (image.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
      redirect("/dashboard?error=Images%20must%20be%20JPG%2C%20PNG%20or%20WebP%20under%205MB");
    }
    imagePath = `${user.id}/${crypto.randomUUID()}-${image.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("request-images").upload(imagePath, image);
    if (error) redirect("/dashboard?error=We%20could%20not%20upload%20that%20image.%20Please%20try%20again.");
  }

  const { error } = await supabase.from("requests").insert({
    citizen_id: user.id,
    ...parsed.data,
    image_path: imagePath,
  });
  if (error) redirect("/dashboard?error=We%20could%20not%20save%20your%20request.%20Please%20try%20again.");
  revalidatePath("/dashboard");
  redirect("/dashboard?created=1");
}

export async function updateRequestStatus(formData: FormData) {
  const parsed = statusUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin?error=Invalid%20status%20update");
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");
  const { data: request } = await supabase.from("requests").select("status").eq("id", parsed.data.requestId).single();
  if (!request || (parsed.data.status && !canTransition(request.status, parsed.data.status, parsed.data.note ?? ""))) {
    redirect("/admin?error=That%20status%20change%20needs%20a%20message%20or%20is%20not%20allowed.");
  }
  const { error } = await supabase.rpc("post_request_update", {
    p_request_id: parsed.data.requestId,
    p_status: parsed.data.status ?? null,
    p_note: parsed.data.note ?? null,
  });
  if (error) redirect("/admin?error=We%20could%20not%20post%20that%20update.%20Please%20try%20again.");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  redirect("/admin?updated=1");
}
