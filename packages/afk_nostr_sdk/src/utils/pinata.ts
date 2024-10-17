import axios from 'axios';
import FormData from 'form-data';

export const uploadToPinata = async (fileUri: string): Promise<string> => {
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    type: 'video/mp4',
    name: 'video.mp4',
  });

  try {
    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
      },
    });

    return response.data.IpfsHash;
  } catch (error) {
    console.error('Error uploading to Pinata:', error);
    throw error;
  }
};

