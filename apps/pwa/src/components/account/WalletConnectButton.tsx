import { useConnect } from "@starknet-react/core"
import { StarknetkitConnector, useStarknetkitConnectModal } from "starknetkit"
import { ConnectStarknetkitModal } from "./starknet/ConnectStarknetkitModal"
import { Connect } from "./starknet/Connect"
import { WalletConnector } from "./starknet/WalletConnector"
import { WalletConnectButtonController } from "./starknet/WalletConnectButton"

export function WalletConnectButton() {
  const { connectAsync, connectors } = useConnect()

  const { starknetkitConnectModal } = useStarknetkitConnectModal({
    connectors: connectors as StarknetkitConnector[],
    modalTheme: "dark",
  })
  return <WalletConnectButtonController />
}