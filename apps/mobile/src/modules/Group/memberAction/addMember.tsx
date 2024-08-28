import {useQueryClient} from '@tanstack/react-query';
import {useAddMember, useGetGroupMemberList} from 'afk_nostr_sdk';
import {Formik} from 'formik';
import {Text, View} from 'react-native';

import {Button, Input} from '../../../components';
import {useStyles} from '../../../hooks';
import {useToast} from '../../../hooks/modals';
import stylesheet from './styles';

export default function AddMemberView({
  groupId,
  handleClose,
}: {
  groupId: string;
  handleClose: () => void;
}) {
  const groupMembers = useGetGroupMemberList({
    groupId,
  });
  const {mutate} = useAddMember();
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
          //Check if the pubKey that wants to be added exist
          if (checkIfMemberExists(values.pubKey)) {
            showToast({
              type: 'error',
              title: 'Error! This public key is already a member of the group.',
            });
          } else {
            mutate(
              {
                pubkey: values.pubKey,
                groupId,
              },
              {
                onSuccess(data) {
                  console.log(data);
                  showToast({type: 'success', title: 'Member Added successfully'});
                  queryClient.invalidateQueries({queryKey: ['getAllGroupMember']});
                  handleClose();
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
