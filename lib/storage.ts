import { readLocalFileAsBase64 } from "@/lib/localFile";
import { getSupabase } from "@/lib/supabase";

/**
 * Uploads a local image URI to Supabase Storage and returns the public URL.
 * Bucket: business-assets  Path: {businessId}/invoices/{timestamp}.jpg
 */
export async function uploadInvoiceImage(
  businessId: string,
  localUri: string,
): Promise<string> {
  const base64 = await readLocalFileAsBase64(localUri);

  // Decode base64 to Uint8Array
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const fileName = `${businessId}/invoices/${Date.now()}.jpg`;
  const supabase = getSupabase();

  const { data, error } = await supabase.storage
    .from("business-assets")
    .upload(fileName, bytes.buffer as ArrayBuffer, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from("business-assets")
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}
