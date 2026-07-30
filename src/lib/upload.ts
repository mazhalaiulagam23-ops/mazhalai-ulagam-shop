import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 3650;

/** Uploads an image to storage and returns a long-lived signed URL. */
export async function uploadImage(file: File, folder = "cms"): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage
    .from("product-images")
    .createSignedUrl(path, TEN_YEARS);
  if (signErr || !data?.signedUrl) throw signErr ?? new Error("Could not create image link");
  return data.signedUrl;
}
