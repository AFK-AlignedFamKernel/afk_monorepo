import {useNavigation} from '@react-navigation/native';
import {useQueryClient} from '@tanstack/react-query';
import {useProfile, useSettingsStore} from 'afk_nostr_sdk';
// import {useAuth} from '../../store/auth';
import {useAuth, useCreateChannel} from 'afk_nostr_sdk';
import {AFK_RELAYS} from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import {Formik, FormikProps} from 'formik';
import {useRef, useState} from 'react';
import {ScrollView, TouchableOpacity, View} from 'react-native';

import {CopyIconStack} from '../../assets/icons';
import {Button, SquareInput, Text} from '../../components';
import {useStyles, useTheme} from '../../hooks';
import {useFileUpload} from '../../hooks/api';
import {useToast} from '../../hooks/modals';
import {CreateChannelScreenProps, MainStackNavigationProps} from '../../types';
import {ChannelHead} from './Head';
import stylesheet from './styles';

const UsernameInputLeft = (
  <Text weight="bold" color="inputPlaceholder">
    @
  </Text>
);

type FormValues = {
  image: string | undefined;
  banner: string | undefined;
  username: string;
  channelName: string;
  displayName: string;
  about: string;
  telegram: string;
  github: string;
  twitter: string;
  tags: string[][];
  picture?: string;
  relays: string[];
};

export const CreateChannel: React.FC<CreateChannelScreenProps> = () => {
  const formikRef = useRef<FormikProps<FormValues>>(null);

  const {theme} = useTheme();
  const styles = useStyles(stylesheet);

  const [profilePhoto, setProfilePhoto] = useState<ImagePicker.ImagePickerAsset | undefined>();
  const [coverPhoto, setCoverPhoto] = useState<ImagePicker.ImagePickerAsset | undefined>();

  const publicKey = useAuth((state) => state.publicKey);
  const profile = useProfile({publicKey});
  const fileUpload = useFileUpload();
  const createChannel = useCreateChannel();
  const queryClient = useQueryClient();
  const {relays} = useSettingsStore();
  const {showToast} = useToast();
  const navigation = useNavigation<MainStackNavigationProps>();

  if (profile.isLoading) return null;

  const onPublicKeyCopyPress = async () => {
    await Clipboard.setStringAsync(publicKey);
    showToast({type: 'info', title: 'Public Key Copied to clipboard'});
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
    channelName: '',
    about: profile.data?.about ?? '',
    telegram: profile.data?.telegram?.toString() ?? '',
    github: profile.data?.github?.toString() ?? '',
    twitter: profile.data?.twitter?.toString() ?? '',
    tags: [],
    relays: relays ?? AFK_RELAYS,
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
    let {image, banner} = values;

    try {
      if (profilePhoto) {
        const result = await fileUpload.mutateAsync(profilePhoto);
        if (result.data.url) image = result.data.url;
      }

      if (coverPhoto) {
        const result = await fileUpload.mutateAsync(coverPhoto);
        if (result.data.url) banner = result.data.url;
      }

      const content = {
        name: values.channelName,
        about: values.about,
        picture: image,
        relays: values?.relays,
      };

      const channelCreated = await createChannel.mutateAsync({
        tags: values.tags,
        channel_name: values.channelName,
        content: JSON.stringify(content),
      });

      if (channelCreated?.id) {
        navigation?.navigate('ChannelDetail', {postId: channelCreated?.id, post: channelCreated});
      }
      // queryClient.invalidateQueries({queryKey: ['profile', publicKey]});

      showToast({type: 'success', title: 'Channel created successfully'});
    } catch (error) {
      showToast({type: 'error', title: 'Failed to create Channel'});
    }
  };

  return (
    <ScrollView automaticallyAdjustKeyboardInsets style={styles.container}>
      <ChannelHead
        onProfilePhotoUpload={onProfilePhotoUpload}
        onCoverPhotoUpload={onCoverPhotoUpload}
        profilePhoto={
          (profilePhoto?.uri ? {uri: profilePhoto.uri} : undefined) ||
          (profile.data?.image ? {uri: profile.data?.image} : undefined)
        }
        coverPhoto={
          (coverPhoto?.uri ? {uri: coverPhoto.uri} : undefined) ||
          (profile.data?.banner ? {uri: profile.data?.banner} : undefined)
        }
        buttons={
          <Button variant="secondary" small onPress={onSubmitPress}>
            Create
          </Button>
        }
      />

      <Formik
        innerRef={formikRef}
        initialValues={initialFormValues}
        onSubmit={onFormSubmit}
        validate={validateForm}
      >
        {({handleChange, handleBlur, values, errors}) => (
          <View style={styles.form}>
            <SquareInput
              placeholder="Channel name"
              left={UsernameInputLeft}
              onChangeText={handleChange('channelName')}
              onBlur={handleBlur('channelName')}
              value={values.channelName}
              error={errors.channelName}
            />

            <SquareInput
              placeholder="Channel Display Name"
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
              placeholder="About the channel"
              multiline
              onChangeText={handleChange('about')}
              onBlur={handleBlur('about')}
              value={values.about}
              error={errors.about}
            />

            <View style={styles.gap} />
          </View>
        )}
      </Formik>
    </ScrollView>
  );
};
