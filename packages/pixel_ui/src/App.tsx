import React, { useState, useEffect, useRef, useCallback } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import {
  useContract,
  useNetwork,
  useConnect,
} from '@starknet-react/core';
import './App.css';
import CanvasContainer from './canvas/CanvasContainer.js';
import PixelSelector from './footer/PixelSelector.js';
import TabsFooter from './footer/TabsFooter.js';
import TabPanel from './tabs/TabPanel.js';
import { usePreventZoom, useLockScroll } from './utils/Window.js';
import { backendUrl, wsUrl, devnetMode, provider, CHAIN_ID, allowedMethods, expiry, metaData, dappKey } from './utils/Consts.js';
import canvasConfig from './configs/canvas.config.json';
import { fetchWrapper, getTodaysStartTime } from './services/apiService.js';
import art_peace_abi from './contracts/art_peace.abi.json';
import username_store_abi from './contracts/username_store.abi.json';
import canvas_nft_abi from './contracts/canvas_nft.abi.json';
import NotificationPanel from './tabs/NotificationPanel.js';
import ModalPanel from './ui/ModalPanel.js';
import useMediaQuery from './hooks/useMediaQuery';
import { useAutoConnect, useQueryAddressEffect, useWalletStore } from './hooks/useWalletStore';

const logoUrl = './resources/logo.png'
const HamburgerUrl = './resources/icons/Hamburger.png';

interface IApp {
  contractAddress?: string;
  canvasAddress?: string;
  usernameAddress?: string;
  nftCanvasAddress?: string;
  factoryAddress?: string;
}

