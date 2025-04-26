import axios from 'axios';
import FormData from 'form-data';

const pinataApiKey = process.env.PINATA_API_KEY;
const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;
const pinataBaseUrl = 'https://api.pinata.cloud';

export const pinata = {
  async pinFileToIPFS(fileBuffer: Buffer, options: { pinataMetadata: { name: string, type: string } }) {
    const url = `${pinataBaseUrl}/pinning/pinFileToIPFS`;
    const formData = new FormData();
    formData.append('file', fileBuffer, { filename: options.pinataMetadata.name });

    const metadata = JSON.stringify(options.pinataMetadata);
    formData.append('pinataMetadata', metadata);

    const response = await axios.post(url, formData, {
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        ...formData.getHeaders(),
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretApiKey,
      },
    });

    return response.data;
  },
};