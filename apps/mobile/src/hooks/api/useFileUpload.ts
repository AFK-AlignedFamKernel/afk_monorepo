import {useMutation} from '@tanstack/react-query';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import {ImagePickerAsset} from 'expo-image-picker';
import {Platform} from 'react-native';

import {ApiInstance} from '../../services/api';
import {dataURLToBlob} from '../../utils/helpers';
import {useApiMutation} from './useApiMutation';

//ENVS
const PINATA_JWT = process.env.EXPO_PUBLIC_PINATA_JWT || '';
const PINATA_GATEWAY_UPLOAD_URL = process.env.EXPO_PUBLIC_PINATA_UPLOAD_GATEWAY_URL || '';

const PINATA_UPLOAD_URL =
  process.env.EXPO_PUBLIC_PINATA_UPLOAD_URL || 'https://uploads.pinata.cloud/v3/files';
const PINATA_SIGN_URL =
  process.env.EXPO_PUBLIC_PINATA_PINATA_SIGN_URL || 'https://api.pinata.cloud/v3/files/sign';

// Set a date far in the future (approximately 100 years from now)
const FAR_FUTURE_DATE = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).getTime();

interface IVideoType {
  id: string;
  name: string;
  cid: string;
  created_at: string;
  size: number;
  number_of_files: number;
  mime_type: string;
  user_id: string;
  is_duplicate: boolean;
  url: string;
}

export const useFileUpload = () => {
  return useApiMutation({
    mutationKey: ['fileUpload'],
    mutationFn: (file: ImagePickerAsset) => {
      const formData = new FormData();

      formData.append(
        'file',
        Platform.OS === 'web'
          ? dataURLToBlob(file.uri)
          : ({
              uri: file.uri,
              name: 'file',
              type: file.mimeType,
            } as any),
      );

      return ApiInstance.post('/file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  });
};

export const usePinataVideoUpload = () => {
  return useMutation({
    mutationFn: async (video: ImagePickerAsset) => {
      const formData = new FormData();

      if (Platform.OS === 'web') {
        const blob = dataURLToBlob(video.uri);
        formData.append('file', blob, 'video');
      } else {
        await FileSystem.getInfoAsync(video.uri); // Ensures file exists
        formData.append('file', {
          uri: video.uri,
          name: 'video',
          type: video.mimeType || 'video/mp4',
        } as any);
      }

      const headers = {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${PINATA_JWT}`,
      };

      try {
        const {data: uploadResponse} = await axios.post(PINATA_UPLOAD_URL, formData, {headers});
        const cid = uploadResponse?.data?.cid;

        if (cid) {
          const body = {
            url: `${PINATA_GATEWAY_UPLOAD_URL}/files/${cid}`,
            date: FAR_FUTURE_DATE,
            expires: FAR_FUTURE_DATE,
            method: 'GET',
          };
          headers['Content-Type'] = 'application/json';
          const {data: result} = await axios.post(PINATA_SIGN_URL, body, {
            headers,
          });

          return {
            ...uploadResponse?.data,
            url: result?.data,
          } as IVideoType;
        }

        return uploadResponse as IVideoType;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new Error(error.response?.data?.message || 'Upload failed');
        }
        throw error;
      }
    },
  });
};
