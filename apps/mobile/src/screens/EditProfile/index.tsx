import { useQueryClient } from '@tanstack/react-query';
import { useEditProfile, useProfile } from 'afk_nostr_sdk';
// import {useAuth} from '../../store/auth';
import { useAuth } from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { Formik, FormikProps } from 'formik';
import { useRef, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';

import { CopyIconStack } from '../../assets/icons';
import { Button, SquareInput, Text } from '../../components';
import { useStyles, useTheme } from '../../hooks';
import { useFileUpload } from '../../hooks/api';
import { useToast } from '../../hooks/modals';
import { EditProfileScreenProps } from '../../types';
import { ProfileHead } from '../Profile/Head';
import stylesheet from './styles';
import { Hashtags } from './Hashtags';

const UsernameInputLeft = (
  <Text weight="bold" color="inputPlaceholder">
    @
  </Text>
);

type FormValues = {
  image: string | undefined;
  banner: string | undefined;
  username: string;
  displayName: string;
  bio: string;
  telegram: string;
  github: string;
  twitter: string;
  lud16?: string;
  lud06?: string;
  tags?: string[];
};

export const EditProfile: React.FC<EditProfileScreenProps> = () => {
  const formikRef = useRef<FormikProps<FormValues>>(null);

  const { theme } = useTheme();
  const styles = useStyles(stylesheet);

  const [profilePhoto, setProfilePhoto] = useState<ImagePicker.ImagePickerAsset | undefined>();
  const [coverPhoto, setCoverPhoto] = useState<ImagePicker.ImagePickerAsset | undefined>();

  const publicKey = useAuth((state) => state.publicKey);
  const profile = useProfile({ publicKey });
  const fileUpload = useFileUpload();
  const editProfile = useEditProfile();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [hashtagInput, setHashtagInput] = useState<string | undefined>();
  if (profile.isLoading) return null;

  const onPublicKeyCopyPress = async () => {
    await Clipboard.setStringAsync(publicKey);
    showToast({ type: 'info', title: 'Public Key Copied to clipboard' });
  };

  const handlePhotoSelect = async (type: 'profile' | 'cover') => {
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      aspect: type === 'profile' ? [1, 1] : [16, 9],
      allowsEditing: true,
      allowsMultipleSelection: false,
      selectionLimit: 1,
      exif: false,
      quality: 0.75,
    });

    if (pickerResult.canceled || !pickerResult.assets.length) return;
    return pickerResult.assets[0];
  };

  const onProfilePhotoUpload = async () => {
    const file = await handlePhotoSelect('profile');
    if (file) setProfilePhoto(file);
  };

  const onCoverPhotoUpload = async () => {
    const file = await handlePhotoSelect('cover');
    if (file) setCoverPhoto(file);
  };

  const initialFormValues: FormValues = {
    image: profile.data?.image ?? undefined,
    banner: profile.data?.banner ?? undefined,
    username: profile.data?.nip05 ?? '',
    displayName: profile.data?.displayName ?? profile.data?.name ?? '',
    bio: profile.data?.about ?? '',
    telegram: profile.data?.telegram?.toString() ?? '',
    github: profile.data?.github?.toString() ?? '',
    twitter: profile.data?.twitter?.toString() ?? '',
    lud16: profile.data?.lud16?.toString() ?? '',
    lud06: profile.data?.lud06?.toString() ?? '',
  };

  const onSubmitPress = () => {
    formikRef.current?.handleSubmit();
  };

  const validateForm = (values: FormValues) => {
    const errors = {} as Partial<FormValues>;

    // TODO: Do validation

    return errors;
  };

  const onFormSubmit = async (values: FormValues) => {
    let { image, banner } = values;

    try {
      if (profilePhoto) {
        const result = await fileUpload.mutateAsync(profilePhoto);
        if (result.data.url) image = result.data.url;
      }

      if (coverPhoto) {
        const result = await fileUpload.mutateAsync(coverPhoto);
        if (result.data.url) banner = result.data.url;
      }

      await editProfile.mutateAsync({
        image,
        banner,
        nip05: values.username || undefined,
        displayName: values.displayName || undefined,
        about: values.bio || undefined,
        telegram: values.telegram || undefined,
        github: values.github || undefined,
        twitter: values.twitter || undefined,
        lud06: values?.lud06 || undefined,
        lud16: values.lud16 || undefined,
        // tags: values?.tags || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ['profile', publicKey] });

      showToast({ type: 'success', title: 'Profile updated successfully' });
    } catch (error) {
      showToast({ type: 'error', title: 'Failed to update profile' });
    }
  };

  return (
    <ScrollView automaticallyAdjustKeyboardInsets style={styles.container}>
      <ProfileHead
        onProfilePhotoUpload={onProfilePhotoUpload}
        onCoverPhotoUpload={onCoverPhotoUpload}
        profilePhoto={
          (profilePhoto?.uri ? { uri: profilePhoto.uri } : undefined) ||
          (profile.data?.image ? { uri: profile.data?.image } : undefined)
        }
        coverPhoto={
          (coverPhoto?.uri ? { uri: coverPhoto.uri } : undefined) ||
          (profile.data?.banner ? { uri: profile.data?.banner } : undefined)
        }
        buttons={
          <Button variant="secondary" small onPress={onSubmitPress}>
            Save
          </Button>
        }
      />

      <Formik
        innerRef={formikRef}
        initialValues={initialFormValues}
        onSubmit={onFormSubmit}
        validate={validateForm}
      >
        {({ handleChange, handleBlur, values, errors, setFieldValue }) => (
          <View style={styles.form}>
            <SquareInput
              placeholder="username"
              left={UsernameInputLeft}
              onChangeText={handleChange('username')}
              onBlur={handleBlur('username')}
              value={values.username}
              error={errors.username}
            />

            <SquareInput
              placeholder="Display Name"
              onChangeText={handleChange('displayName')}
              onBlur={handleBlur('displayName')}
              value={values.displayName}
              error={errors.displayName}
            />

            <SquareInput
              readOnly
              editable={false}
              value={publicKey}
              left={
                <TouchableOpacity onPress={onPublicKeyCopyPress}>
                  <CopyIconStack color={theme.colors.primary} />
                </TouchableOpacity>
              }
              inputStyle={styles.publicKeyInput}
            />

            <SquareInput
              placeholder="Bio"
              multiline
              onChangeText={handleChange('bio')}
              onBlur={handleBlur('bio')}
              value={values.bio}
              error={errors.bio}
            />

            <SquareInput
              placeholder="Lightning Address - LUD 16"
              left={UsernameInputLeft}
              onChangeText={handleChange('lud16')}
              onBlur={handleBlur('lud16')}
              value={values.lud16}
              error={errors.lud16}
            />

            <SquareInput
              placeholder="LUD06"
              left={UsernameInputLeft}
              onChangeText={handleChange('lud06')}
              onBlur={handleBlur('lud06')}
              value={values.lud06}
              error={errors.lud06}
            />

            <View style={styles.gap} />

            <SquareInput
              placeholder="telegram"
              left={UsernameInputLeft}
              onChangeText={handleChange('telegram')}
              onBlur={handleBlur('telegram')}
              value={values.telegram}
              error={errors.telegram}
            />

            <SquareInput
              placeholder="github"
              left={UsernameInputLeft}
              onChangeText={handleChange('github')}
              onBlur={handleBlur('github')}
              value={values.github}
              error={errors.github}
            />

            <SquareInput
              placeholder="twitter - X"
              left={UsernameInputLeft}
              onChangeText={handleChange('twitter')}
              onBlur={handleBlur('twitter')}
              value={values.twitter}
              error={errors.twitter}
            />


            <View style={styles.gap} />
            <Hashtags values={values} setFieldValue={setFieldValue} />

          </View>
        )}
      </Formik>
    </ScrollView>
  );
};
