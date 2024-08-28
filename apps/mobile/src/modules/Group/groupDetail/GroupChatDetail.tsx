import React, {useRef, useState} from 'react';
import {FlatList, SafeAreaView, Text, TouchableOpacity, View} from 'react-native';

import {BackIcon} from '../../../assets/icons';
import {IconButton, Modalize} from '../../../components';
import {useStyles} from '../../../hooks';
import {GroupChatDetailScreenProps} from '../../../types';
import GroupAdminActions from '../memberAction/groupAction';
import stylesheet from './styles';

const data = [
  {id: '1', name: 'Alice Johnson', role: 'Admin'},
  {id: '2', name: 'Bob Smith', role: 'Member'},
  {id: '3', name: 'Charlie Brown', role: 'Member'},
  {id: '4', name: 'Diana Prince', role: 'Member'},
  {id: '5', name: 'Ethan Hunt', role: 'Member'},
];

const GroupChatDetail: React.FC<GroupChatDetailScreenProps> = ({navigation, route}) => {
  const modalizeRef = useRef<Modalize>(null);

  const onOpen = () => {
    modalizeRef.current?.open();
  };
  const styles = useStyles(stylesheet);
  const [groupName] = useState('Project Team');
  const [members] = useState(data);

  return (
    <>
      <SafeAreaView style={styles.container}>
        <Modalize ref={modalizeRef}>
          <GroupAdminActions />
        </Modalize>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('GroupChat', {groupId: route.params.groupId})}
          >
            <BackIcon width={24} height={24} stroke="gray" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.groupName}>{groupName}</Text>
            <Text style={styles.memberCount}>{members.length} members</Text>
          </View>
        </View>

        <FlatList
          data={members}
          renderItem={({item}) => <MemberCard item={item} handleOpen={() => onOpen()} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.memberList}
        />
      </SafeAreaView>
    </>
  );
};

const MemberCard = ({item, handleOpen}: {item: any; handleOpen: () => void}) => {
  const styles = useStyles(stylesheet);
  return (
    <View style={styles.memberItem}>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberRole}>{item.role}</Text>
      </View>

      <IconButton
        icon="MoreVerticalIcon"
        size={20}
        style={styles.iconButton}
        onPress={handleOpen}
      />
    </View>
  );
};

export default GroupChatDetail;
