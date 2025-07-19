"use client"
import { ARGENT_WEBWALLET_URL, CHAIN_ID } from "@/constants/index"
import {
  isInArgentMobileAppBrowser,
  ArgentMobileConnector,
} from "starknetkit/argentMobile"
import {
  BraavosMobileConnector,
  isInBraavosMobileAppBrowser,
} from "starknetkit/braavosMobile"
import { InjectedConnector } from "starknetkit/injected"
import { WebWalletConnector } from "starknetkit/webwallet"
// import { CartridgeConnector } from "starknetkit/cartridge"
import { getStarknet } from "@starknet-io/get-starknet-core"
// import { ControllerConnector } from "@cartridge/connector"
// import { sepolia, mainnet } from "@starknet-react/chains";
// import {
//   StarknetConfig,
//   publicProvider,
//   argent,
//   braavos,
//   useInjectedConnectors,
//   voyager,
//   Connector,
//   jsonRpcProvider,
//   cartridgeProvider,
// } from "@starknet-react/core";
import cartridgeConnector from "./CartbridgeConnector"

const isMobileDevice = () => {
  if (typeof window === "undefined") {
    return false
  }
  getStarknet()
  // Primary method: User Agent + Touch support check
  const userAgent = navigator.userAgent.toLowerCase()
  const isMobileUA =
    /android|webos|iphone|ipad|ipod|blackberry|windows phone/.test(userAgent)
  const hasTouchSupport =
    "ontouchstart" in window || navigator.maxTouchPoints > 0

  // Backup method: Screen size
  const isSmallScreen = window.innerWidth <= 768

  // Combine checks: Must match user agent AND (touch support OR small screen)
  return isMobileUA && (hasTouchSupport || isSmallScreen)
}

export const availableConnectors = () => {
  if (isInArgentMobileAppBrowser()) {
    return [
      ArgentMobileConnector.init({
        options: {
          url: typeof window !== "undefined" ? window.location.href : "",
          dappName: "Example dapp",
          chainId: CHAIN_ID,
        },
      }),
    ]
  }

  if (isInBraavosMobileAppBrowser()) {
    return [BraavosMobileConnector.init({})]
  }

  return [
    new InjectedConnector({ options: { id: "argentX" } }),
    new InjectedConnector({ options: { id: "braavos" } }),
    new InjectedConnector({ options: { id: "metamask" } }),
    ArgentMobileConnector.init({
      options: {
        url: typeof window !== "undefined" ? window.location.href : "",
        dappName: "Example dapp",
        chainId: CHAIN_ID,
      },
    }),
    isMobileDevice() ? BraavosMobileConnector.init({}) : null,
    new WebWalletConnector({ url: ARGENT_WEBWALLET_URL, theme: "dark" }),
    // cartridgeConnector
  ].filter((connector) => connector !== null)
}

export const connectors = availableConnectors()