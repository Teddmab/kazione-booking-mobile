import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

const MAX_DIMENSION = 1200;

export async function pickImage(options?: { allowsMultiple?: boolean }) {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error("Permission galerie refusée");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: options?.allowsMultiple ?? false,
    selectionLimit: options?.allowsMultiple ? 5 : 1,
    quality: 1,
  });

  if (result.canceled) return null;
  return result.assets;
}

export async function prepareWebpUri(uri: string, maxDim = MAX_DIMENSION): Promise<string> {
  const out = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxDim } }],
    { compress: 0.82, format: ImageManipulator.SaveFormat.WEBP },
  );
  return out.uri;
}

export async function uriToBlob(uri: string): Promise<Blob> {
  const res = await fetch(uri);
  return res.blob();
}
