import {useSettingsStore} from 'afk_nostr_sdk';
import {AFK_RELAYS} from 'afk_nostr_sdk/src/utils/relay';
import {useState} from 'react';
import {ScrollView, View} from 'react-native';

import {useStyles, useWindowDimensions} from '../../hooks';
import {useToast} from '../../hooks/modals';
import {Button} from '../Button';
import {Input} from '../Input';
import {Text} from '../Text';
import stylesheet from './styles';

export const RelaysConfig: React.FC = () => {
  const {showToast} = useToast();
  const styles = useStyles(stylesheet);
  const {relays, setRelays} = useSettingsStore();
  const RELAYS_USED = relays;
  const AFK_DEFAULT_RELAYS = AFK_RELAYS;
  const [relaysUpdated, setRelaysUpdated] = useState<string[]>(relays);
  const [openUpdateMenu, setOpenUpdateMenu] = useState<boolean>(false);
  const [relayToAdd, setRelayToAdd] = useState<string | undefined>();

  const {width} = useWindowDimensions();

  const removeRelay = (relay: string) => {
    const newRelays = relaysUpdated.filter((r) => r != relay);
    console.log('newRelays');
    setRelaysUpdated(newRelays);
  };

  const addRelay = (relay?: string) => {
    if (!relay) {
      showToast({type: 'error', title: 'Add a relay'});
      return;
    }
    if (!relay?.includes('wss://')) {
      showToast({type: 'error', title: 'add wss://'});
      return;
    }
    const newRelays = [...relaysUpdated, relay];
    /** @TODO add verify validity of the relayer */

    setRelaysUpdated(newRelays);
    setRelayToAdd('');
  };

  const updateRelayToUsed = () => {
    setRelays(relaysUpdated);
    showToast({type: 'success', title: 'Relays updated!'});
  };

  const resetDefault = () => {
    setRelays(AFK_DEFAULT_RELAYS);
    setRelaysUpdated(AFK_DEFAULT_RELAYS);
    showToast({type: 'success', title: 'Relays have been reset to default'});
  };

  const handleOpenMenu = () => {
    setOpenUpdateMenu(!openUpdateMenu);
  };

  return (
    <View style={styles.container}>
      <View>
        <Text weight="bold" style={styles.title}>
          AFK: All relays used
        </Text>
      </View>

      {!openUpdateMenu && (
        <ScrollView
          style={styles.codeBox}
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
        >
          {RELAYS_USED?.map((r, i) => {
            return (
              <pre key={i} style={styles.codeBoxText}>
                Relay: {r}
              </pre>
            );
          })}
        </ScrollView>
      )}

      {!openUpdateMenu && (
        <View style={{alignItems: width >= 600 ? 'center' : undefined}}>
          <Button onPress={handleOpenMenu} small>
            <Text>Open menu to setup relays</Text>
          </Button>
        </View>
      )}

      {openUpdateMenu && (
        <View>
          <View style={styles.editCodeBox}>
            <ScrollView
              style={styles.editCodeBoxRelays}
              showsVerticalScrollIndicator={true}
              persistentScrollbar={true}
            >
              {relaysUpdated?.map((r, i) => {
                return (
                  <pre key={i} style={styles.codeBoxText}>
                    Relay: {r}
                    <View style={{alignItems: 'flex-start'}}>
                      <Button
                        small
                        style={{
                          width: 'auto',
                          paddingVertical: 6,
                          paddingHorizontal: 12,
                        }}
                        textStyle={{
                          fontSize: 12,
                        }}
                        onPress={() => removeRelay(r)}
                        // children="Remove"
                      >
                        <Text>Remove</Text>
                      </Button>
                    </View>
                  </pre>
                );
              })}
            </ScrollView>

            <Input
              style={styles.relayInput}
              inputStyle={{fontSize: 12}}
              right={
                <Button
                  small
                  style={{
                    width: 'auto',
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                  }}
                  textStyle={{
                    fontSize: 12,
                  }}
                  onPress={() => addRelay(relayToAdd)}
                  // children="+"
                >
                  +
                </Button>
              }
              paddingRight={false}
              value={relayToAdd}
              onChangeText={setRelayToAdd}
              placeholder="Relay"
            />
          </View>

          <View
            style={[styles.relayButtonContainer, {flexDirection: width >= 600 ? 'row' : 'column'}]}
          >
            <View style={{alignItems: width >= 600 ? 'center' : undefined}}>
              <Button onPress={updateRelayToUsed} small>
                <Text>Update my relay</Text>
              </Button>
            </View>

            <View style={{alignItems: width >= 600 ? 'center' : undefined}}>
              <Button onPress={resetDefault} small>
                <Text>Reuse default AFK relay</Text>
              </Button>
            </View>

            <View style={{alignItems: width >= 600 ? 'center' : undefined}}>
              <Button onPress={handleOpenMenu} small>
                <Text>Close Menu</Text>
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};
