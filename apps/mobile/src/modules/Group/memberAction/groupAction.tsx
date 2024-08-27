import React, {useState} from 'react';
import {Switch, Text, TouchableOpacity, View} from 'react-native';

import {CrownIcon, RemoveIcon} from '../../../assets/icons';
import {useStyles} from '../../../hooks';
import stylesheet from './styles';

const GroupAdminActions = () => {
  const [canManageMembers, setCanManageMembers] = useState(false);
  const [canEditGroup, setCanEditGroup] = useState(false);
  const styles = useStyles(stylesheet);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <CrownIcon width={24} stroke="#4a90e2" height={24} />
          <Text style={styles.cardTitle}>Make Group Admin</Text>
        </View>
        <View style={styles.permissionItem}>
          <Text style={styles.permissionText}>Can manage members</Text>
          <Switch
            value={canManageMembers}
            onValueChange={setCanManageMembers}
            trackColor={{
              false: styles.switchTrack.backgroundColor,
              true: styles.switchTrackActive.backgroundColor,
            }}
            thumbColor={
              canManageMembers
                ? styles.switchThumbActive.backgroundColor
                : styles.switchThumb.backgroundColor
            }
          />
        </View>
        <View style={styles.permissionItem}>
          <Text style={styles.permissionText}>Can edit group</Text>
          <Switch
            value={canEditGroup}
            onValueChange={setCanEditGroup}
            trackColor={{
              false: styles.switchTrack.backgroundColor,
              true: styles.switchTrackActive.backgroundColor,
            }}
            thumbColor={
              canEditGroup
                ? styles.switchThumbActive.backgroundColor
                : styles.switchThumb.backgroundColor
            }
          />
        </View>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Make Admin</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <RemoveIcon stroke="red" />
          <Text style={styles.cardTitle}>Remove from Group</Text>
        </View>
        <TouchableOpacity style={[styles.actionButton, styles.removeButton]}>
          <Text style={styles.actionButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default GroupAdminActions;
