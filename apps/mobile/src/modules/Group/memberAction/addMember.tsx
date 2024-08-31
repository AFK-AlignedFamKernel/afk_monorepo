import {useQueryClient} from '@tanstack/react-query';
import {
  AdminGroupPermission,
  useAddMember,
  useAddPermissions,
  useGetGroupMemberList,
} from 'afk_nostr_sdk';
import {Formik} from 'formik';
import {Text, View} from 'react-native';

import {Button, Input} from '../../../components';
import {useStyles} from '../../../hooks';
import {useToast} from '../../../hooks/modals';
import stylesheet from './styles';

export default function AddMemberView({
  groupId,
  handleClose,
  permissionData,
}: {
  groupId: string;
  handleClose: () => void;
  permissionData: AdminGroupPermission[];
}) {
  const groupMembers = useGetGroupMemberList({
    groupId,
  });
  const {mutate: addMember} = useAddMember();
  const {mutate: addPermission} = useAddPermissions();

  const queryClient = useQueryClient();
  const {showToast} = useToast();
  const styles = useStyles(stylesheet);

  const initialValues = {
    pubKey: '',
    groupId,
  };

  const checkIfMemberExists = (pubKey: string) => {
    return groupMembers?.data.pages.some((page: any) =>
      page.some((event: any) => event.tags.some((tag: any) => tag[0] === 'p' && tag[1] === pubKey)),
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New Member</Text>
      <Text style={styles.text}>Enter user public key.</Text>

      <Formik
        initialValues={initialValues}
        onSubmit={(values) => {
          if (checkIfMemberExists(values.pubKey)) {
            showToast({
              type: 'error',
              title: 'Error! This public key is already a member of the group.',
            });
          } else {
            addMember(
              {
                pubkey: values.pubKey,
                groupId,
                permissionData: permissionData as any,
              },
              {
                onSuccess() {
                  // After successfully adding external member by pubkey, give them default view access.
                  addPermission(
                    {
                      groupId,
                      pubkey: values.pubKey,
                      permissionName: [AdminGroupPermission.ViewAccess],
                    },
                    {
                      onSuccess() {
                        showToast({
                          type: 'success',
                          title: 'Member added and permissions set successfully',
                        });
                        queryClient.invalidateQueries({queryKey: ['getAllGroupMember']});
                        queryClient.invalidateQueries({
                          queryKey: ['getPermissionsByUserConnected', groupId],
                        });
                        handleClose();
                      },
                      onError() {
                        showToast({
                          type: 'error',
                          title:
                            'Member added but permissions could not be set. Please set permissions manually.',
                        });
                        queryClient.invalidateQueries({queryKey: ['getAllGroupMember']});
                        handleClose();
                      },
                    },
                  );
                },
                onError() {
                  showToast({
                    type: 'error',
                    title: 'Error! Member could not be added. Please try again later.',
                  });
                },
              },
            );
          }
        }}
      >
        {({handleChange, handleBlur, handleSubmit, values}) => (
          <View style={{display: 'flex', gap: 10, paddingTop: 10}}>
            <Input
              value={values.pubKey}
              onBlur={handleBlur('pubKey')}
              onChangeText={handleChange('pubKey')}
              placeholder="Enter public key"
            />
            <Button onPress={() => handleSubmit()}>Submit</Button>
          </View>
        )}
      </Formik>
    </View>
  );
}
