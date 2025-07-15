import { useConnect, Connector } from "@starknet-react/core"
import {  StarknetkitConnector, useStarknetkitConnectModal } from "starknetkit"
import { connectors } from "../../../context/connectors"

const ConnectStarknetkitModal = () => {
  const { connectAsync, connectors:connectorsConnect } = useConnect()

  console.log(connectors)
  const { starknetkitConnectModal } = useStarknetkitConnectModal({
    connectors: connectors as any[],
    modalTheme: "dark",
    modalMode: "alwaysAsk"
  })

  return (
    <button
      className="w-full justify-center btn btn-primary"
      onClick={async () => {
        const { connector } = await starknetkitConnectModal()
        // if (!connector) {
        //   // or throw error
        //   return
        // }
        await connectAsync({ connector })
      }}
    // hideChevron
    >
      Connect
    </button>
  )
}

export { ConnectStarknetkitModal }