// utils/crypto.ts
export async function aes256cbcEncrypt(
  plaintext: string,
  key: Uint8Array,
  iv: Uint8Array
): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const data = enc.encode(plaintext);

  // Import the key
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "AES-CBC" },
    false,
    ["encrypt"]
  );

  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    cryptoKey,
    data
  );

  return new Uint8Array(ciphertext);
}

export function encodeBase64(data: Uint8Array): string {
  if (typeof window !== "undefined") {
    // Browser
    return btoa(String.fromCharCode(...data));
  } else {
    // Node.js
    return Buffer.from(data).toString("base64");
  }
}

export function generateRandomBytesLength(length: number): Uint8Array {
  const array = new Uint8Array(length);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Node.js
    require("crypto").randomFillSync(array);
  }
  return array;
}
