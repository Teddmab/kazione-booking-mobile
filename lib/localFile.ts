import { File } from "expo-file-system";

export async function readLocalFileAsBase64(uri: string): Promise<string> {
  return new File(uri).base64();
}

export async function readLocalFileAsText(uri: string): Promise<string> {
  return new File(uri).text();
}
