import * as React from 'react';
import { Image, Text, TouchableOpacity, View, FlatList, Animated, Modal } from 'react-native';

import { useStyles, useWindowDimensions } from '../../hooks';
import { Icon } from '../Icon';
import stylesheet from './styles';
import CustomProfileMenu from '../Starknet/CustomProfile';
import { Avatar } from '../Avatar';
import { NostrKeyManager, useAuth } from 'afk_nostr_sdk';
import { useCallback, useMemo } from 'react';
import { Modalize } from '../Modalize';
import { TipSuccessModalProps } from 'src/modules/TipSuccessModal';
import { Menu } from '../Menu';
interface CustomHeaderInterface {
  title?: string;
  navigation?: any;
  showLogo?: boolean;
  isModalMode?: boolean;
}
export type NostrProfileModal = Modalize;


export const NostrProfile = ({ title, navigation, showLogo, isModalMode }: CustomHeaderInterface) => {
  const styles = useStyles(stylesheet);
  const dimensions = useWindowDimensions();
  const isDesktop = React.useMemo(() => {
    return dimensions.width >= 1024;
  }, [dimensions]); // Adjust based on your breakpoint for desktop
  const { publicKey, setAuth } = useAuth();

  const [isOpenProfile, setIsOpenProfile] = React.useState(false);
  const nostrAccounts = NostrKeyManager.getNostrAccountsFromStorage();
  console.log('nostrAccounts', nostrAccounts);
  console.log('isOpenProfile', isOpenProfile);

  const handleIsOpenProfile = () => {
    if (isOpenProfile) {
      show()
    } else {
      hide()
    }
    setIsOpenProfile(!isOpenProfile)

  }

  const [user, setUser] = React.useState(null);
  const [successModal, setSuccessModal] = React.useState<TipSuccessModalProps | null>(null);

  const nostrProfileModalRef = React.useRef<NostrProfileModal>(null);

  const [expanded, setExpanded] = React.useState(false);
  const animation = new Animated.Value(0);

  const nostrProfiles = useMemo(() => {
    if (!nostrAccounts) return [];

    const users = [];
    for (const [key, value] of Object.entries(nostrAccounts)) {
      users.push(value)
    }
    // for (const account of nostrAccounts) {
    //   // Loop through each key in the account object
    //   for (const [key, value] of Object.entries(account)) {
    //     users.push(value)
    //   }
    // }
    return users;
  }, [nostrAccounts])
  console.log('nostrProfiles', nostrProfiles);

  const toggleAccordion = () => {
    setExpanded(!expanded);
    Animated.timing(animation, {
      toValue: expanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };


  const heightInterpolation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, nostrProfiles?.length * 40], // Adjust height based on items count
  });


  const show = useCallback(() => {
    nostrProfileModalRef.current?.open();
  }, []);

  const hide = useCallback(() => {
    nostrProfileModalRef.current?.close();
  }, []);

  const showSuccess = useCallback((props: TipSuccessModalProps) => {
    setSuccessModal(props);
  }, []);

  const hideSuccess = useCallback(() => {
    setSuccessModal(null);
  }, []);


  // const navigation = useNavigation<DrawerNavigationConfig>()
  return (
    <View style={styles.container}>



      {/* <Modalize

        style={styles.modal}
        modalStyle={{
          maxWidth: 700,
          height: '100%',
          width: '100%',
          borderRadius: 20,
          marginLeft: 'auto',
          marginRight: 'auto',
          // marginBottom: 20,
        }}
        childrenStyle={styles.modal}
        modalTopOffset={0}
        adjustToContentHeight={true}
        ref={nostrProfileModalRef}

      >
        <View style={styles.modalContent}>
          <Text>Nostr profile</Text>
          <Animated.View style={[styles.content, { height: heightInterpolation }]}>
            {nostrProfiles && nostrProfiles?.length > 0 && nostrProfiles?.map((item: any, index) => (
              <View key={index} style={styles.item}>
                <Text>{item?.publicKey}</Text>
                <Text>{item?.name}</Text>
                <Text>{item?.username}</Text>
              </View>
            ))}
          </Animated.View>
          <FlatList
            style={styles.listProfile}
            data={nostrAccounts}
            renderItem={({ item }) => {
              return (
                <View>
                  <Text>{item.publicKey}</Text>
                </View>
              )
            }}
          >
          </FlatList>
        </View>
      </Modalize> */}
      {/* <Menu
        handle={<TouchableOpacity onPress={() => {
          handleIsOpenProfile()
        }}>
          <Text style={styles.text}>{isOpenProfile ? 'Close' : 'Open'}</Text>
        </TouchableOpacity>}
        open={isOpenProfile}
      >

      </Menu> */}

      <Modal
        animationType="fade"
        // transparent={true}
        visible={isOpenProfile && isModalMode}
        onRequestClose={() => {
          handleIsOpenProfile()
        }}
        style={styles.modal}
      >
        <View
          style={styles.modalContent}
        >


          <TouchableOpacity onPress={() => {
            handleIsOpenProfile()
            toggleAccordion()
          }}>
            <Text style={styles.text}>{isOpenProfile ? 'Close' : 'Open'}</Text>
          </TouchableOpacity>
          <View style={{ ...styles.modalContent, height: '50%', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Text style={styles.text}>Accounts</Text>
            <Animated.View style={[styles.content, { height: heightInterpolation }]}>
              {nostrProfiles && nostrProfiles?.length > 0 && nostrProfiles?.map((item: any, index) => (
                <View key={index} style={styles.item}>
                  <Text style={styles.text}>{item?.publicKey}</Text>
                  <Text style={styles.text}>{item?.name}</Text>
                  <Text style={styles.text}>{item?.username}</Text>
                </View>
              ))}
            </Animated.View>
            <FlatList
              style={styles.listProfile}
              data={nostrProfiles}
              renderItem={({ item }: any) => {
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setAuth(item?.publicKey, item?.secretKey)
                      handleIsOpenProfile()
                    }}
                    style={styles.profileItemRow}>
                    <Text style={styles.text}>{item?.publicKey?.slice(0, 8)}...{item?.publicKey?.slice(-8)}</Text>
                  </TouchableOpacity>
                )
              }}
            >
            </FlatList>
          </View>
        </View>
      </Modal>
      <View style={styles.rightContainer}>
        <View style={styles.profileContainer}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => {
              // navigation?.navigate('Profile')
              // setIsOpenProfile(!isOpenProfile)
              handleIsOpenProfile()
            }}
          >
            <View style={styles.avatarContainer}>
              <Avatar
                // style={styles.avatar}
                source={require('../../assets/pepe-uhoh.png')}
              // defaultSource={require('../../assets/pepe-uhoh.png')}
              />
            </View>


            <Icon name="ChevronDown" size={16} />

            {publicKey && (
              <Text style={styles.text}>{publicKey?.slice(0, 8)}...{publicKey?.slice(-8)}</Text>
            )}
          </TouchableOpacity>





          {/* {isOpenProfile && (

            <View>
              <Text>Nostr profile</Text>
              <Animated.View style={[styles.content, { height: heightInterpolation }]}>
                {nostrProfiles && nostrProfiles?.length > 0 && nostrProfiles?.map((item: any, index) => (
                  <View key={index} style={styles.item}>
                    <Text>{item?.publicKey}</Text>
                    <Text>{item?.name}</Text>
                    <Text>{item?.username}</Text>
                  </View>
                ))}
              </Animated.View>
              <FlatList
                style={styles.listProfile}
                data={nostrAccounts}
                renderItem={({ item }) => {
                  return (
                    <View>
                      <Text>{item.publicKey}</Text>
                    </View>
                  )
                }}
              >
              </FlatList>
            </View>

          )} */}
        </View>
      </View>



      {!isModalMode && isOpenProfile && (
        <View>
          <Text style={styles.text}>Accounts</Text>
          <Animated.View style={[styles.content, { height: heightInterpolation }]}>
            {nostrProfiles && nostrProfiles?.length > 0 && nostrProfiles?.map((item: any, index) => (
              <View key={index} style={styles.item}>
                <Text style={styles.text}>{item?.publicKey}</Text>
                <Text style={styles.text}>{item?.name}</Text>
                <Text style={styles.text}>{item?.username}</Text>
              </View>
            ))}
          </Animated.View>
        </View>
      )}

    </View>
  );
};
