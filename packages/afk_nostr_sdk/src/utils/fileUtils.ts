import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

export async function calculateSHA256(fileUri: string): Promise<string> {
  const fileInfo = await FileSystem.getInfoAsync(fileUri);
  if (!fileInfo.exists) {
    throw new Error('File does not exist');
  }

  const fileContent = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    fileContent,
    {
      encoding: Crypto.CryptoEncoding.BASE64,
    }
  );

  return hash;
}
