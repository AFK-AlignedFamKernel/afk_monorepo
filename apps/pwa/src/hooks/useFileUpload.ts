import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
// import { Platform } from 'react-native';
import { useApiMutation } from './useApiMutation';
import { dataURLToBlob } from '@/utils/helpers';
import { ApiInstance, ApiBackendInstance } from '@/utils/file-upload';
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

export const useFileUpload = () => {
    return useApiMutation<FileUploadResult, FileUploadResult, File | string | Blob>({
        mutationKey: ['fileUpload'],
        mutationFn: async (file: File | string | Blob) => {
            const formData = new FormData();

            // Handle web file uploads
            if (typeof file === 'string') {
                // Handle data URL strings (base64 encoded images)
                if (file.startsWith('data:')) {
                    const blob = dataURLToBlob(file);
                    formData.append('file', blob);
                } else {
                    // Handle file paths or URLs
                    const response = await fetch(file);
                    const blob = await response.blob();
                    formData.append('file', blob);
                }
            } else if (file instanceof File) {
                // Handle File objects from input elements
                formData.append('file', file);
            } else if (file instanceof Blob) {
                // Handle Blob objects
                formData.append('file', file);
            }

            return ApiBackendInstance.post('/file', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },
    });
};

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
