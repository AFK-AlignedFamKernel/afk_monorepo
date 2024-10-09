import {useQueryClient} from '@tanstack/react-query';
import {
  AdminGroupPermission,
  useAddMember,
  useAddPermissions,
  useAuth,
  useCreateGroup,
  useGetGroupPermission,
} from 'afk_nostr_sdk';
import {Formik} from 'formik';
import {useState} from 'react';
import {Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Picker} from '../../../components';
import {Button, Input} from '../../../components';
import {useNostrAuth, useStyles} from '../../../hooks';
import {useToast} from '../../../hooks/modals';
import stylesheet from './styles';

export const CreateGroup: React.FC = () => {
  const styles = useStyles(stylesheet);
  const [groupId, setGroupId] = useState();
  const {data: permissionData} = useGetGroupPermission(groupId as any);

  const {publicKey: pubkey} = useAuth();
  const {showToast} = useToast();
  const queryClient = useQueryClient();
  const {mutate} = useCreateGroup();
  const {mutate: addMember} = useAddMember();
  const {handleCheckNostrAndSendConnectDialog} = useNostrAuth();
  const {mutate: addPermission} = useAddPermissions();

  const initialValues = {
    groupName: '',
    access: 'private',
  };

  return (
    <SafeAreaView style={styles.container}>
      <Formik
        initialValues={initialValues}
        onSubmit={async (values) => {

          await handleCheckNostrAndSendConnectDialog()

          mutate(
            {
              groupType: values.access as any,
              groupName: values.groupName,
            },
            {
              onSuccess(data) {
                setGroupId(groupId);
                // After Group Creation, first add permissions for the admin
                addPermission(
                  {
                    groupId: data.id,
                    pubkey,
                    permissionName: [
                      AdminGroupPermission.AddMember,
                      AdminGroupPermission.AddPermission,
                      AdminGroupPermission.DeleteEvent,
                      AdminGroupPermission.DeleteGroup,
                      AdminGroupPermission.EditGroupStatus,
                      AdminGroupPermission.EditMetadata,
                      AdminGroupPermission.RemovePermission,
                      AdminGroupPermission.RemoveUser,
                      AdminGroupPermission.ViewAccess,
                    ],
                  },
                  {
                    onSuccess() {
                      // After adding permissions, add the admin as a member
                      addMember(
                        {
                          groupId: data.id,
                          pubkey,
                        },
                        {
                          onSuccess() {
                            showToast({type: 'success', title: 'Group Created successfully'});
                            queryClient.invalidateQueries({
                              queryKey: ['getAllGroups'],
                            });
                            queryClient.invalidateQueries({
                              queryKey: ['getAllGroupMember'],
                            });
                            queryClient.invalidateQueries({
                              queryKey: ['getPermissionsByUserConnected', data.id],
                            });
                          },
                          onError() {
                            showToast({
                              type: 'error',
                              title:
                                'Error! Admin could not be added as a member. Please try again later.',
                            });
                          },
                        },
                      );
                    },
                    onError() {
                      showToast({
                        type: 'error',
                        title: 'Error! Admin permissions could not be set. Please try again later.',
                      });
                    },
                  },
                );
              },
              onError() {
                showToast({
                  type: 'error',
                  title: 'Error! Group could not be created. Please try again later.',
                });
              },
            },
          );
        }}
      >
        {({handleChange, handleBlur, setFieldValue, handleSubmit, values}) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Create a New Group</Text>
              <Text style={styles.cardDescription}>Add a new group and set its privacy level.</Text>
            </View>
            <View style={styles.cardContent}>
              <Input
                style={styles.input}
                placeholderTextColor={styles.input as unknown as string}
                placeholder="Enter group name"
                value={values.groupName}
                onBlur={handleBlur('groupName')}
                onChangeText={handleChange('groupName')}
              />
              <Picker
                selectedValue={values.access}
                onValueChange={(itemValue) => setFieldValue('access', itemValue)}
                label=""
              >
                <Picker.Item label="Private" value="private" />
                <Picker.Item label="Public" value="public" />
              </Picker>
            </View>
            <Button onPress={() => handleSubmit()}>Create Group</Button>
          </View>
        )}
      </Formik>
    </SafeAreaView>
  );
};
