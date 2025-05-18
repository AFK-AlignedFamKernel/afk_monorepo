import { Connector, useConnect } from "@starknet-react/core"
import { FC, ReactNode } from "react"

const ConnectorButton: FC<{ connector: Connector; icon: ReactNode }> = ({
    connector,
    icon,
}) => {
    const { connectAsync } = useConnect()
    if (!connector?.available()) {
        return null
    }

    return (
        <button
            key={connector.id}
            onClick={async () => {
                await connectAsync({ connector })
            }}
            className="bg-raisin-black h-10 text-sm leading-4 font-medium gap-2 justify-center hover:#262933"
        //   hideChevron
        >
            <div className="flex items-center gap-2">
                {icon}
                {connector.name}
            </div>
        </button>
    )
}

export { ConnectorButton }