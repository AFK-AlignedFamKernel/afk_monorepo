import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useApiMutation } from './useApiMutation';
import { dataURLToBlob } from '@/utils/helpers';
import { ApiInstance, ApiBackendInstance } from '@/utils/file-upload';
import { MetadataOnchain } from '@/types/token';

//ENVS
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/';

// Define types for file uploads
interface FileUploadResult {
    data: {
        hash: string;
        url: string;
    };
}

interface IVideoType {
    id: string;
    url: string;
}

// For expo-image-picker assets
interface ImagePickerAsset {
    uri: string;
    width?: number;
    height?: number;
    mimeType?: string;
    type?: string;
}


export const uploadJsonIpfs = async (data:any) => {
    try {
        const response = await ApiBackendInstance.post('/file/metadata', data, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.message || 'JSON upload failed');
        }
        // throw error;
        return undefined;
    }
}


export const usePinataVideoUpload = () => {
    return useMutation<IVideoType, Error, ImagePickerAsset>({
        mutationFn: async (video: ImagePickerAsset) => {
            const formData = new FormData();

            if (video.uri.startsWith('data:')) {
                const blob = dataURLToBlob(video.uri);
                formData.append('file', blob, 'video');
            } else {
                const response = await fetch(video.uri);
                const blob = await response.blob();
                formData.append('file', blob, 'video');
            }

            const headers = {
                'Content-Type': 'multipart/form-data',
            };

            try {
                const resp = (await ApiInstance.post('/file', formData, {
                    headers,
                })) as FileUploadResult;

                return {
                    id: resp.data.hash,
                    url: `${PINATA_GATEWAY}ipfs/${resp.data.hash}`,
                } as IVideoType;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    throw new Error(error.response?.data?.message || 'Upload failed');
                }
                throw error;
            }
        },
    });
};
