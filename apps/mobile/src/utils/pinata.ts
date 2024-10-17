import axios from 'axios';
import * as FileSystem from 'expo-file-system';

export const uploadToPinata = async (fileUri: string) => {
  const apiKey = process.env.EXPO_PUBLIC_PINATA_API_KEY;
  const apiSecret = process.env.EXPO_PUBLIC_PINATA_API_SECRET;

  // Read the file as a binary string
  const fileInfo = await FileSystem.getInfoAsync(fileUri);
  const fileContent = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });

  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    type: 'video/mp4',
    name: 'video.mp4',
  } as any);  // Use 'as any' to bypass TypeScript checks

  try {
    const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        pinata_api_key: apiKey,
        pinata_secret_api_key: apiSecret,
      },
    });
    return res.data.IpfsHash;
  } catch (error) {
    console.error('Error uploading to Pinata:', error);
    throw error;
  }
};
