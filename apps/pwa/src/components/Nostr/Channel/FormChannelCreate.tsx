
import React, { useState, useRef } from 'react';
import { useCreateChannel, useProfile, useAuth } from 'afk_nostr_sdk';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from '@/styles/components/channel.module.scss';
import { useUIStore } from '@/store/uiStore';
import { useFileUpload } from '@/hooks/useFileUpload';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import Link from 'next/link';

interface FormValues {
  channelName: string;
  displayName: string;
  about: string;
  picture?: string;
}

export default function FormChannelCreate() {
  const router = useRouter();
  const { publicKey } = useAuth();
  const { data: profile } = useProfile({ publicKey });
  const createChannel = useCreateChannel();

  const { showToast } = useUIStore();
  
  const fileUpload = useFileUpload();
  const [formData, setFormData] = useState<FormValues>({
    channelName: '',
    displayName: '',
    about: '',
    picture: '',
  });
  const [errors, setErrors] = useState<Partial<FormValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [resultEvent, setResultEvent] = useState<NDKEvent | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormValues> = {};
    
    if (!formData.channelName.trim()) {
      newErrors.channelName = 'Channel name is required';
    }
    
    if (!formData.about.trim()) {
      newErrors.about = 'Channel description is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormValues, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async (file: File): Promise<string | undefined> => {
    try {
      const s = await fileUpload.mutateAsync(file);
      console.log('result image upload', s);
      if (s && typeof s === 'object' && 'data' in s && s.data && typeof s.data === 'object' && 'url' in s.data) {
        return (s.data as { url?: string }).url ?? undefined;
      }
      return undefined;
    } catch (error) {
      console.error('Failed to upload image:', error);
      showToast({
           message: 'Failed to upload image',
        type: 'error',
      });
    }
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      let imageUrl = formData.picture;
      
      if (selectedImage) {
        imageUrl = await handleImageUpload(selectedImage);
      }


      if(!formData.channelName) {
        showToast({
          message: 'Channel name is required',
          type: 'error',
        });
        return;
      }

      if(!formData.displayName) {
        formData.displayName = formData.channelName;
      }
      
      const content = {
        name: formData.channelName,
        displayName: formData.displayName,
        about: formData.about,
        picture: imageUrl,
      };
      
      console.log('content', content);
      
     const resultEvent = await createChannel.mutateAsync({
        channel_name: formData.channelName,
        content: JSON.stringify(content),
        tags: [],
      });
      
      showToast({
        message: 'Channel created',
        type: 'success',
      });
      setResultEvent(resultEvent);
      // Redirect to channels feed
      // router.push('/nostr/channels');
    } catch (error) {
      console.error('Failed to create channel:', error);
      setErrors({ channelName: 'Failed to create channel. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`max-w-2xl mx-auto p-6 ${styles.channelCreate}`}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--afk-accent-green, #00FF9C)' }}>
          Create Channel
        </h1>
        <p className="text-gray-400">
          Create a new channel to share content with your community
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Channel Image */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">
            Channel Image
          </label>
          <div className="flex items-center space-x-4">
            <div className="relative">
              {imagePreview ? (
                <Image
                  unoptimized
                  src={imagePreview}
                  alt="Channel preview"
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover border-2"
                  style={{ borderColor: 'var(--afk-accent-green, #00FF9C)' }}
                />
              ) : (
                <div 
                  className="w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer"
                  style={{ borderColor: 'var(--afk-accent-cyan, #00F0FF)' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-sm border rounded-lg transition-colors"
              style={{ 
                borderColor: 'var(--afk-accent-cyan, #00F0FF)',
                color: 'var(--afk-accent-cyan, #00F0FF)'
              }}
            >
              {imagePreview ? 'Change Image' : 'Upload Image'}
            </button>
          </div>
        </div>

        {/* Channel Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">
            Channel Name *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold">
              #
            </span>
            <input
              type="text"
              value={formData.channelName}
              onChange={(e) => handleInputChange('channelName', e.target.value)}
              className={`w-full pl-8 pr-4 py-3 rounded-lg border transition-colors ${
                errors.channelName 
                  ? 'border-red-500' 
                  : 'border-gray-600 focus:border-[var(--afk-accent-green,#00FF9C)]'
              }`}
              style={{
                background: 'var(--afk-bg-panel, #1A1A1A)',
                color: 'var(--afk-text-dark, #FFFFFF)'
              }}
              placeholder="Enter channel name"
            />
          </div>
          {errors.channelName && (
            <p className="text-red-500 text-sm">{errors.channelName}</p>
          )}
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">
            Display Name
          </label>
          <input
            type="text"
            value={formData.displayName}
            onChange={(e) => handleInputChange('displayName', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-600 focus:border-[var(--afk-accent-green,#00FF9C)] transition-colors"
            style={{
              background: 'var(--afk-bg-panel, #1A1A1A)',
              color: 'var(--afk-text-dark, #FFFFFF)'
            }}
            placeholder="Enter display name (optional)"
          />
        </div>

        {/* About */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">
            About *
          </label>
          <textarea
            value={formData.about}
            onChange={(e) => handleInputChange('about', e.target.value)}
            rows={4}
            className={`w-full px-4 py-3 rounded-lg border transition-colors resize-none ${
              errors.about 
                ? 'border-red-500' 
                : 'border-gray-600 focus:border-[var(--afk-accent-green,#00FF9C)]'
            }`}
            style={{
              background: 'var(--afk-bg-panel, #1A1A1A)',
              color: 'var(--afk-text-dark, #FFFFFF)'
            }}
            placeholder="Describe your channel..."
          />
          {errors.about && (
            <p className="text-red-500 text-sm">{errors.about}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border rounded-lg transition-colors"
            style={{ 
              borderColor: 'var(--afk-accent-cyan, #00F0FF)',
              color: 'var(--afk-accent-cyan, #00F0FF)'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
            style={{
              background: 'var(--afk-accent-green, #00FF9C)',
              color: 'var(--afk-bg-dark, #0E0E0E)'
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create Channel'}
          </button>
        </div>

        {resultEvent && (
          <div>
            <h2>Channel created</h2>
            <Link href={`/nostr/channels/${resultEvent.id}`}>View Channel</Link>
          </div>
        )}
      </form>
    </div>
  );
}