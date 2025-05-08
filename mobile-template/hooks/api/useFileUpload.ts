import {useMutation} from '@tanstack/react-query';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import {ImagePickerAsset} from 'expo-image-picker';
import {Platform} from 'react-native';

import {ApiInstance} from '../../services/api';
import {dataURLToBlob} from '../../utils/helpers';
import {useApiMutation} from './useApiMutation';

//ENVS
const PINATA_GATEWAY = process.env.EXPO_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/';

interface IVideoType {
  id: string;
  url: string;
}

interface IpfHash {
  data: {
    hash: string;
    url: string;
  };
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
      // return ApiInstance.post('/file', formData, {
      //   headers: {
      //     'Content-Type': 'multipart/form-data',
      //   },
      // });
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
      };

      try {
        const resp = (await ApiInstance.post('/file', formData, {
          headers,
        })) as IpfHash;

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