function App({ contractAddress, usernameAddress, nftCanvasAddress }: IApp) {
  // Window management
  usePreventZoom();
  const tabs = ['Canvas', 'Factions', 'Quests', 'Vote', 'NFTs', 'Account'];
  const [activeTab, setActiveTab] = useState(tabs[0]);
  useLockScroll(activeTab === 'Canvas');

  const isDesktopOrLaptop = useMediaQuery({
    query: '(min-width: 1224px)'
  });
  const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' });
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' });
  const isPortrait = useMediaQuery({ query: '(orientation: portrait)' });
  const isRetina = useMediaQuery({ query: '(min-resolution: 2dppx)' });
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
  const isFooterSplit = useMediaQuery({ query: '(max-width: 52rem)' });
  // TODO: height checks ?
  // TODO: Animate logo exit on mobile

  const [footerExpanded, setFooterExpanded] = useState(false);
  const [modal, setModal] = useState(null);

  const getDeviceTypeInfo = () => {
    return {
      isDesktopOrLaptop: isDesktopOrLaptop,
      isBigScreen: isBigScreen,
      isTabletOrMobile: isTabletOrMobile,
      isPortrait: isPortrait,
      isRetina: isRetina,
      isMobile: isMobile
    };
  };

  // Starknet wallet

  const { 
    connectWallet, 
    startSession,
    account, address,
    queryAddress,
    setConnected,
    isSessionable,
    disconnectWallet,
    usingSessionKeys 
  } = useWalletStore()

  //Connect
  useQueryAddressEffect()
  useAutoConnect()

  const { chain } = useNetwork();
  // const [queryAddress, setQueryAddress] = useState('0');
  // const [connected, setConnected] = useState(false); // TODO: change to only devnet
  // useEffect(() => {
  //   if (devnetMode) {
  //     if (connected) {
  //       setQueryAddress(
  //         '0328ced46664355fc4b885ae7011af202313056a7e3d44827fb24c9d3206aaa0'
  //       );
  //     } else {
  //       setQueryAddress('0');
  //     }
  //   } else {
  //     if (!address) {
  //       setQueryAddress('0');
  //     } else {
  //       setQueryAddress(address.slice(2).toLowerCase().padStart(64, '0'));
  //     }
  //   }
  // }, [address, connected]);

  // Contracts
  // TODO: Pull addrs from api?
  const { contract: artPeaceContract } = useContract({
    address: contractAddress ?? process.env.NEXT_PUBLIC_STARKNET_CONTRACT_ADDRESS,
    abi: art_peace_abi
  });
  const { contract: usernameContract } = useContract({
    address: usernameAddress ?? process.env.NEXT_PUBLIC_USERNAME_STORE_CONTRACT_ADDRESS,
    abi: username_store_abi
  });
  const { contract: canvasNftContract } = useContract({
    address: nftCanvasAddress ?? process.env.NEXT_PUBLIC_CANVAS_NFT_CONTRACT_ADDRESS,
    abi: canvas_nft_abi
  });

  const [currentDay, setCurrentDay] = useState(0);
  const [isLastDay, setIsLastDay] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [host, setHost] = useState('');
  const [endTimestamp, setEndTimestamp] = useState(0);
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        let response = await fetchWrapper('get-game-data');
        if (!response.data) {
          return;
        }
        setCurrentDay(response.data.day);
        if (devnetMode) {
          const days = 4;
          if (response.data.day >= days) {
            setGameEnded(true);
          } else if (response.data.day === days - 1) {
            setIsLastDay(true);
          }
        } else {
          let now = new Date();
          const result = await getTodaysStartTime();
          let dayEnd = new Date(result.data);
          dayEnd.setHours(dayEnd.getHours() + 24);
          // Now in seconds
          let nowInSeconds = Math.floor(now.getTime() / 1000);
          let dayEndInSeconds = Math.floor(dayEnd.getTime() / 1000);
          if (nowInSeconds >= response.data.endTime) {
            setGameEnded(true);
          } else if (dayEndInSeconds >= response.data.endTime) {
            setIsLastDay(true);
          }
        }
        setHost(response.data.host);
        setEndTimestamp(response.data.endTime);
      } catch(e) {
        console.error(e);
      }
    };
    fetchGameData();
  }, []);

  // Websocket
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(wsUrl, {
    share: false,
    shouldReconnect: (_e) => true,
    reconnectAttempts: 10,
    reconnectInterval: (attempt) => Math.min(10000, Math.pow(2, attempt) * 1000)
  });
  const [latestMintedTokenId, setLatestMintedTokenId] = useState(null);

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        event: 'subscribe',
        data: {
          channel: 'general'
        }
      });
    }
  }, [readyState]);

  // Colors
  const staticColors = canvasConfig.colors;
  const [colors, setColors] = useState<any[]>([]);

  const [notificationMessage, setNotificationMessage] = useState('');

  const fetchColors = async () => {
    try {
      let getColorsEndpoint = backendUrl + '/get-colors';
      let response = await fetch(getColorsEndpoint);
      let colors = await response.json();
      if (colors.error) {
        setColors(staticColors);
        console.error(colors.error);
        return;
      }
      if (colors.data) {
        setColors(colors.data);
      }
    } catch (error) {
      setColors(staticColors);
      console.error(error);
    }
  };
  useEffect(() => {
    fetchColors();
  }, []);

  useEffect(() => {
    const processMessage = async (message) => {
      if (message) {
        // Check the message type and handle accordingly
        if (message.messageType === 'colorPixel') {
          if (message.color >= colors.length) {
            // Get new colors from backend
            await fetchColors();
          }
          colorPixel(message.position, message.color);
        } else if (
          message.messageType === 'nftMinted' &&
          activeTab === 'NFTs'
        ) {
          if (message.minter === queryAddress) {
            setLatestMintedTokenId(message.token_id);
          }
        }
      }
    };

    processMessage(lastJsonMessage);
  }, [lastJsonMessage]);

  // Canvas
  const width = canvasConfig.canvas.width;
  const height = canvasConfig.canvas.height;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const extraPixelsCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const colorPixel = (position, color) => {
    const canvas = canvasRef.current;
    if (canvas && canvasRef?.current) {
      const context = canvas?.getContext('2d');
      if (context) {
        const x = position % width;
        const y = Math.floor(position / width);
        const colorIdx = color;
        const colorHex = `#${colors[colorIdx]}FF`;
        context.fillStyle = colorHex;
        context.fillRect(x, y, 1, 1);
      }
    }
  };

  //CallData
  const estimateInvokeFee = async ({
    contractAddress,
    entrypoint,
    calldata
  }) => {
    try {
      const { suggestedMaxFee } = await account.estimateInvokeFee({
        contractAddress: contractAddress,
        entrypoint: entrypoint,
        calldata: calldata
      });
      return { suggestedMaxFee };
    } catch (error) {
      console.error(error);
      return { suggestedMaxFee: BigInt(1000000000000000) };
    }
  };

  // Pixel selection data
  const [selectedColorId, setSelectedColorId] = useState(-1);
  const [pixelSelectedMode, setPixelSelectedMode] = useState(false);
  const [selectedPositionX, setSelectedPositionX] = useState(null);
  const [selectedPositionY, setSelectedPositionY] = useState(null);
  const [pixelPlacedBy, setPixelPlacedBy] = useState('');

  const [lastPlacedTime, setLastPlacedTime] = useState(0);
  const [basePixelUp, setBasePixelUp] = useState(false);
  const [chainFactionPixelsData, setChainFactionPixelsData] = useState<any[]>([]);
  const [chainFactionPixels, setChainFactionPixels] = useState<any[]>([]);
  const [factionPixelsData, setFactionPixelsData] = useState<any[]>([]);
  const [factionPixels, setFactionPixels] = useState<any[]>([]);
  const [extraPixels, setExtraPixels] = useState(0);
  const [availablePixels, setAvailablePixels] = useState(0);
  const [availablePixelsUsed, setAvailablePixelsUsed] = useState(0);
  const [extraPixelsData, setExtraPixelsData] = useState<any[]>([]);

  const [selectorMode, setSelectorMode] = useState(false);

  const [isEraserMode, setIsEraserMode] = React.useState(false);
  const [isExtraDeleteMode, setIsExtraDeleteMode] = React.useState(false);

  useEffect(() => {
    const getLastPlacedPixel = `get-last-placed-time?address=${queryAddress}`;
    async function fetchGetLastPlacedPixel() {
      try {
        const response = await fetchWrapper(getLastPlacedPixel);
        if (!response.data) {
          return;
        }
        const time = new Date(response.data);
        setLastPlacedTime(time?.getTime());
      } catch (e) {
        console.error(e);
      }
    }

    fetchGetLastPlacedPixel();
  }, [queryAddress]);

  const updateInterval = 1000; // 1 second
  // TODO: make this a config
  // const timeBetweenPlacements = 120000; // 2 minutes
  const timeBetweenPlacements = 11000; // 10 s
  const [basePixelTimer, setBasePixelTimer] = useState('XX:XX');
  useEffect(() => {
    const updateBasePixelTimer = () => {
      let timeSinceLastPlacement = Date.now() - lastPlacedTime;
      let basePixelAvailable = timeSinceLastPlacement > timeBetweenPlacements;

      if (basePixelAvailable) {
        setBasePixelUp(true);
        setBasePixelTimer('00:00');
        clearInterval(interval);
      } else {
        let secondsTillPlacement = Math.floor(
          (timeBetweenPlacements - timeSinceLastPlacement) / 1000
        );
        let minutes = Math.floor(secondsTillPlacement / 60);
        let seconds = secondsTillPlacement % 60;
        setBasePixelTimer(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        setBasePixelUp(false);
      }
    };

    const interval = setInterval(() => {
      updateBasePixelTimer();
    }, updateInterval);

    updateBasePixelTimer(); // Call immediately

    return () => clearInterval(interval);
  }, [lastPlacedTime, timeBetweenPlacements]);


  const [chainFactionPixelTimers, setChainFactionPixelTimers] = useState<string[]>([]);
  useEffect(() => {
    const updateChainFactionPixelTimers = () => {
      let newChainFactionPixelTimers: string[] = [];
      let newChainFactionPixels: any[] = [];
      for (let i = 0; i < chainFactionPixelsData.length; i++) {
        let memberPixels = chainFactionPixelsData[i].memberPixels;
        if (memberPixels !== 0) {
          newChainFactionPixelTimers.push('00:00');
          newChainFactionPixels.push(memberPixels);
          continue;
        }
        let lastPlacedTime = new Date(chainFactionPixelsData[i].lastPlacedTime)?.getTime();
        let timeSinceLastPlacement = Date.now() - lastPlacedTime;
        let chainFactionPixelAvailable =
          timeSinceLastPlacement > timeBetweenPlacements;
        if (chainFactionPixelAvailable) {
          newChainFactionPixelTimers.push('00:00');
          newChainFactionPixels.push(chainFactionPixelsData[i].allocation);
        } else {
          let secondsTillPlacement = Math.floor(
            (timeBetweenPlacements - timeSinceLastPlacement) / 1000
          );
          newChainFactionPixelTimers.push(
            `${Math.floor(secondsTillPlacement / 60)}:${secondsTillPlacement % 60 < 10 ? '0' : ''}${secondsTillPlacement % 60}`
          );
          newChainFactionPixels.push(0);
        }
      }
      setChainFactionPixelTimers(newChainFactionPixelTimers);
      setChainFactionPixels(newChainFactionPixels);
    };
    const interval = setInterval(() => {
      updateChainFactionPixelTimers();
    }, updateInterval);
    updateChainFactionPixelTimers();
    return () => clearInterval(interval);
  }, [chainFactionPixelsData]);

  const [factionPixelTimers, setFactionPixelTimers] = useState<any[]>([]);
  useEffect(() => {
    const updateFactionPixelTimers = () => {
      let newFactionPixelTimers: any[] = [];
      let newFactionPixels: any[] = [];
      for (let i = 0; i < factionPixelsData.length; i++) {
        let memberPixels = factionPixelsData[i].memberPixels;
        if (memberPixels !== 0) {
          newFactionPixelTimers.push('00:00');
          newFactionPixels.push(memberPixels);
          continue;
        }
        let lastPlacedTime = new Date(factionPixelsData[i].lastPlacedTime);
        let timeSinceLastPlacement = Date.now() - lastPlacedTime?.getTime();
        let factionPixelAvailable =
          timeSinceLastPlacement > timeBetweenPlacements;
        if (factionPixelAvailable) {
          newFactionPixelTimers.push('00:00');
          newFactionPixels.push(factionPixelsData[i].allocation);
        } else {
          let secondsTillPlacement = Math.floor(
            (timeBetweenPlacements - timeSinceLastPlacement) / 1000
          );
          newFactionPixelTimers.push(
            `${Math.floor(secondsTillPlacement / 60)}:${secondsTillPlacement % 60 < 10 ? '0' : ''}${secondsTillPlacement % 60}`
          );
          newFactionPixels.push(0);
        }
      }
      setFactionPixelTimers(newFactionPixelTimers);
      setFactionPixels(newFactionPixels);
    };
    const interval = setInterval(() => {
      updateFactionPixelTimers();
    }, updateInterval);
    updateFactionPixelTimers();
    return () => clearInterval(interval);
  }, [factionPixelsData]);

  useEffect(() => {
    let totalChainFactionPixels = 0;
    for (let i = 0; i < chainFactionPixels.length; i++) {
      totalChainFactionPixels += chainFactionPixels[i];
    }
    let totalFactionPixels = 0;
    for (let i = 0; i < factionPixels.length; i++) {
      totalFactionPixels += factionPixels[i];
    }
    setAvailablePixels(
      (basePixelUp ? 1 : 0) +
      totalChainFactionPixels +
      totalFactionPixels +
      extraPixels
    );
  }, [basePixelUp, chainFactionPixels, factionPixels, extraPixels]);

  useEffect(() => {
    async function fetchExtraPixelsEndpoint() {
      try {
        let extraPixelsResponse = await fetchWrapper(
          `get-extra-pixels?address=${queryAddress}`
        );
        if (!extraPixelsResponse.data) {
          setExtraPixels(0);
          return;
        }
        setExtraPixels(extraPixelsResponse.data);
      }
      catch (e) {
        console.error(e);
      }
    }
    fetchExtraPixelsEndpoint();

    async function fetchChainFactionPixelsEndpoint() {
      try {
        let chainFactionPixelsResponse = await fetchWrapper(
          `get-chain-faction-pixels?address=${queryAddress}`
        );
        if (!chainFactionPixelsResponse.data) {
          setChainFactionPixelsData([]);
          return;
        }
        setChainFactionPixelsData(chainFactionPixelsResponse.data);
      } catch (e) {
        console.error(e);
      }
    }
    fetchChainFactionPixelsEndpoint();

    async function fetchFactionPixelsEndpoint() {
      try {
        let factionPixelsResponse = await fetchWrapper(
          `get-faction-pixels?address=${queryAddress}`
        );
        if (!factionPixelsResponse.data) {
          setFactionPixelsData([]);
          return;
        }
        setFactionPixelsData(factionPixelsResponse.data);
      } catch (e) {
        console.error(e);
      }}
    fetchFactionPixelsEndpoint();
  }, [queryAddress]);

  const clearPixelSelection = () => {
    setSelectedColorId(-1);
    setSelectedPositionX(null);
    setSelectedPositionY(null);
    setPixelSelectedMode(false);
    setPixelPlacedBy('');
  };

  const setPixelSelection = async (x, y) => {
    setSelectedPositionX(x);
    setSelectedPositionY(y);
    setPixelSelectedMode(true);
    // TODO: move http fetch for pixel data here?

    try {
      let pixelInfo = await fetchWrapper(
        `get-pixel-info&position=${x+y*canvasConfig.canvas.width}`
      );
      console.log("pixelInfo data",pixelInfo)
    } catch (e) {
      console.error(e);
    }

  };

  const clearAll = () => {
    clearExtraPixels();
    setSelectedColorId(-1);
  };

  const clearExtraPixels = useCallback(() => {
    setAvailablePixelsUsed(0);
    setExtraPixelsData([]);

    const canvas = extraPixelsCanvasRef.current;
    if (canvas && canvasRef?.current) {
      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, width, height);
      }
    }

  }, [width, height]);

  const clearExtraPixel = useCallback(
    (index) => {
      setAvailablePixelsUsed(availablePixelsUsed - 1);
      setExtraPixelsData(extraPixelsData.filter((_, i) => i !== index));
      const canvas = extraPixelsCanvasRef.current;
      if (canvas) {
        const context = canvas.getContext('2d');
        if (context) {
          const pixel = extraPixelsData[index];
          const x = pixel.x;
          const y = pixel.y;
          context.clearRect(x, y, 1, 1);
        }

      }

    },
    [extraPixelsData, availablePixelsUsed]
  );

  const addExtraPixel = useCallback(
    (x, y) => {
      // Overwrite pixel if already placed
      const existingPixelIndex = extraPixelsData.findIndex(
        (pixel) => pixel.x === x && pixel.y === y
      );
      if (existingPixelIndex !== -1) {
        let newExtraPixelsData = [...extraPixelsData];
        newExtraPixelsData[existingPixelIndex].colorId = selectedColorId;
        setExtraPixelsData(newExtraPixelsData);
      } else {
        setAvailablePixelsUsed(availablePixelsUsed + 1);
        setExtraPixelsData([
          ...extraPixelsData,
          { x: x, y: y, colorId: selectedColorId }
        ]);
      }
    },
    [extraPixelsData, availablePixelsUsed, selectedColorId]
  );

  // Factions
  const [chainFaction, setChainFaction] = useState(null);
  const [userFactions, setUserFactions] = useState([]);
  useEffect(() => {
    async function fetchChainFaction() {
      try {
        let chainFactionResponse = await fetchWrapper(
          `get-my-chain-factions?address=${queryAddress}`
        );
        if (!chainFactionResponse.data) {
          return;
        }
        if (chainFactionResponse.data.length === 0) {
          return;
        }
        setChainFaction(chainFactionResponse.data[0]);
      } catch (e) {
        console.error(e);
      }}
    async function fetchUserFactions() {
      try {
        let userFactionsResponse = await fetchWrapper(
          `get-my-factions?address=${queryAddress}`
        );
        if (!userFactionsResponse.data) {
          return;
        }
        setUserFactions(userFactionsResponse.data);
      } catch (e) {
        console.error(e);
      }
    }
    fetchChainFaction();
    fetchUserFactions();
  }, [queryAddress]);

  // Templates
  const [templateOverlayMode, setTemplateOverlayMode] = useState(false);
  const [overlayTemplate, setOverlayTemplate] = useState(null);

  const [templateFaction, setTemplateFaction] = useState(null);
  const [templateImage, setTemplateImage] = useState(null);
  const [templateColorIds, setTemplateColorIds] = useState([]);
  const [templateCreationMode, setTemplateCreationMode] = useState(false);
  const [templateCreationSelected, setTemplateCreationSelected] =
    useState(false);
  const [templatePosition, setTemplatePosition] = useState(0);

  // NFTs
  const [nftMintingMode, setNftMintingMode] = useState(false);
  const [nftSelectionStarted, setNftSelectionStarted] = useState(false);
  const [nftSelected, setNftSelected] = useState(false);
  const [nftPosition, setNftPosition] = useState(null);
  const [nftWidth, setNftWidth] = useState(null);
  const [nftHeight, setNftHeight] = useState(null);


  // Account
  const { connectors } = useConnect();


  // Tabs
  const [showExtraPixelsPanel, setShowExtraPixelsPanel] = useState(false);

  useEffect(() => {
    // TODO: If selecting into other tab, ask to stop selecting?
    if (activeTab !== tabs[0] && showExtraPixelsPanel) {
      clearExtraPixels();
      setSelectedColorId(-1);
      setShowExtraPixelsPanel(false);
      return;
    }

    if (selectedColorId !== -1) {
      if (availablePixels > (basePixelUp ? 1 : 0)) {
        setActiveTab(tabs[0]);
        setShowExtraPixelsPanel(true);
        return;
      } else {
        setShowExtraPixelsPanel(false);
        return;
      }
    } else {
      if (availablePixelsUsed > 0) {
        setActiveTab(tabs[0]);
        setShowExtraPixelsPanel(true);
        return;
      } else {
        setShowExtraPixelsPanel(false);
        return;
      }
    }
  }, [
    activeTab,
    selectedColorId,
    availablePixels,
    availablePixelsUsed,
    basePixelUp
  ]);


  return (
    <div className='App'>
      <div className='App--background'>
        <NotificationPanel
          message={notificationMessage}
          animationDuration={5000}
        />
        {modal && <ModalPanel modal={modal} setModal={setModal} />}
        <CanvasContainer
          estimateInvokeFee={estimateInvokeFee}
          colorPixel={colorPixel}
          address={address}
          account={account}
          artPeaceContract={artPeaceContract}
          colors={colors}
          canvasRef={canvasRef}
          extraPixelsCanvasRef={extraPixelsCanvasRef}
          extraPixels={extraPixels}
          extraPixelsData={extraPixelsData}
          availablePixels={availablePixels}
          selectedColorId={selectedColorId}
          setSelectedColorId={setSelectedColorId}
          pixelSelectedMode={pixelSelectedMode}
          selectedPositionX={selectedPositionX}
          selectedPositionY={selectedPositionY}
          setPixelSelection={setPixelSelection}
          clearPixelSelection={clearPixelSelection}
          setPixelPlacedBy={setPixelPlacedBy}
          basePixelUp={basePixelUp}
          availablePixelsUsed={availablePixelsUsed}
          addExtraPixel={addExtraPixel}
          templateOverlayMode={templateOverlayMode}
          setTemplateOverlayMode={setTemplateOverlayMode}
          overlayTemplate={overlayTemplate}
          setOverlayTemplate={setOverlayTemplate}
          templateImage={templateImage}
          templateColorIds={templateColorIds}
          templateCreationMode={templateCreationMode}
          setTemplateCreationSelected={setTemplateCreationSelected}
          templateCreationSelected={templateCreationSelected}
          setTemplateCreationMode={setTemplateCreationMode}
          templatePosition={templatePosition}
          setTemplatePosition={setTemplatePosition}
          nftMintingMode={nftMintingMode}
          setNftMintingMode={setNftMintingMode}
          nftSelectionStarted={nftSelectionStarted}
          setNftSelectionStarted={setNftSelectionStarted}
          nftSelected={nftSelected}
          setNftSelected={setNftSelected}
          setNftPosition={setNftPosition}
          setNftWidth={setNftWidth}
          setNftHeight={setNftHeight}
          isEraserMode={isEraserMode}
          isExtraDeleteMode={isExtraDeleteMode}
          setIsEraserMode={setIsEraserMode}
          clearExtraPixel={clearExtraPixel}
          setLastPlacedTime={setLastPlacedTime}
        />
        {(!isMobile || activeTab === tabs[0]) && (
          <img src={logoUrl} alt='logo' className='App__logo--mobile' />
        )}
        <div
          className={
            'App__panel ' +
            (isTabletOrMobile ? 'App__panel--tablet ' : ' ') +
            (isPortrait ? 'App__panel--portrait ' : ' ') +
            (isMobile ? 'App__panel--mobile ' : ' ')
          }
        >
          <TabPanel
            colorPixel={colorPixel}
            address={address}
            queryAddress={queryAddress}
            account={account}
            chain={chain}
            clearAll={clearAll}
            setConnected={setConnected}
            artPeaceContract={artPeaceContract}
            usernameContract={usernameContract}
            canvasNftContract={canvasNftContract}
            usingSessionKeys={usingSessionKeys}
            setNotificationMessage={setNotificationMessage}
            colors={colors}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setModal={setModal}
            getDeviceTypeInfo={getDeviceTypeInfo}
            isMobile={isMobile}
            templateOverlayMode={templateOverlayMode}
            setTemplateOverlayMode={setTemplateOverlayMode}
            overlayTemplate={overlayTemplate}
            setOverlayTemplate={setOverlayTemplate}
            templateFaction={templateFaction}
            setTemplateFaction={setTemplateFaction}
            templateImage={templateImage}
            templatePosition={templatePosition}
            setTemplateImage={setTemplateImage}
            templateColorIds={templateColorIds}
            setTemplateColorIds={setTemplateColorIds}
            templateCreationMode={templateCreationMode}
            setTemplateCreationMode={setTemplateCreationMode}
            templateCreationSelected={templateCreationSelected}
            setTemplateCreationSelected={setTemplateCreationSelected}
            nftMintingMode={nftMintingMode}
            setNftMintingMode={setNftMintingMode}
            nftSelectionStarted={nftSelectionStarted}
            setNftSelectionStarted={setNftSelectionStarted}
            nftSelected={nftSelected}
            setNftSelected={setNftSelected}
            nftPosition={nftPosition}
            nftWidth={nftWidth}
            nftHeight={nftHeight}
            showSelectedPixelPanel={
              !isPortrait
                ? pixelSelectedMode || isEraserMode
                : (pixelSelectedMode || isEraserMode) && activeTab === tabs[0]
            }
            selectedPositionX={selectedPositionX}
            selectedPositionY={selectedPositionY}
            setSelectedColorId={setSelectedColorId}
            clearPixelSelection={clearPixelSelection}
            pixelPlacedBy={pixelPlacedBy}
            showExtraPixelsPanel={showExtraPixelsPanel}
            extraPixelsData={extraPixelsData}
            clearExtraPixels={clearExtraPixels}
            clearExtraPixel={clearExtraPixel}
            selectorMode={selectorMode}
            setSelectorMode={setSelectorMode}
            isEraserMode={isEraserMode}
            setIsEraserMode={setIsEraserMode}
            setIsExtraDeleteMode={setIsExtraDeleteMode}
            basePixelUp={basePixelUp}
            basePixelTimer={basePixelTimer}
            chainFactionPixels={chainFactionPixels}
            factionPixels={factionPixels}
            setChainFactionPixels={setChainFactionPixels}
            setFactionPixels={setFactionPixels}
            setPixelSelection={setPixelSelection}
            extraPixels={extraPixels}
            setExtraPixels={setExtraPixels}
            availablePixels={availablePixels}
            availablePixelsUsed={availablePixelsUsed}
            setLastPlacedTime={setLastPlacedTime}
            chainFactionPixelsData={chainFactionPixelsData}
            factionPixelsData={factionPixelsData}
            setChainFactionPixelsData={setChainFactionPixelsData}
            setFactionPixelsData={setFactionPixelsData}
            chainFactionPixelTimers={chainFactionPixelTimers}
            factionPixelTimers={factionPixelTimers}
            chainFaction={chainFaction}
            setChainFaction={setChainFaction}
            userFactions={userFactions}
            setUserFactions={setUserFactions}
            latestMintedTokenId={latestMintedTokenId}
            setLatestMintedTokenId={setLatestMintedTokenId}
            connectWallet={connectWallet}
            connectors={connectors}
            currentDay={currentDay}
            gameEnded={gameEnded}
            isLastDay={isLastDay}
            endTimestamp={endTimestamp}
            host={host}

            startSession={startSession}
            isSessionable={isSessionable}
            disconnectWallet={disconnectWallet}
            estimateInvokeFee={estimateInvokeFee}
        
          />
        </div>
        <div className='App__footer'>
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: `${footerExpanded && isFooterSplit ? 'space-between' : 'center'}`,
              alignItems: `${footerExpanded && isFooterSplit ? 'flex-end' : 'center'}`
            }}
          >
            {!gameEnded && (
              <PixelSelector
                colors={colors}
                selectedColorId={selectedColorId}
                setSelectedColorId={setSelectedColorId}
                getDeviceTypeInfo={getDeviceTypeInfo}
                extraPixels={extraPixels}
                selectorMode={selectorMode}
                setSelectorMode={setSelectorMode}
                setIsEraserMode={setIsEraserMode}
                availablePixels={availablePixels}
                availablePixelsUsed={availablePixelsUsed}
                basePixelUp={basePixelUp}
                setBasePixelUp={setBasePixelUp}
                lastPlacedTime={lastPlacedTime}
                basePixelTimer={basePixelTimer}
                queryAddress={queryAddress}
                setActiveTab={setActiveTab}
                isEraserMode={isEraserMode}
                setIsEraseMode={setIsEraserMode}
                isPortrait={isPortrait}
                isMobile={isMobile}
                clearAll={clearAll}
                
              />
            )}
            {isFooterSplit && !footerExpanded && (
              <div
                className='Button__primary ExpandTabs__button'
                onClick={() => {
                  setActiveTab(tabs[0]);
                  setFooterExpanded(!footerExpanded);
                }}
              >
                <img src={HamburgerUrl} alt='Tabs' className='ExpandTabs__icon' />
              </div>
            )}
            {isFooterSplit && footerExpanded && (
              <TabsFooter
                tabs={tabs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                getDeviceTypeInfo={getDeviceTypeInfo}
                isFooterSplit={isFooterSplit}
                setFooterExpanded={setFooterExpanded}
              />
            )}
          </div>
          {!isFooterSplit && (
            <TabsFooter
              tabs={tabs}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              getDeviceTypeInfo={getDeviceTypeInfo}
              isFooterSplit={isFooterSplit}
              setFooterExpanded={setFooterExpanded}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
