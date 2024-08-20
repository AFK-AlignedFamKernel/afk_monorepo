import { useSettingsStore } from 'afk_nostr_sdk';
import { useState } from 'react';
import { View } from 'react-native';
import { useToast } from '../../hooks/modals';
import { Input } from '../Input';
import { Text } from '../Text';
import { useStyles } from '../../hooks';
import { Button } from '../Button';
import { AFK_RELAYS } from 'afk_nostr_sdk/src/utils/relay';
import stylesheet from './styles';

export const RelaysConfig: React.FC = () => {
  const { showToast } = useToast();
  const styles = useStyles(stylesheet)
  const { relays, setRelays } = useSettingsStore();
  const RELAYS_USED = relays;
  const AFK_DEFAULT_RELAYS = AFK_RELAYS;
  const [relaysUpdated, setRelaysUpdated] = useState<string[]>(relays)
  const [openUpdateMenu, setOpenUpdateMenu] = useState<boolean>(false)
  const [relayToAdd, setRelayToAdd] = useState<string | undefined>()

  const removeRelay = (relay: string) => {
    const newRelays = relaysUpdated.filter((r) => r != relay)
    console.log("newRelays")
    setRelaysUpdated(newRelays)
  }

  const addRelay = (relay?: string) => {
    if (!relay) {
      showToast({ type: "error", title: 'Add a relay' });
      return;
    }
    if (!relay?.includes("wss://")) {
      showToast({ type: "error", title: 'add wss://' });
      return;
    }
    const newRelays = [...relaysUpdated, relay]
    /** @TODO add verify validity of the relayer */

    setRelaysUpdated(newRelays)
  }

  const updateRelayToUsed = () => {
    setRelays(relaysUpdated)
  }

  const resetDefault = () => {
    setRelays(AFK_DEFAULT_RELAYS)
    setRelaysUpdated(AFK_DEFAULT_RELAYS)
  }

  const handleOpenMenu = () => {
    setOpenUpdateMenu(!openUpdateMenu)
  }

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>AFK: All relays used</Text>
        {RELAYS_USED?.map((r, i) => {
          return (
            <View style={styles.relayItem} key={i}>
              <Text style={styles.text}>
                Relay: {r}
              </Text>
            </View>
          );
        })}
      </View>
      <View>
        <Text>You can setup your relays</Text>
        <Button
          style={{ width: "auto" }}
          onPress={handleOpenMenu}
        >
          <Text>Open menu</Text>
        </Button>
      </View>

      {openUpdateMenu &&
        <View>
          {relaysUpdated?.map((r, i) => {
            return (
              <View style={styles.relayItem} key={i}>
                <Text style={styles.text}>
                  Relay: {r}
                </Text>

                <Button
                  style={{
                    width: "auto",
                    marginHorizontal: 5
                  }}
                  onPress={() => removeRelay(r)}
                >
                  <Text>Remove</Text>
                </Button>
              </View>
            );
          })}
          <Input
            right={
              <Button onPress={() => addRelay(relayToAdd)}>
                <Text>Add this relay</Text>
              </Button>
            }
            value={relayToAdd}
            onChangeText={setRelayToAdd}
            placeholder="Relay"
          />

          <Button
            style={styles.button}
            onPress={updateRelayToUsed}>
            <Text>Update my relay</Text>
          </Button>

          <Button
            style={styles.button}
            onPress={resetDefault}
          >
            <Text>Reuse default AFK relay</Text>
          </Button>
        </View>
      }

    </View>
  );
};
