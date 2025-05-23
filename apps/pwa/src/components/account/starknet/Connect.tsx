import { useAccount, useConnect, useDisconnect } from "@starknet-react/core"
import Image from "next/image"
import { useEffect, useState } from "react"
import { ConnectorButton } from "./ConnectorButton"
import { ConnectStarknetkitModal } from "./ConnectStarknetkitModal"

const Connect = () => {
    const { isConnected } = useAccount()
    const { connectors } = useConnect()
    const { disconnect } = useDisconnect({})
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    if (!isClient) {
        return <></>
    }

    return (
        <div className="gap-3">
            <div className="flex column gap-3">
                <div className="flex flex-col md:flex-row gap-3">
                    <ConnectStarknetkitModal />
                    <button
                        className={`w-full ${!isConnected ? "disabled" : ""} justify-center`}
                        onClick={() => disconnect()}
                        disabled={!isConnected}
                    // hideChevron
                    // leftIcon={<DisconnectIcon />}
                    >
                        Disconnect
                    </button>
                </div>
                <div className="flex column w-full p-3 border border-solid border-raisin-black gap-5 rounded-xl">
                    <span className="text-base font-medium leading-6 text-left">
                        Starknet-react connectors
                    </span>
                    <div className="grid grid-cols-connectors-grid gap-4">
                        {connectors.map((connector, index) => {
                            const icon =
                                typeof connector?.icon === "string"
                                    ? connector?.icon
                                    : connector?.icon?.dark || ""
                            const isSvg = icon?.startsWith("<svg")
                            return (
                                <ConnectorButton
                                    key={connector?.id ?? index}
                                    connector={connector}
                                    icon={
                                        <>
                                            {isSvg ? (
                                                <div
                                                    dangerouslySetInnerHTML={{ __html: icon }}
                                                    className="connector-icon"
                                                />
                                            ) : (
                                                <Image
                                                    alt={connector?.name}
                                                    src={icon}
                                                    height={17}
                                                    width={17}
                                                />
                                            )}
                                        </>
                                    }
                                />
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

export { Connect }